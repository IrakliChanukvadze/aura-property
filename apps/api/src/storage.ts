import { ApiError } from "./db.js";
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
  try {
    await client().send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: key,
        Body: bytes,
        ContentType: mime,
      }),
      { abortSignal: AbortSignal.timeout(10000) },
    );
  } catch {
    throw new ApiError(502, "STORAGE_FAILED", "Storage provider unavailable");
  }
}
export async function r2Get(key: string) {
  try {
    const result = await client().send(
      new GetObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key }),
      { abortSignal: AbortSignal.timeout(10000) },
    );
    if (!result.Body) throw new Error("Storage returned no file");
    return Buffer.from(await result.Body.transformToByteArray());
  } catch (error) {
    if ((error as any)?.name === "NoSuchKey")
      throw new ApiError(404, "NOT_FOUND", "File no longer available");
    throw new ApiError(502, "STORAGE_FAILED", "Storage provider unavailable");
  }
}
