import { createHash } from "node:crypto";
import { z } from "zod";
import { ApiError } from "./errors.js";

const controlCharacters = /[\u0000-\u001f\u007f]/;
const mailbox = z.string().email();
const unavailable = () =>
  new ApiError(503, "EMAIL_UNAVAILABLE", "Email provider unavailable");

/** Email headers must never contain line breaks or control characters. */
export function validateEmailHeaders(to: string, subject: string) {
  if (
    typeof to !== "string" ||
    controlCharacters.test(to) ||
    !mailbox.safeParse(to).success ||
    typeof subject !== "string" ||
    controlCharacters.test(subject)
  )
    throw unavailable();
}

function senderAddress() {
  const configured = process.env.EMAIL_FROM;
  if (!configured || controlCharacters.test(configured)) throw unavailable();
  const from = configured.trim();
  // Resend accepts either an email address or "Display name <email address>".
  const named = from.match(/^([^<>]+)<([^<>]+)>$/);
  if (
    !mailbox.safeParse(named ? named[2] : from).success ||
    (named && !named[1].trim())
  )
    throw unavailable();
  return from;
}

/** Provider acceptance is not confirmation of delivery to the recipient. */
export async function sendResendEmail(
  to: string,
  subject: string,
  text: string,
) {
  validateEmailHeaders(to, subject);
  const from = senderAddress();
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey?.trim() || controlCharacters.test(apiKey)) throw unavailable();
  const body = JSON.stringify({ from, to, subject, text });
  // Resend retains idempotency keys for 24 hours. Hash the entire request so
  // repeated sends deduplicate, while new invitation/recovery tokens remain new.
  const idempotencyKey = `aura-email-${createHash("sha256").update(body).digest("hex")}`;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
        "idempotency-key": idempotencyKey,
      },
      body,
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw unavailable();
    const result: unknown = await response.json();
    if (
      !result ||
      typeof result !== "object" ||
      Array.isArray(result) ||
      !("id" in result) ||
      typeof result.id !== "string" ||
      !result.id.trim() ||
      ("error" in result && result.error != null) ||
      "errors" in result ||
      "name" in result ||
      "message" in result ||
      ("statusCode" in result && Number(result.statusCode) >= 400)
    )
      throw unavailable();
  } catch {
    // Do not propagate provider bodies, bearer credentials or token-bearing text.
    throw unavailable();
  }
}
