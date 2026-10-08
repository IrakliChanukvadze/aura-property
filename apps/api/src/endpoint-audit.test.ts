import { test, after } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";
process.env.NODE_ENV = "test";
process.env.DEV_INTEGRATIONS = "true";
const { buildApp } = await import("./server.js");
const { db } = await import("./db.js");
const { digest } = await import("./domain.js");
const app = await buildApp();
const tag = `endpoint-audit-${randomUUID()}`;
const users: string[] = [];
const routes: { method: string; url: string }[] = [];
for (const file of await readdir(new URL(".", import.meta.url))) {
  if (!file.endsWith(".ts") || file.endsWith(".test.ts")) continue;
  const source = await readFile(new URL(file, import.meta.url), "utf8");
  for (const match of source.matchAll(
    /app\.(get|post|patch|put|delete)\(\s*["']([^"']+)["']/g,
  ))
    routes.push({ method: match[1].toUpperCase(), url: match[2] });
}
const urlFor = (path: string) => path.replace(/:[A-Za-z]+/g, `${tag}-missing`);
const openAuth = new Set([
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/recover",
  "/api/auth/accept-invitation",
]);
const publicRoute = (url: string) =>
  url.startsWith("/api/public/") || url === "/api/health" || openAuth.has(url);
after(async () => {
  await db.audit.deleteMany({ where: { actorId: { in: users } } });
  await db.user.deleteMany({ where: { id: { in: users } } });
  await app.close();
  await db.$disconnect();
});

test("every declared API route is registered and enforces authentication without unexpected server errors", async () => {
  assert.ok(
    routes.length >= 65,
    `Unexpectedly small route inventory: ${routes.length}`,
  );
  const failures: string[] = [];
  for (const route of routes) {
    assert.ok(
      app.hasRoute({ method: route.method as any, url: route.url }),
      `Unregistered ${route.method} ${route.url}`,
    );
    const response = await app.inject({
      method: route.method as any,
      url: urlFor(route.url),
      remoteAddress: "127.70.0.1",
      ...(route.method === "GET" ? {} : { payload: {} }),
    });
    if (!publicRoute(route.url))
      assert.equal(
        response.statusCode,
        401,
        `${route.method} ${route.url}: ${response.body}`,
      );
    if (response.statusCode >= 500)
      failures.push(`${route.method} ${route.url}: ${response.body}`);
  }
  assert.deepEqual(failures, []);
  console.log(
    `AUDIT_ROUTES ${routes.length} registered routes checked anonymously`,
  );
});

test("all API routes respond predictably for every role with malformed or missing-resource requests", async () => {
  const failures: string[] = [];
  const matrix: Record<string, Record<string, number>> = {};
  for (const [index, role] of [
    "SUPER_ADMIN",
    "TEAM_LEAD",
    "AGENT",
    "EDITOR",
  ].entries()) {
    const id = `${tag}-${role}`;
    users.push(id);
    await db.user.create({
      data: {
        id,
        email: `${id}@example.test`,
        name: "Endpoint audit",
        role,
        contentEdit: role === "EDITOR",
      },
    });
    await db.session.create({
      data: {
        id: digest(id),
        userId: id,
        expiresAt: new Date(Date.now() + 3600000),
      },
    });
    matrix[role] = {};
    for (const route of routes) {
      if (openAuth.has(route.url)) continue; // Logout would invalidate the rest of this role's session.
      const response = await app.inject({
        method: route.method as any,
        url: urlFor(route.url),
        remoteAddress: `127.70.1.${index + 1}`,
        headers: {
          origin: "http://localhost:5173",
          cookie: `aura_session=${id}`,
        },
        ...(route.method === "GET" ? {} : { payload: {} }),
      });
      matrix[role][`${route.method} ${route.url}`] = response.statusCode;
      if (
        response.statusCode >= 500 ||
        response.statusCode === 401 ||
        response.statusCode === 429
      )
        failures.push(
          `${role} ${route.method} ${route.url}: ${response.statusCode} ${response.body}`,
        );
      if (route.method === "GET" && route.url === "/api/leads/export")
        assert.equal(response.statusCode, role === "SUPER_ADMIN" ? 200 : 403);
      if (route.method === "GET" && route.url === "/api/site")
        assert.equal(
          response.statusCode,
          ["SUPER_ADMIN", "EDITOR"].includes(role) ? 200 : 403,
        );
      if (
        role === "EDITOR" &&
        /^\/api\/(leads|sales|reservations|comments|reminders|commissions|leaderboards|dashboard)(\/|$)/.test(
          route.url,
        )
      )
        assert.equal(
          response.statusCode,
          403,
          `${route.method} ${route.url} must exclude editors`,
        );
    }
    const logout = await app.inject({
      method: "POST",
      url: "/api/auth/logout",
      headers: {
        origin: "http://localhost:5173",
        cookie: `aura_session=${id}`,
      },
    });
    assert.equal(logout.statusCode, 200);
    const afterLogout = await app.inject({
      method: "GET",
      url: "/api/auth/me",
      headers: { cookie: `aura_session=${id}` },
    });
    assert.equal(afterLogout.statusCode, 401);
  }
  assert.deepEqual(failures, []);
  console.log("AUDIT_ROLE_MATRIX " + JSON.stringify(matrix));
});

test("browser preflight permits PATCH/DELETE for trusted origins and never allows untrusted origins", async () => {
  for (const method of ["GET", "POST", "PATCH", "DELETE"]) {
    const response = await app.inject({
      method: "OPTIONS",
      url: "/api/site",
      headers: {
        origin: "http://localhost:5173",
        "access-control-request-method": method,
        "access-control-request-headers": "content-type",
      },
    });
    assert.equal(response.statusCode, 204);
    assert.equal(
      response.headers["access-control-allow-origin"],
      "http://localhost:5173",
    );
    assert.equal(response.headers["access-control-allow-credentials"], "true");
    assert.ok(
      String(response.headers["access-control-allow-methods"])
        .split(",")
        .map((x) => x.trim())
        .includes(method),
    );
  }
  const denied = await app.inject({
    method: "OPTIONS",
    url: "/api/site",
    headers: {
      origin: "https://untrusted.example",
      "access-control-request-method": "PATCH",
    },
  });
  assert.equal(denied.headers["access-control-allow-origin"], undefined);
  const csrf = await app.inject({
    method: "PATCH",
    url: "/api/site",
    headers: {
      origin: "https://untrusted.example",
      cookie: "aura_session=unknown",
    },
    payload: {},
  });
  assert.equal(csrf.statusCode, 403);
  assert.equal(csrf.json().error.code, "CSRF");
});
