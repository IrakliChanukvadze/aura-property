import { after, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { ApiError } from "./errors.js";

const envKeys = [
  "NODE_ENV",
  "DEV_INTEGRATIONS",
  "EMAIL_WEBHOOK_URL",
  "EMAIL_WEBHOOK_TOKEN",
  "RESEND_API_KEY",
  "EMAIL_FROM",
];
const previousEnv = new Map(envKeys.map((key) => [key, process.env[key]]));
const originalFetch = globalThis.fetch;
beforeEach(() => {
  for (const key of envKeys) delete process.env[key];
  process.env.NODE_ENV = "test";
  globalThis.fetch = async () => {
    throw new Error("Real provider requests disabled in email tests");
  };
});
after(() => {
  globalThis.fetch = originalFetch;
  for (const [key, value] of previousEnv) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});
let instance = 0;
// isDevelopment is intentionally captured at startup, as it is in the server.
const adapter = () => import(`./adapters.js?email-test=${instance++}`);
const recipient = "agent@example.test";
const subject = "Welcome to Aura — მოგესალმებით";
const text =
  "Set your password:\nhttps://admin.auraproperty.ge/invite?token=private-token";
function configure() {
  process.env.RESEND_API_KEY = "test-resend-private-key";
  process.env.EMAIL_FROM = "Aura Property <notifications@auraproperty.ge>";
}
function isSafeFailure(error: unknown) {
  assert.ok(error instanceof ApiError);
  assert.equal(error.status, 503);
  assert.equal(error.code, "EMAIL_UNAVAILABLE");
  for (const secret of [
    "test-resend-private-key",
    "private-token",
    subject,
    "Provider detail",
  ])
    assert.ok(!`${error.stack}${JSON.stringify(error)}`.includes(secret));
  return true;
}

test("Resend submits the Aura sender and exact message with bearer auth, stable idempotency and a bounded timeout", async (t) => {
  configure();
  let timeoutMs = 0;
  const signal = new AbortController().signal;
  t.mock.method(AbortSignal, "timeout", (ms: number) => {
    timeoutMs = ms;
    return signal;
  });
  let requests = 0;
  globalThis.fetch = async (url, init) => {
    requests++;
    assert.equal(url, "https://api.resend.com/emails");
    assert.equal(init?.method, "POST");
    assert.equal(init?.signal, signal);
    const headers = new Headers(init?.headers);
    assert.equal(
      headers.get("authorization"),
      "Bearer test-resend-private-key",
    );
    assert.equal(headers.get("content-type"), "application/json");
    const expected = JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: recipient,
      subject,
      text,
    });
    assert.equal(init?.body, expected);
    assert.equal(
      headers.get("idempotency-key"),
      `aura-email-${createHash("sha256").update(expected).digest("hex")}`,
    );
    return Response.json({ id: "provider-accepted-message" });
  };
  const { sendEmail } = await adapter();
  assert.equal(await sendEmail(recipient, subject, text), undefined);
  assert.equal(timeoutMs, 10000);
  assert.equal(requests, 1);
});

test("email idempotency repeats only for identical full payloads and never exposes token text", async () => {
  configure();
  const keys: string[] = [];
  globalThis.fetch = async (_url, init) => {
    const key = new Headers(init?.headers).get("idempotency-key")!;
    assert.match(key, /^aura-email-[a-f0-9]{64}$/);
    assert.ok(!key.includes("private-token"));
    keys.push(key);
    return Response.json({ id: "accepted" });
  };
  const { sendEmail } = await adapter();
  await sendEmail(recipient, subject, text);
  await sendEmail(recipient, subject, text);
  await sendEmail("other@example.test", subject, text);
  await sendEmail(recipient, `${subject} 2`, text);
  await sendEmail(recipient, subject, `${text}2`);
  process.env.EMAIL_FROM = "Aura Team <notifications@auraproperty.ge>";
  await sendEmail(recipient, subject, text);
  assert.equal(keys[0], keys[1]);
  assert.equal(new Set(keys).size, 5);
});

test("Resend rejects missing or malformed sender configuration and unsafe headers without making a request", async () => {
  configure();
  let requests = 0;
  globalThis.fetch = async () => {
    requests++;
    return Response.json({ id: "unexpected-send" });
  };
  const { sendEmail } = await adapter();
  for (const from of [
    undefined,
    "",
    "   ",
    "Aura Property",
    "bad@@example.test",
    "<notifications@auraproperty.ge>",
    "Aura <bad>",
    "Aura <mail@example.test> extra",
    "Aura\r\nBcc: other@example.test <mail@example.test>",
    "mail@example.test\n",
  ]) {
    if (from === undefined) delete process.env.EMAIL_FROM;
    else process.env.EMAIL_FROM = from;
    await assert.rejects(sendEmail(recipient, subject, text), isSafeFailure);
  }
  configure();
  for (const to of [
    "invalid",
    "",
    "agent@example.test\r\nBcc: other@example.test",
    "agent@example.test\u0000",
  ]) {
    await assert.rejects(sendEmail(to, subject, text), isSafeFailure);
  }
  for (const unsafeSubject of [
    "Welcome\nBcc: hidden@example.test",
    "Welcome\r",
    "Welcome\u0000",
  ]) {
    await assert.rejects(
      sendEmail(recipient, unsafeSubject, text),
      isSafeFailure,
    );
  }
  process.env.RESEND_API_KEY = " \t ";
  await assert.rejects(sendEmail(recipient, subject, text), isSafeFailure);
  assert.equal(requests, 0);
});

