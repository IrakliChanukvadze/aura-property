import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
export function r2Configured() {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET,
  );
}
function client() {
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}
export async function r2Put(key: string, bytes: Buffer, mime: string) {
  await client().send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
      Body: bytes,
      ContentType: mime,
    }),
  );
}
export async function r2Get(key: string) {
  const result = await client().send(
    new GetObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key }),
  );
  if (!result.Body) throw new Error("Storage returned no file");
  return Buffer.from(await result.Body.transformToByteArray());
}
