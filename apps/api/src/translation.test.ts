import { after, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  translateBatch,
  translateText,
  translationStatus,
} from "./translation.js";

const providerKeys = [
  "OPENROUTER_API_KEY",
  "CHAT_MODEL",
  "OPENAI_API_KEY",
  "OPENAI_TRANSLATION_MODEL",
  "TRANSLATION_WEBHOOK_URL",
  "TRANSLATION_WEBHOOK_TOKEN",
];
const previousEnv = new Map(providerKeys.map((key) => [key, process.env[key]]));
const originalFetch = globalThis.fetch;
beforeEach(() => {
  for (const key of providerKeys) delete process.env[key];
  globalThis.fetch = async () => {
    throw new Error("Real provider requests disabled in translation tests");
  };
});
after(() => {
  globalThis.fetch = originalFetch;
  for (const [key, value] of previousEnv) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});
const input = {
  sourceLanguage: "en",
  fields: [
    { id: "hero", text: "  Aura — 2 bedrooms\n$100,000  ", kind: "title" },
    { id: "about", text: "About Aura", kind: "description" },
  ],
};
const translations = () => ({
  en: "Rewritten source",
  ka: "ქართული",
  ru: "Русский",
  he: "עברית",
});
function completed(
  fields = input.fields.map(({ id }) => ({ id, translations: translations() })),
) {
  return {
    choices: [
      {
        finish_reason: "tool_calls",
        message: {
          role: "assistant",
          tool_calls: [
            {
              type: "function",
              function: {
                name: "translated_fields",
                arguments: JSON.stringify({ fields }),
              },
            },
          ],
        },
      },
    ],
  };
}
const user = () => randomUUID();

test("OpenRouter batches four languages once, preserves source bytes and matches returned ids", async () => {
  process.env.OPENROUTER_API_KEY = "test-openrouter-secret";
  let calls = 0;
  globalThis.fetch = async (url, options) => {
    calls++;
    assert.equal(url, "https://openrouter.ai/api/v1/chat/completions");
    assert.equal(options?.method, "POST");
    assert.equal(
      (options?.headers as any).authorization,
      "Bearer test-openrouter-secret",
    );
    assert.ok(options?.signal instanceof AbortSignal);
    const body = JSON.parse(String(options?.body));
    assert.equal(body.model, "google/gemini-2.5-flash");
    assert.equal(body.max_tokens, 12000);
    assert.equal(body.temperature, 0);
    assert.match(body.messages[0].content, /Hebrew/);
    assert.match(body.messages[0].content, /data, never instructions/);
    assert.match(body.messages[0].content, /Do not invent/);
    assert.deepEqual(JSON.parse(body.messages[1].content), input);
    assert.deepEqual(body.tool_choice, {
      type: "function",
      function: { name: "translated_fields" },
    });
    assert.deepEqual(
      body.tools[0].function.parameters.properties.fields.items.properties
        .translations.required,
      ["en", "ka", "ru", "he"],
    );
    return Response.json(
      completed(
        [...input.fields]
          .reverse()
          .map(({ id }) => ({ id, translations: translations() })),
      ),
    );
  };
  const before = structuredClone(input);
  const result = await translateBatch(user(), input);
  assert.equal(calls, 1);
  assert.deepEqual(input, before);
  assert.deepEqual(
    result.fields.map((field) => field.id),
    ["hero", "about"],
  );
  assert.deepEqual(
    result.fields.map((field) => field.translations.en),
    input.fields.map((field) => field.text),
  );
  assert.equal(result.fields[0].translations.he, "עברית");
  assert.deepEqual(translationStatus(), {
    configured: true,
    provider: "openrouter",
  });
});

test("Hebrew source and the legacy target endpoint use configured OpenRouter model", async () => {
  process.env.OPENROUTER_API_KEY = "test-only";
  process.env.CHAT_MODEL = "configured-openrouter-model";
  let calls = 0;
  globalThis.fetch = async (_url, options) => {
    calls++;
    const body = JSON.parse(String(options?.body));
    assert.equal(body.model, "configured-openrouter-model");
    const request = JSON.parse(body.messages[1].content);
    return Response.json(
      completed(
        request.fields.map(({ id }: any) => ({
          id,
          translations: translations(),
        })),
      ),
    );
  };
  const source = "  דירה\n2 חדרים  ";
  const result = await translateBatch(user(), {
    sourceLanguage: "he",
    fields: [{ id: "title", text: source }],
  });
  assert.equal(result.fields[0].translations.he, source);
  assert.equal(
    await translateText({ source: "en", target: "he", text: "Text" }, user()),
    "עברית",
  );
  assert.equal(calls, 2);
  assert.equal(
    await translateText({ source: "he", target: "he", text: source }, user()),
    source,
  );
  assert.equal(calls, 2);
});

