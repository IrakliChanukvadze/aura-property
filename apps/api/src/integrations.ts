import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { authenticate } from "./auth.js";
import { ApiError, requireAdmin } from "./db.js";
import { isDevelopment } from "./adapters.js";

const ids = ["email", "translation", "storage", "sms", "fx"] as const;
type IntegrationId = (typeof ids)[number];
type Check = { code: string; passed: boolean; message: string };
const has = (name: string) => Boolean(process.env[name]?.trim());
const raw = (name: string) => Boolean(process.env[name]);
const safeValue = (name: string) =>
  has(name) && !/[\u0000-\u001f\u007f]/.test(process.env[name]!);
const guides: Record<IntegrationId, { title: string; url: string }[]> = {
  email: [
    {
      title: "Resend: verify a sending domain",
      url: "https://resend.com/docs/dashboard/domains/introduction",
    },
    {
      title: "Resend: API keys",
      url: "https://resend.com/docs/dashboard/api-keys/introduction",
    },
  ],
  translation: [
    {
      title: "OpenRouter: API authentication",
      url: "https://openrouter.ai/docs/api_reference/authentication",
    },
    { title: "OpenAI: API keys", url: "https://platform.openai.com/api-keys" },
  ],
  storage: [
    {
      title: "Cloudflare R2: create a bucket",
      url: "https://developers.cloudflare.com/r2/buckets/create-buckets/",
    },
    {
      title: "Cloudflare R2: S3 API tokens",
      url: "https://developers.cloudflare.com/r2/api/tokens/",
    },
  ],
  sms: [],
  fx: [],
};
function senderValid() {
  if (!safeValue("EMAIL_FROM")) return false;
  const sender = process.env.EMAIL_FROM!.trim();
  const named = sender.match(/^([^<>]+)<([^<>]+)>$/);
  return Boolean(
    (!named || named[1].trim()) &&
    z
      .string()
      .email()
      .safeParse(named ? named[2] : sender).success,
  );
}
function urlValid(name: string) {
  if (!safeValue(name)) return false;
  try {
    const url = new URL(process.env[name]!);
    return (
      ["https:", "http:"].includes(url.protocol) &&
      Boolean(url.hostname) &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}
/** Reflect the actual runtime adapter precedence. Never return environment values. */
export function integrationStatus(id: IntegrationId) {
  let provider: string | null = null;
  let names: string[] = [];
  const checks: Check[] = [];
  const add = (code: string, passed: boolean, message: string) =>
    checks.push({ code, passed, message });
  const webhook = (name: string) => {
    provider = "webhook";
    names = [name];
    add(
      "WEBHOOK_URL",
      urlValid(name),
      "The configured webhook must be an HTTP(S) URL without embedded login credentials.",
    );
  };
  if (id === "email") {
    if (raw("EMAIL_WEBHOOK_URL")) webhook("EMAIL_WEBHOOK_URL");
    else if (raw("RESEND_API_KEY") || has("EMAIL_FROM")) {
      provider = "resend";
      names = ["RESEND_API_KEY", "EMAIL_FROM"];
      add(
        "API_KEY",
        safeValue("RESEND_API_KEY"),
        "A server-side Resend API key is required.",
      );
      add(
        "SENDER",
        senderValid(),
        "A valid sending address is required; verify its domain in Resend.",
      );
    }
  } else if (id === "translation") {
    if (has("TRANSLATION_WEBHOOK_URL")) webhook("TRANSLATION_WEBHOOK_URL");
    else if (has("OPENROUTER_API_KEY")) {
      provider = "openrouter";
      names = ["OPENROUTER_API_KEY"];
      add(
        "API_KEY",
        safeValue(names[0]),
        "A server-side OpenRouter API key is required.",
      );
    } else if (has("OPENAI_API_KEY")) {
      provider = "openai";
      names = ["OPENAI_API_KEY"];
      add(
        "API_KEY",
        safeValue(names[0]),
        "A server-side OpenAI API key is required.",
      );
    }
  } else if (id === "storage") {
    const r2 = [
      "R2_ACCOUNT_ID",
      "R2_ACCESS_KEY_ID",
      "R2_SECRET_ACCESS_KEY",
      "R2_BUCKET",
    ];
    if (r2.every(raw)) {
      provider = "r2";
      names = r2;
      for (const name of r2)
        add(
          name,
          safeValue(name),
          "This R2 server setting is required and must not contain control characters.",
        );
      add(
        "ACCOUNT_FORMAT",
        /^[a-f0-9]{32}$/i.test(process.env.R2_ACCOUNT_ID!),
        "The R2 account ID must be a 32-character hexadecimal Cloudflare account ID.",
      );
      add(
        "BUCKET_FORMAT",
        /^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(process.env.R2_BUCKET!),
        "The bucket name must use a valid S3-compatible format.",
      );
    } else if (raw("STORAGE_WEBHOOK_URL")) webhook("STORAGE_WEBHOOK_URL");
    else if (r2.some(raw)) {
      provider = "r2";
      names = r2;
      for (const name of r2)
        add(
          name,
          safeValue(name),
          "Complete all four R2 server settings before uploads can use R2.",
        );
    }
  } else if (id === "sms" && raw("SMS_WEBHOOK_URL")) webhook("SMS_WEBHOOK_URL");
  else if (id === "fx" && raw("FX_WEBHOOK_URL")) webhook("FX_WEBHOOK_URL");
  const development =
    !provider && isDevelopment && ["email", "storage", "sms"].includes(id);
  const configured = Boolean(provider) && checks.every((check) => check.passed);
  const state = development
    ? "development"
    : !provider
      ? "not_configured"
      : configured
        ? "configured"
        : "incomplete";
  return {
    id,
    provider,
    configured,
    mode: development ? "development" : provider ? "live" : "missing",
    state,
    requiredFields: (names.length
      ? names
      : {
          email: ["RESEND_API_KEY", "EMAIL_FROM"],
          translation: ["OPENROUTER_API_KEY"],
          storage: [
            "R2_ACCOUNT_ID",
            "R2_ACCESS_KEY_ID",
            "R2_SECRET_ACCESS_KEY",
            "R2_BUCKET",
          ],
          sms: ["SMS_WEBHOOK_URL"],
          fx: ["FX_WEBHOOK_URL"],
        }[id]
    ).map((name) => ({ name, configured: has(name) })),
    guides: guides[id],
    capabilities: { configurationCheck: true, liveCheck: false },
    limitations: [
      "Configuration checks do not verify credentials, network access, provider billing or delivery.",
      ...(id === "fx"
        ? [
            "Verified signing-date exchange rates can also be entered manually in Settings.",
          ]
        : []),
      ...(id === "sms"
        ? [
            "SMS currently requires a compatible server webhook adapter; there is no direct SMS-provider connection wizard yet.",
          ]
        : []),
      ...(development
        ? ["Development mode is a local stub, not a connected live provider."]
        : []),
    ],
    checks,
  };
}
export async function integrationsRoutes(app: FastifyInstance) {
  app.get(
    "/api/integrations",
    { preHandler: authenticate },
    async (req, reply) => {
      requireAdmin(req.actor);
      reply.header("cache-control", "no-store");
      return {
        data: {
          items: ids.map((id) => {
            const { checks: _checks, ...item } = integrationStatus(id);
            return item;
          }),
        },
      };
    },
  );
  app.post(
    "/api/integrations/:id/check",
    {
      preHandler: authenticate,
      config: { rateLimit: { max: 20, timeWindow: "1 minute" } },
    },
    async (req, reply) => {
      requireAdmin(req.actor);
      const id = (req.params as { id: string }).id;
      if (!ids.includes(id as IntegrationId))
        throw new ApiError(404, "NOT_FOUND", "Integration not found");
      z.object({})
        .strict()
        .parse(req.body ?? {});
      const item = integrationStatus(id as IntegrationId);
      reply.header("cache-control", "no-store");
      return {
        data: {
          integrationId: id,
          status:
            item.state === "configured"
              ? "configuration_valid"
              : item.state === "incomplete"
                ? "configuration_incomplete"
                : item.state,
          checkedAt: new Date().toISOString(),
          checks: item.checks,
          message:
            "Only server configuration was checked. No message was sent, file uploaded or paid AI request made. Provider access remains unverified.",
        },
      };
    },
  );
}
