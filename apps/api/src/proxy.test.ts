import { test } from "node:test";
import assert from "node:assert/strict";
import Fastify from "fastify";
import rateLimit from "@fastify/rate-limit";
import { contentReadAllowList, trustedProxyAddresses } from "./proxy.js";

test("reverse proxy trust accepts explicit peers only", () => {
  assert.equal(trustedProxyAddresses(), false);
  assert.deepEqual(trustedProxyAddresses("172.30.80.2"), ["172.30.80.2"]);
  for (const value of ["true", "1", "0.0.0.0/0", "loopback", "172.30.80.2,"])
    assert.throws(() => trustedProxyAddresses(value), /explicit proxy IP/);
});

test("proxy clients get individual rate limits and direct clients cannot spoof forwarding headers", async () => {
  const app = Fastify({ trustProxy: trustedProxyAddresses("172.30.80.2") });
  await app.register(rateLimit, { max: 2, timeWindow: "1 minute" });
  app.get("/", async (request) => ({ ip: request.ip }));
  try {
    const throughProxy = (ip: string) => app.inject({
      url: "/", remoteAddress: "172.30.80.2", headers: { "x-forwarded-for": ip },
    });
    assert.equal((await throughProxy("198.51.100.10")).json().ip, "198.51.100.10");
    await throughProxy("198.51.100.10");
    assert.equal((await throughProxy("198.51.100.10")).statusCode, 429);
    assert.equal((await throughProxy("198.51.100.20")).statusCode, 200);
    const direct = (ip: string) => app.inject({
      url: "/", remoteAddress: "198.51.100.30", headers: { "x-forwarded-for": ip },
    });
    assert.equal((await direct("203.0.113.1")).json().ip, "198.51.100.30");
    await direct("203.0.113.2");
    assert.equal((await direct("203.0.113.3")).statusCode, 429);
  } finally { await app.close(); }
});

test("only private server-rendered catalog reads bypass the shared rate bucket", async () => {
  const app = Fastify({ trustProxy: trustedProxyAddresses("172.30.80.2") });
  await app.register(rateLimit, { max: 1, timeWindow: "1 minute", allowList: contentReadAllowList("172.30.80.3") });
  app.get("/api/public/projects", async () => ({}));
  app.post("/api/public/inquiries", async () => ({}));
  app.post("/api/auth/login", async () => ({}));
  try {
    for (let i = 0; i < 3; i++) assert.equal((await app.inject({ url: "/api/public/projects", remoteAddress: "172.30.80.3" })).statusCode, 200);
    const browserRequest = { url: "/api/public/projects", remoteAddress: "172.30.80.2", headers: { "x-forwarded-for": "172.30.80.3" } };
    assert.equal((await app.inject(browserRequest)).statusCode, 200);
    assert.equal((await app.inject(browserRequest)).statusCode, 429);
    // The same IP has exhausted its bucket; internal auth never gets the read exemption.
    assert.equal((await app.inject({ method: "POST", url: "/api/auth/login", remoteAddress: "172.30.80.3" })).statusCode, 429);
    assert.equal((await app.inject({ method: "POST", url: "/api/auth/login", remoteAddress: "172.30.80.3" })).statusCode, 429);
    assert.equal((await app.inject({ method: "POST", url: "/api/public/inquiries", remoteAddress: "172.30.80.3" })).statusCode, 429);
  } finally { await app.close(); }
});