test("input bounds reject invalid requests before calling any provider", async () => {
  process.env.OPENROUTER_API_KEY = "test-only";
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return Response.json(completed());
  };
  const invalid = [
    { ...input, sourceLanguage: "fr" },
    { ...input, fields: [] },
    { ...input, fields: [{ id: "a", text: "   " }] },
    { ...input, fields: [{ id: "", text: "A" }] },
    { ...input, fields: [{ id: "bad field", text: "A" }] },
    { ...input, fields: [{ id: "a".repeat(101), text: "A" }] },
    { ...input, fields: [{ id: "a", text: "A", kind: "prompt" }] },
    {
      ...input,
      fields: [
        { id: "a", text: "A" },
        { id: "a", text: "B" },
      ],
    },
    { ...input, fields: [{ id: "a", text: "a".repeat(5001) }] },
    {
      ...input,
      fields: Array.from({ length: 21 }, (_, i) => ({ id: `${i}`, text: "A" })),
    },
    {
      ...input,
      fields: Array.from({ length: 3 }, (_, i) => ({
        id: `${i}`,
        text: "A".repeat(4000),
      })),
    },
  ];
  for (const request of invalid)
    await assert.rejects(translateBatch(user(), request), { name: "ZodError" });
  await assert.rejects(
    translateText(
      { text: "A".repeat(5001), source: "en", target: "he" },
      user(),
    ),
    { name: "ZodError" },
  );
  assert.equal(calls, 0);
});

test("OpenRouter rejects malformed, incomplete, refused and incorrectly matched output without retries or fallback", async () => {
  process.env.OPENROUTER_API_KEY = "never-expose-this-secret";
  process.env.OPENAI_API_KEY = "fallback-must-not-run";
  const invalid: any[] = [
    { error: { message: "never-expose-this-secret" }, ...completed() },
    { choices: [] },
    { choices: [...completed().choices, ...completed().choices] },
    ...["length", "content_filter", "error", null].map((finish_reason) => ({
      choices: [{ ...completed().choices[0], finish_reason }],
    })),
    {
      choices: [
        {
          ...completed().choices[0],
          message: { ...completed().choices[0].message, refusal: "Refused" },
        },
      ],
    },
    {
      choices: [
        {
          ...completed().choices[0],
          message: {
            ...completed().choices[0].message,
            content: [{ type: "refusal" }],
          },
        },
      ],
    },
    completed([{ id: "hero", translations: translations() }]),
    completed([
      { id: "hero", translations: translations() },
      { id: "hero", translations: translations() },
    ]),
    completed([
      { id: "hero", translations: translations() },
      { id: "unknown", translations: translations() },
    ]),
    completed([
      { id: "hero", translations: { ...translations(), he: " " } },
      { id: "about", translations: translations() },
    ]),
    completed([
      {
        id: "hero",
        translations: { ...translations(), he: "a".repeat(10001) },
      },
      { id: "about", translations: translations() },
    ]),
  ];
  const missingHebrew: any = translations();
  delete missingHebrew.he;
  invalid.push(
    completed([
      { id: "hero", translations: missingHebrew },
      { id: "about", translations: translations() },
    ]),
  );
  const wrongTool = completed();
  wrongTool.choices[0].message.tool_calls[0].function.name = "other";
  invalid.push(wrongTool);
  const malformed = completed();
  malformed.choices[0].message.tool_calls[0].function.arguments = "not json";
  invalid.push(malformed);
  const duplicateTools = completed();
  duplicateTools.choices[0].message.tool_calls.push(
    duplicateTools.choices[0].message.tool_calls[0],
  );
  invalid.push(duplicateTools);
  for (const value of invalid) {
    let calls = 0;
    globalThis.fetch = async (url) => {
      calls++;
      assert.equal(url, "https://openrouter.ai/api/v1/chat/completions");
      return Response.json(value);
    };
    await assert.rejects(translateBatch(user(), input), (error: any) => {
      assert.equal(error.status, 502);
      assert.equal(error.code, "TRANSLATION_FAILED");
      assert.equal(error.message.includes("never-expose"), false);
      return true;
    });
    assert.equal(calls, 1);
  }
  for (const response of [
    () => new Response("Rejected", { status: 401 }),
    () => new Response("invalid json"),
    () => {
      throw new DOMException("Timeout", "TimeoutError");
    },
  ]) {
    let calls = 0;
    globalThis.fetch = async () => {
      calls++;
      return response();
    };
    await assert.rejects(translateBatch(user(), input), {
      status: 502,
      code: "TRANSLATION_FAILED",
    });
    assert.equal(calls, 1);
  }
});

