/** Daily off-host backup. Only authenticated ciphertext is uploaded to R2. */
import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { appendFile, link, lstat, mkdir, open, readFile, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pipeline } from "node:stream/promises";
import { pathToFileURL } from "node:url";
import { parseEnv } from "node:util";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

const MAGIC = Buffer.from("AURA-BACKUP-V1\0", "ascii");
const IV_BYTES = 12;
const TAG_BYTES = 16;
class BackupError extends Error {}
const assert = (condition, message) => { if (!condition) throw new BackupError(message); };
export function encryptionKey(value) {
  assert(typeof value === "string", "BACKUP_ENCRYPTION_KEY is required; recover it from the private recovery copy.");
  const key = Buffer.from(value, "base64");
  assert(key.length === 32 && key.toString("base64") === value, "BACKUP_ENCRYPTION_KEY must be canonical base64 for exactly 32 random bytes.");
  return key;
}
async function privateDirectory(directory) {
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const stat = await lstat(directory);
  assert(stat.isDirectory() && !(stat.mode & 0o077), "Backup work directory must be private (0700) and cannot be a symlink.");
}
async function exclusivePublish(temporary, output) {
  // link is atomic and refuses existing destinations; rename could overwrite one.
  await link(temporary, output);
  await rm(temporary);
}
export async function encryptFile(source, output, key) {
  assert(key.length === 32, "Encryption key must contain 32 bytes.");
  const iv = randomBytes(IV_BYTES);
  const header = Buffer.concat([MAGIC, iv]);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(header);
  const temporary = `${output}.partial-${randomUUID()}`;
  try {
    const handle = await open(temporary, "wx", 0o600);
    try { await handle.writeFile(header); } finally { await handle.close(); }
    await pipeline(createReadStream(source), cipher, createWriteStream(temporary, { flags: "a", mode: 0o600 }));
    await appendFile(temporary, cipher.getAuthTag());
    await exclusivePublish(temporary, output);
  } finally { await rm(temporary, { force: true }); }
}
export async function decryptFile(source, output, key) {
  const stat = await lstat(source);
  const headerSize = MAGIC.length + IV_BYTES;
  assert(stat.isFile() && stat.size >= headerSize + TAG_BYTES, "Invalid encrypted backup file.");
  const header = Buffer.alloc(headerSize);
  const tag = Buffer.alloc(TAG_BYTES);
  const handle = await open(source, "r");
  try {
    await handle.read(header, 0, header.length, 0);
    await handle.read(tag, 0, tag.length, stat.size - TAG_BYTES);
  } finally { await handle.close(); }
  assert(header.subarray(0, MAGIC.length).equals(MAGIC), "Unsupported backup format.");
  const decipher = createDecipheriv("aes-256-gcm", key, header.subarray(MAGIC.length));
  decipher.setAAD(header);
  decipher.setAuthTag(tag);
  const temporary = `${output}.partial-${randomUUID()}`;
  try {
    await pipeline(
      createReadStream(source, { start: headerSize, end: stat.size - TAG_BYTES - 1 }),
      decipher,
      createWriteStream(temporary, { flags: "wx", mode: 0o600 }),
    );
    // A failed authentication tag never becomes a published plaintext file.
    await exclusivePublish(temporary, output);
  } finally { await rm(temporary, { force: true }); }
}
async function sha256(body) {
  const hash = createHash("sha256");
  for await (const chunk of body) hash.update(chunk);
  return hash.digest("hex");
}
async function assertArchive(path) {
  const stat = await lstat(path);
  assert(stat.isFile() && !(stat.mode & 0o077), "PostgreSQL dump must be a private regular file (0600), not a symlink.");
  const header = Buffer.alloc(5);
  const handle = await open(path, "r");
  try { await handle.read(header, 0, 5, 0); } finally { await handle.close(); }
  assert(header.toString("ascii") === "PGDMP", "Refusing upload: expected a PostgreSQL custom-format dump.");
}
function storage(env) {
  for (const name of ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET"])
    assert(env[name], `${name} is required.`);
  return new S3Client({
    region: "auto",
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY },
  });
}
export function backupObjectKeys(now = new Date()) {
  const day = now.toISOString().slice(0, 10);
  const suffix = `${now.toISOString().replace(/[:.]/g, "-")}-${randomUUID()}.aura.enc`;
  const keys = [`backups/daily/${day}/${suffix}`];
  if (now.getUTCDay() === 0) {
    const monday = new Date(now);
    monday.setUTCDate(monday.getUTCDate() - 6);
    keys.push(`backups/weekly/${monday.toISOString().slice(0, 10)}/${suffix}`);
  }
  return keys;
}
export async function uploadBackup({ archivePath, env, workDirectory, now = new Date(), client }) {
  const key = encryptionKey(env.BACKUP_ENCRYPTION_KEY);
  await assertArchive(archivePath);
  await privateDirectory(workDirectory);
  const encrypted = resolve(workDirectory, `${randomUUID()}.aura.enc`);
  const ownedClient = !client;
  client ??= storage(env);
  try {
    await encryptFile(archivePath, encrypted, key);
    const size = (await lstat(encrypted)).size;
    const digest = await sha256(createReadStream(encrypted));
    const keys = backupObjectKeys(now);
    for (const objectKey of keys) {
      const body = createReadStream(encrypted);
      try {
        await client.send(new PutObjectCommand({
          Bucket: env.R2_BUCKET,
          Key: objectKey,
          Body: body,
          ContentLength: size,
          ContentType: "application/octet-stream",
          Metadata: { "encryption-format": "aura-aes-256-gcm-v1", "ciphertext-sha256": digest },
        }), { abortSignal: AbortSignal.timeout(300000) });
      } finally { body.destroy(); }
      // Read-back validates actual stored bytes. Success is never only a PUT acknowledgement.
      const saved = await client.send(new GetObjectCommand({ Bucket: env.R2_BUCKET, Key: objectKey }), { abortSignal: AbortSignal.timeout(300000) });
      assert(saved.Body && saved.ContentLength === size, "Remote backup size verification failed.");
      assert(await sha256(saved.Body) === digest, "Remote encrypted backup checksum verification failed.");
    }
    return { uploaded: keys.length, verified: true, objects: keys, encryptedBytes: size, deleted: 0 };
  } finally {
    if (ownedClient) client.destroy();
    key.fill(0);
    await rm(encrypted, { force: true });
  }
}
export async function downloadBackup({ objectKey, output, env, workDirectory, client }) {
  assert(/^backups\/(daily|weekly)\/\d{4}-\d{2}-\d{2}\/[a-zA-Z0-9.-]+\.aura\.enc$/.test(objectKey), "Only an explicit backups/daily or backups/weekly encrypted object is accepted.");
  const key = encryptionKey(env.BACKUP_ENCRYPTION_KEY);
  await privateDirectory(workDirectory);
  await privateDirectory(dirname(output));
  const encrypted = resolve(workDirectory, `${randomUUID()}.aura.enc`);
  const ownedClient = !client;
  client ??= storage(env);
  try {
    const saved = await client.send(new GetObjectCommand({ Bucket: env.R2_BUCKET, Key: objectKey }), { abortSignal: AbortSignal.timeout(300000) });
    assert(saved.Body, "Encrypted backup object is empty.");
    await pipeline(saved.Body, createWriteStream(encrypted, { flags: "wx", mode: 0o600 }));
    assert((await lstat(encrypted)).size === saved.ContentLength, "Downloaded backup size verification failed.");
    await decryptFile(encrypted, output, key);
    return { restoredFileReady: true, databaseModified: false };
  } finally {
    if (ownedClient) client.destroy();
    key.fill(0);
    await rm(encrypted, { force: true });
  }
}
async function main() {
  const [command, ...args] = process.argv.slice(2);
  assert(["upload", "download"].includes(command), "Usage: backup-offsite.mjs upload --env FILE --archive FILE | download --env FILE --object KEY --out FILE [--work-dir PRIVATE_DIRECTORY]");
  const options = {};
  const allowed = command === "upload" ? ["env", "archive", "work-dir"] : ["env", "object", "out", "work-dir"];
  for (let i = 0; i < args.length; i += 2) {
    const name = args[i].replace(/^--/, "");
    assert(args[i].startsWith("--") && allowed.includes(name) && !Object.hasOwn(options, name) && args[i + 1], "Invalid or duplicate option.");
    options[name] = args[i + 1];
  }
  assert(options.env, "An explicit private environment file is required.");
  const envPath = resolve(options.env);
  const stat = await lstat(envPath);
  assert(stat.isFile() && !(stat.mode & 0o077), "Environment file must be private (0600), not a symlink.");
  const env = parseEnv(await readFile(envPath, "utf8"));
  const workDirectory = resolve(options["work-dir"] ?? "/tmp/aura-offsite-backup");
  const result = command === "upload"
    ? (assert(options.archive, "Archive path required."), await uploadBackup({ archivePath: resolve(options.archive), env, workDirectory }))
    : (assert(options.object && options.out, "Object key and output path required."), await downloadBackup({ objectKey: options.object, output: resolve(options.out), env, workDirectory }));
  console.log(JSON.stringify(result));
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href)
  main().catch((error) => {
    console.error(error instanceof BackupError ? `Backup stopped: ${error.message}` : "Backup stopped safely. Check private configuration, file permissions, storage access and recovery key; no credentials are logged.");
    process.exitCode = 1;
  });
