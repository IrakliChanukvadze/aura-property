import { randomInt } from "node:crypto";
import { ApiError } from "./db.js";
export const isDevelopment =
  process.env.NODE_ENV !== "production" &&
  process.env.DEV_INTEGRATIONS === "true";
export async function sendEmail(to: string, subject: string, text: string) {
  if (process.env.EMAIL_WEBHOOK_URL) {
    await providerRequest(
      process.env.EMAIL_WEBHOOK_URL,
      "EMAIL_UNAVAILABLE",
      "Email provider unavailable",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${process.env.EMAIL_WEBHOOK_TOKEN ?? ""}`,
        },
        body: JSON.stringify({ to, subject, text }),
      },
    );

    return;
  }
  if (!isDevelopment)
    throw new ApiError(
      503,
      "EMAIL_UNAVAILABLE",
      "Email provider not configured",
    );
  return { development: true, subject, text };
}
export async function sendOtp(phone: string, code: string) {
  if (process.env.SMS_WEBHOOK_URL) {
    await providerRequest(
      process.env.SMS_WEBHOOK_URL,
      "SMS_UNAVAILABLE",
      "OTP provider unavailable",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${process.env.SMS_WEBHOOK_TOKEN ?? ""}`,
        },
        body: JSON.stringify({ phone, code }),
      },
    );

    return;
  }
  if (!isDevelopment)
    throw new ApiError(503, "SMS_UNAVAILABLE", "SMS provider not configured");
  return { development: true, code };
}
export const makeOtp = () => String(randomInt(100000, 1000000));
/** Bound provider calls so an outage cannot leave API requests hanging. */
async function providerRequest(
  url: string | URL,
  code: string,
  message: string,
  options: RequestInit = {},
) {
  try {
    const response = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error("Provider rejected request");
    return response;
  } catch {
    throw new ApiError(503, code, message);
  }
}
export async function signingRate(date: string) {
  if (!process.env.FX_WEBHOOK_URL)
    throw new ApiError(
      409,
      "FX_RATE_REQUIRED",
      `No verified USD/GEL rate for ${date}. Ask SuperAdmin to add it in Settings before recording this USD sale.`,
    );
  try {
    const url = new URL(process.env.FX_WEBHOOK_URL);
    url.searchParams.set("date", date);
    const response = await providerRequest(
      url,
      "FX_UNAVAILABLE",
      "Exchange-rate provider unavailable. Retry or ask SuperAdmin to add a verified signing-date rate in Settings.",
    );
    const data = (await response.json()) as { usdGel?: unknown };
    if (
      typeof data.usdGel !== "number" ||
      !Number.isFinite(data.usdGel) ||
      data.usdGel <= 0
    )
      throw new Error("Invalid exchange rate");
    return data.usdGel;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      503,
      "FX_UNAVAILABLE",
      "Exchange-rate provider returned an invalid response. Ask SuperAdmin to add a verified signing-date rate in Settings.",
    );
  }
}