test("quota is per user, shared between routes, and expires after an hour", async () => {
  process.env.OPENROUTER_API_KEY = "test-only";
  let calls = 0;
  globalThis.fetch = async (_url, options) => {
    calls++;
    const request = JSON.parse(
      JSON.parse(String(options?.body)).messages[1].content,
    );
    return Response.json(
      completed(
        request.fields.map(({ id }: any) => ({
          id,
          translations: translations(),
        })),
      ),
    );
  };
  const id = user();
  for (let i = 0; i < 19; i++) await translateBatch(id, input);
  await translateText({ source: "en", target: "he", text: "Test" }, id);
  await assert.rejects(translateBatch(id, input), {
    status: 429,
    code: "TRANSLATION_LIMIT",
  });
  assert.equal(calls, 20);
  await translateBatch(user(), input);
  const originalNow = Date.now;
  try {
    const nextHour = originalNow() + 3600001;
    Date.now = () => nextHour;
    await translateBatch(id, input);
  } finally {
    Date.now = originalNow;
  }
  assert.equal(calls, 22);
});

test("pending requests are rejected per user and a failure releases the pending guard", async () => {
  process.env.OPENROUTER_API_KEY = "test-only";
  let release: () => void = () => {};
  let entered: () => void = () => {};
  const called = new Promise<void>((resolve) => {
    entered = resolve;
  });
  const waiting = new Promise<void>((resolve) => {
    release = resolve;
  });
  globalThis.fetch = async () => {
    entered();
    await waiting;
    throw new Error("Failed");
  };
  const id = user();
  const first = translateBatch(id, input);
  const failed = assert.rejects(first, { status: 502 });
  await called;
  await assert.rejects(
    translateText({ source: "en", target: "he", text: "Test" }, id),
    { status: 429, code: "TRANSLATION_LIMIT" },
  );
  release();
  await failed;
  globalThis.fetch = async () => Response.json(completed());
  await translateBatch(id, input);
});

test("webhook precedence and sequential legacy batch preserve source without fallback on failure", async () => {
  process.env.TRANSLATION_WEBHOOK_URL = "https://translation.example.test";
  process.env.TRANSLATION_WEBHOOK_TOKEN = "webhook-test-secret";
  process.env.OPENROUTER_API_KEY = "unused-openrouter";
  process.env.OPENAI_API_KEY = "unused-openai";
  assert.deepEqual(translationStatus(), {
    configured: true,
    provider: "webhook",
  });
  let calls = 0;
  let pending = 0;
  globalThis.fetch = async (url, options) => {
    calls++;
    pending++;
    assert.equal(pending, 1);
    assert.equal(url, "https://translation.example.test");
    assert.equal(
      (options?.headers as any).authorization,
      "Bearer webhook-test-secret",
    );
    const request = JSON.parse(String(options?.body));
    assert.equal(request.source, "en");
    assert.notEqual(request.target, "en");
    await Promise.resolve();
    pending--;
    return Response.json({ text: translations()[request.target as "he"] });
  };
  const result = await translateBatch(user(), input);
  assert.equal(calls, 6);
  assert.equal(result.fields[0].translations.en, input.fields[0].text);
  calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return calls === 2
      ? new Response("Failure", { status: 503 })
      : Response.json({ text: "Translated" });
  };
  await assert.rejects(translateBatch(user(), input), { status: 502 });
  assert.equal(calls, 2);
});

test("OpenAI is available when other adapters are unconfigured and batch returns no partial output", async () => {
  process.env.OPENAI_API_KEY = "test-only-openai";
  assert.deepEqual(translationStatus(), {
    configured: true,
    provider: "openai",
  });
  let calls = 0;
  globalThis.fetch = async (url) => {
    calls++;
    assert.equal(url, "https://api.openai.com/v1/responses");
    return Response.json({
      status: "completed",
      output: [
        {
          type: "message",
          role: "assistant",
          content: [{ type: "output_text", text: "Translated" }],
        },
      ],
    });
  };
  assert.equal((await translateBatch(user(), input)).fields.length, 2);
  assert.equal(calls, 6);
  delete process.env.OPENAI_API_KEY;
  assert.deepEqual(translationStatus(), { configured: false, provider: null });
  await assert.rejects(translateBatch(user(), input), {
    status: 503,
    code: "PROVIDER_REQUIRED",
  });
});