test("Resend accepts a bare sender email address", async () => {
  configure();
  process.env.EMAIL_FROM = "notifications@auraproperty.ge";
  globalThis.fetch = async (_url, init) => {
    assert.equal(
      JSON.parse(String(init?.body)).from,
      "notifications@auraproperty.ge",
    );
    return Response.json({ id: "accepted" });
  };
  assert.equal(
    await (await adapter()).sendEmail(recipient, subject, text),
    undefined,
  );
});

test("configured Resend failures stay safe, do not retry and never fall back to the development response", async () => {
  configure();
  process.env.DEV_INTEGRATIONS = "true";
  const { sendEmail } = await adapter();
  const outcomes = [
    () =>
      Response.json(
        { message: "Provider detail private-token" },
        { status: 401 },
      ),
    () => Response.json({ id: "not-success" }, { status: 429 }),
    () => Response.json({ id: "not-success" }, { status: 500 }),
    () => new Response("not-json"),
    () => new Response(null, { status: 204 }),
    ...[
      null,
      [],
      "id",
      {},
      { id: null },
      { id: 123 },
      { id: "  " },
      { id: "unexpected", error: {} },
      { id: "unexpected", errors: [] },
      { id: "unexpected", name: "validation_error" },
      { id: "unexpected", message: "Provider detail" },
      { id: "unexpected", statusCode: 400 },
    ].map((value) => () => Response.json(value)),
    () => {
      throw new Error("Provider detail private-token test-resend-private-key");
    },
  ];
  for (const outcome of outcomes) {
    let requests = 0;
    globalThis.fetch = async () => {
      requests++;
      return outcome();
    };
    await assert.rejects(sendEmail(recipient, subject, text), isSafeFailure);
    assert.equal(requests, 1);
  }
});

test("Resend timeout is reported safely without a retry", async (t) => {
  configure();
  t.mock.method(AbortSignal, "timeout", (ms: number) => {
    assert.equal(ms, 10000);
    return AbortSignal.abort(new Error("Provider detail private-token"));
  });
  let requests = 0;
  globalThis.fetch = async (_url, init) => {
    requests++;
    init?.signal?.throwIfAborted();
    return Response.json({ id: "unreachable" });
  };
  await assert.rejects(
    (await adapter()).sendEmail(recipient, subject, text),
    isSafeFailure,
  );
  assert.equal(requests, 1);
});

test("configured email webhook keeps precedence and its legacy success contract", async () => {
  process.env.EMAIL_WEBHOOK_URL = "https://email.example.test/send";
  process.env.EMAIL_WEBHOOK_TOKEN = "test-webhook-key";
  process.env.RESEND_API_KEY = "unused-resend-key";
  // A webhook integration does not require direct Resend sender configuration.
  let requests = 0;
  globalThis.fetch = async (url, init) => {
    requests++;
    assert.equal(url, "https://email.example.test/send");
    assert.equal(
      new Headers(init?.headers).get("authorization"),
      "Bearer test-webhook-key",
    );
    assert.deepEqual(JSON.parse(String(init?.body)), {
      to: recipient,
      subject,
      text,
    });
    return new Response(null, { status: 204 });
  };
  assert.equal(
    await (await adapter()).sendEmail(recipient, subject, text),
    undefined,
  );
  assert.equal(requests, 1);
});

test("a failed email webhook does not fall back to Resend or development", async () => {
  configure();
  process.env.EMAIL_WEBHOOK_URL = "https://email.example.test/send";
  process.env.DEV_INTEGRATIONS = "true";
  let requests = 0;
  globalThis.fetch = async (url) => {
    requests++;
    assert.equal(url, "https://email.example.test/send");
    return Response.json({ error: "Provider detail" }, { status: 503 });
  };
  await assert.rejects(
    (await adapter()).sendEmail(recipient, subject, text),
    isSafeFailure,
  );
  assert.equal(requests, 1);
});

test("unconfigured email development responses require explicit opt-in and are never available in production", async () => {
  let requests = 0;
  globalThis.fetch = async () => {
    requests++;
    throw new Error("Unexpected provider request");
  };
  process.env.DEV_INTEGRATIONS = "true";
  assert.deepEqual(
    await (await adapter()).sendEmail(recipient, subject, text),
    {
      development: true,
      subject,
      text,
    },
  );
  process.env.DEV_INTEGRATIONS = "false";
  await assert.rejects(
    (await adapter()).sendEmail(recipient, subject, text),
    isSafeFailure,
  );
  process.env.NODE_ENV = "production";
  process.env.DEV_INTEGRATIONS = "true";
  await assert.rejects(
    (await adapter()).sendEmail(recipient, subject, text),
    isSafeFailure,
  );
  assert.equal(requests, 0);
});
