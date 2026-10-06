import { randomInt } from "node:crypto";
export const isDevelopment =
  process.env.NODE_ENV !== "production" &&
  process.env.DEV_INTEGRATIONS === "true";
export async function sendEmail(to: string, subject: string, text: string) {
  if (process.env.EMAIL_WEBHOOK_URL) {
    const res = await fetch(process.env.EMAIL_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${process.env.EMAIL_WEBHOOK_TOKEN ?? ""}`,
      },
      body: JSON.stringify({ to, subject, text }),
    });
    if (!res.ok) throw new Error("Email provider unavailable");
    return;
  }
  if (!isDevelopment) throw new Error("Email provider not configured");
  return { development: true, subject, text };
}
export async function sendOtp(phone: string, code: string) {
  if (process.env.SMS_WEBHOOK_URL) {
    const res = await fetch(process.env.SMS_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${process.env.SMS_WEBHOOK_TOKEN ?? ""}`,
      },
      body: JSON.stringify({ phone, code }),
    });
    if (!res.ok) throw new Error("OTP provider unavailable");
    return;
  }
  if (!isDevelopment) throw new Error("SMS provider not configured");
  return { development: true, code };
}
export const makeOtp = () => String(randomInt(100000, 1000000));
export async function signingRate(date: string) {
  if (process.env.FX_WEBHOOK_URL) {
    const r = await fetch(
      `${process.env.FX_WEBHOOK_URL}?date=${encodeURIComponent(date)}`,
    );
    if (!r.ok) throw new Error("Exchange rate unavailable");
    const data = (await r.json()) as { usdGel: number };
    if (!(data.usdGel > 0)) throw new Error("Invalid provider exchange rate");
    return data.usdGel;
  }
  throw new Error(
    "Signing-date FX rate missing; SuperAdmin must configure verified rate",
  );
}
