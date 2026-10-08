import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { mkdtemp, readFile, writeFile, stat, readdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { Readable } from "node:stream";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { encryptionKey, encryptFile, decryptFile, uploadBackup, downloadBackup, backupObjectKeys } from "./backup-offsite.mjs";

async function fixture(run) {
  const dir = await mkdtemp(join(tmpdir(), "aura-offsite-test-"));
  const plaintext = Buffer.concat([Buffer.from("PGDMP-test-dump-private-marker-"), randomBytes(4096)]);
  const archive = join(dir, "source.dump");
  await writeFile(archive, plaintext, { mode: 0o600 });
  try { await run({ dir, archive, plaintext, key: randomBytes(32) }); }
  finally { await rm(dir, { recursive: true, force: true }); }
}
function fakeStorage() {
  const objects = new Map();
  const commands = [];
  return {
    objects,
    commands,
    async send(command) {
      commands.push(command.constructor.name);
      if (command instanceof PutObjectCommand) {
        const chunks = [];
        for await (const chunk of command.input.Body) chunks.push(Buffer.from(chunk));
        const body = Buffer.concat(chunks);
        assert.equal(command.input.ContentLength, body.length);
        objects.set(command.input.Key, body);
        return {};
      }
      assert.ok(command instanceof GetObjectCommand, "Only Put/Get are permitted; no remote deletion");
      const body = objects.get(command.input.Key);
      assert.ok(body);
      return { ContentLength: body.length, Body: Readable.from([body]) };
    },
  };
}
test("requires an explicit canonical 32-byte backup encryption key", () => {
  for (const value of [undefined, "", "not-a-key", randomBytes(16).toString("base64"), randomBytes(33).toString("base64")])
    assert.throws(() => encryptionKey(value), /BACKUP_ENCRYPTION_KEY/);
  const key = randomBytes(32);
  assert.deepEqual(encryptionKey(key.toString("base64")), key);
});
test("AES-GCM roundtrip preserves dump, uses fresh IVs and creates private files", () => fixture(async ({ dir, archive, plaintext, key }) => {
  const encrypted = join(dir, "first.enc");
  const second = join(dir, "second.enc");
  const restored = join(dir, "restored.dump");
  await encryptFile(archive, encrypted, key);
  await encryptFile(archive, second, key);
  assert.notDeepEqual(await readFile(encrypted), await readFile(second));
  assert.equal((await readFile(encrypted)).includes(Buffer.from("test-dump-private-marker")), false);
  await decryptFile(encrypted, restored, key);
  assert.deepEqual(await readFile(restored), plaintext);
  for (const file of [encrypted, restored]) assert.equal((await stat(file)).mode & 0o777, 0o600);
}));
test("wrong key, ciphertext corruption and truncated backups never publish plaintext or leave partials", () => fixture(async ({ dir, archive, key }) => {
  const encrypted = join(dir, "encrypted.enc");
  const restored = join(dir, "restore.dump");
  await encryptFile(archive, encrypted, key);
  const original = await readFile(encrypted);
  await assert.rejects(decryptFile(encrypted, restored, randomBytes(32)));
  const corrupted = Buffer.from(original);
  corrupted[50] ^= 1;
  await writeFile(encrypted, corrupted);
  await assert.rejects(decryptFile(encrypted, restored, key));
  await writeFile(encrypted, original.subarray(0, 20));
  await assert.rejects(decryptFile(encrypted, restored, key));
  assert.equal((await readdir(dir)).includes("restore.dump"), false);
  assert.equal((await readdir(dir)).some((name) => name.includes("partial")), false);
}));
test("encryption and restoration refuse overwriting an existing output", () => fixture(async ({ dir, archive, key }) => {
  const encrypted = join(dir, "encrypted.enc");
  const restored = join(dir, "restore.dump");
  await encryptFile(archive, encrypted, key);
  const original = await readFile(encrypted);
  await assert.rejects(encryptFile(archive, encrypted, key), { code: "EEXIST" });
  assert.deepEqual(await readFile(encrypted), original);
  await writeFile(restored, "existing recovery", { mode: 0o600 });
  await assert.rejects(decryptFile(encrypted, restored, key), { code: "EEXIST" });
  assert.equal(await readFile(restored, "utf8"), "existing recovery");
}));
test("upload sends ciphertext only, verifies R2 bytes, keeps source and supports authenticated recovery", () => fixture(async ({ dir, archive, plaintext, key }) => {
  const client = fakeStorage();
  const env = { BACKUP_ENCRYPTION_KEY: key.toString("base64"), R2_BUCKET: "private-test-bucket" };
  const workDirectory = join(dir, "work");
  const result = await uploadBackup({ archivePath: archive, env, workDirectory, client, now: new Date("2026-10-11T00:30:00Z") });
  assert.equal(result.uploaded, 2);
  assert.equal(result.verified, true);
  assert.equal(result.deleted, 0);
  assert.equal(client.objects.size, 2);
  assert.deepEqual(await readFile(archive), plaintext);
  for (const [name, bytes] of client.objects) {
    assert.match(name, /^backups\/(daily|weekly)\//);
    assert.equal(bytes.includes(Buffer.from("test-dump-private-marker")), false);
    assert.notDeepEqual(bytes, plaintext);
  }
  assert.deepEqual(await readdir(workDirectory), []);
  const output = join(dir, "recovered.dump");
  await downloadBackup({ objectKey: result.objects[0], output, env, workDirectory, client });
  assert.deepEqual(await readFile(output), plaintext);
  await assert.rejects(downloadBackup({ objectKey: result.objects[0], output: join(dir, "wrong-key.dump"), env: { ...env, BACKUP_ENCRYPTION_KEY: randomBytes(32).toString("base64") }, workDirectory, client }));
  assert.equal((await readdir(dir)).includes("wrong-key.dump"), false);
  assert.equal(client.commands.some((name) => name.includes("Delete")), false);
}));
test("remote corruption fails verification, and non-dump input is never uploaded", () => fixture(async ({ dir, archive, key }) => {
  const env = { BACKUP_ENCRYPTION_KEY: key.toString("base64"), R2_BUCKET: "private-test-bucket" };
  const workDirectory = join(dir, "work");
  const client = fakeStorage();
  const normalSend = client.send.bind(client);
  client.send = async (command) => {
    const result = await normalSend(command);
    if (command instanceof GetObjectCommand) result.Body = Readable.from([Buffer.alloc(result.ContentLength)]);
    return result;
  };
  await assert.rejects(uploadBackup({ archivePath: archive, env, workDirectory, client }), /checksum/);
  assert.deepEqual(await readdir(workDirectory), []);
  const before = client.commands.length;
  await writeFile(archive, "this is not a postgres dump");
  await assert.rejects(uploadBackup({ archivePath: archive, env, workDirectory, client }), /PostgreSQL custom/);
  assert.equal(client.commands.length, before);
}));
test("daily object names are unique; Sunday additionally creates a weekly recovery point", () => {
  const monday = new Date("2026-10-12T00:30:00Z");
  const sunday = new Date("2026-10-11T00:30:00Z");
  assert.equal(backupObjectKeys(monday).length, 1);
  assert.notEqual(backupObjectKeys(monday)[0], backupObjectKeys(monday)[0]);
  assert.match(backupObjectKeys(sunday)[1], /^backups\/weekly\/2026-10-05\//);
});
