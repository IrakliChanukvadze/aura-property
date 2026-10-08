import { test, after } from "node:test";
import assert from "node:assert/strict";
import { randomInt } from "node:crypto";

// Exercise real database routes with all live providers disabled. No outgoing SMS.
process.env.NODE_ENV = "test";
process.env.DEV_INTEGRATIONS = "false";
delete process.env.SMS_WEBHOOK_URL;
delete process.env.SMS_WEBHOOK_TOKEN;
const { buildApp } = await import("./server.js");
const { db } = await import("./db.js");
const app = await buildApp();
const phones: string[] = [];
let address = 1;
function inquiry() {
  const phone = `+1555${randomInt(1000000, 10000000)}`;
  phones.push(phone);
  return { name: "SMS availability test", phone, locale: "en", consent: true };
}
function request(path: string, payload: unknown) {
  return app.inject({
    method: "POST",
    url: `/api/public/${path}`,
    payload: payload as any,
    remoteAddress: `127.9.0.${address++}`,
  });
}
after(async () => {
  delete process.env.SMS_WEBHOOK_URL;
  delete process.env.SMS_WEBHOOK_TOKEN;
  const customers = await db.customer.findMany({
    where: { phone: { in: phones } },
    select: { id: true },
  });
  await db.inquiryPending.deleteMany({ where: { phone: { in: phones } } });
  await db.lead.deleteMany({
    where: { customerId: { in: customers.map((c) => c.id) } },
  });
  await db.customer.deleteMany({ where: { phone: { in: phones } } });
  await app.close();
  await db.$disconnect();
});

test("without SMS first inquiry persists, optional verification is unavailable and duplicates stay unsaved", async () => {
  const value = inquiry();
  const accepted = await request("inquiries", value);
  assert.equal(accepted.statusCode, 200, accepted.body);
  assert.equal(accepted.json().data.accepted, true);
  assert.equal(accepted.json().data.optionalVerificationAvailable, false);
  assert.equal(accepted.json().data.developmentOtp, undefined);
  const customer = await db.customer.findUniqueOrThrow({
    where: { phone: value.phone },
  });
  const duplicate = await request("inquiries", value);
  assert.equal(duplicate.statusCode, 503, duplicate.body);
  assert.equal(duplicate.json().error.code, "SMS_UNAVAILABLE");
  assert.match(
    duplicate.json().error.message,
    /new request has not been submitted/,
  );
  assert.doesNotMatch(duplicate.body, /provider|configured|developmentOtp/i);
  assert.equal(await db.lead.count({ where: { customerId: customer.id } }), 1);
  assert.equal(
    await db.inquiryPending.count({ where: { phone: value.phone } }),
    0,
  );
  const fabricated = await request("inquiries", {
    ...value,
    requestId: "unsent-code",
    otpCode: "123456",
  });
  assert.equal(fabricated.statusCode, 400, fabricated.body);
  assert.equal(await db.lead.count({ where: { customerId: customer.id } }), 1);

  // Calling the hidden action directly is still safe and keeps the accepted lead.
  const optional = await request(
    `inquiries/${accepted.json().data.id}/verify-request`,
    { phone: value.phone },
  );
  assert.equal(optional.statusCode, 503, optional.body);
  assert.match(optional.json().error.message, /inquiry is already saved/);
  assert.equal(
    await db.inquiryPending.count({ where: { phone: value.phone } }),
    0,
  );
  assert.equal(await db.lead.count({ where: { customerId: customer.id } }), 1);
});

test("concurrent first submissions without SMS save exactly one inquiry and clean the blocked duplicate", async () => {
  const value = inquiry();
  const results = await Promise.all([
    request("inquiries", value),
    request("inquiries", value),
  ]);
  assert.deepEqual(results.map((r) => r.statusCode).sort(), [200, 503]);
  const customer = await db.customer.findUniqueOrThrow({
    where: { phone: value.phone },
  });
  assert.equal(await db.lead.count({ where: { customerId: customer.id } }), 1);
  assert.equal(
    await db.inquiryPending.count({ where: { phone: value.phone } }),
    0,
  );
});

test("configured provider failure cleans pending codes; successful duplicate delivery still requires the actual code", async () => {
  const originalFetch = globalThis.fetch;
  process.env.SMS_WEBHOOK_URL = "https://sms.example.test/verify";
  process.env.SMS_WEBHOOK_TOKEN = "synthetic-test-token";
  let calls = 0;
  let deliveredCode = "";
  try {
    globalThis.fetch = async () => {
      calls++;
      return new Response("private provider details", { status: 503 });
    };
    const value = inquiry();
    const first = await request("inquiries", value);
    assert.equal(first.statusCode, 200, first.body);
    assert.equal(first.json().data.optionalVerificationAvailable, true);
    const failed = await request("inquiries", value);
    assert.equal(failed.statusCode, 503, failed.body);
    assert.equal(calls, 1);
    assert.doesNotMatch(
      failed.body,
      /synthetic-test-token|private provider details|sms\.example/,
    );
    assert.equal(
      await db.inquiryPending.count({ where: { phone: value.phone } }),
      0,
    );

    globalThis.fetch = async (_url, options) => {
      calls++;
      deliveredCode = JSON.parse(String(options?.body)).code;
      return new Response("{}", { status: 200 });
    };
    const challenge = await request("inquiries", value);
    assert.equal(challenge.statusCode, 200, challenge.body);
    assert.equal(challenge.json().data.requiresOtp, true);
    assert.equal(challenge.json().data.developmentOtp, undefined);
    const customer = await db.customer.findUniqueOrThrow({
      where: { phone: value.phone },
    });
    assert.equal(
      await db.lead.count({ where: { customerId: customer.id } }),
      1,
    );
    const verified = await request("inquiries", {
      ...value,
      requestId: challenge.json().data.requestId,
      otpCode: deliveredCode,
    });
    assert.equal(verified.statusCode, 200, verified.body);
    assert.equal(verified.json().data.accepted, true);
    assert.equal(verified.json().data.optionalVerificationAvailable, false);
    assert.equal(
      await db.lead.count({ where: { customerId: customer.id } }),
      2,
    );
    assert.equal(
      await db.inquiryPending.count({ where: { phone: value.phone } }),
      0,
    );
  } finally {
    globalThis.fetch = originalFetch;
    delete process.env.SMS_WEBHOOK_URL;
    delete process.env.SMS_WEBHOOK_TOKEN;
  }
});
