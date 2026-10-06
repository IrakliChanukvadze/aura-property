import { test } from "node:test";
import assert from "node:assert/strict";
import {
  phone,
  commission,
  accrued,
  workdays,
  hashPassword,
  verifyPassword,
} from "./domain.js";
test("phone normalizes formatting without guessing country codes", () => {
  assert.equal(phone("+995 (555) 12-34-56"), "+995555123456");
  assert.throws(() => phone("abc"));
});
test("commission uses actual sale and fixed FX with cover remainder", () => {
  assert.deepEqual(commission(100000, 2.7, 1, 0.5, 0.25), {
    gelTotal: 270000,
    agentAmount: 2700,
    leadAmount: 675,
    actingAmount: 675,
  });
  assert.throws(() => commission(1, 1, 1, 0.2, 0.25));
});
test("leave accrues completed joining-date months and counts flexible workdays", () => {
  assert.equal(accrued(new Date("2026-01-15"), new Date("2026-03-14")), 2);
  assert.equal(accrued(new Date("2026-01-15"), new Date("2026-03-15")), 4);
  assert.equal(
    workdays(new Date("2026-10-05"), new Date("2026-10-11"), [0, 1, 2, 3, 4]),
    5,
  );
});
test("password hashing has distinct salts and rejects incorrect passwords", () => {
  const h = hashPassword("correct-horse-123");
  assert.notEqual(h, hashPassword("correct-horse-123"));
  assert.equal(verifyPassword("correct-horse-123", h), true);
  assert.equal(verifyPassword("wrong", h), false);
});
test("joining-day accrual clamps month ends and preserves original anniversary", () => {
  assert.equal(
    accrued(new Date("2026-01-31T08:00:00Z"), new Date("2026-02-27T20:00:00Z")),
    2,
  );
  assert.equal(
    accrued(new Date("2026-01-31T08:00:00Z"), new Date("2026-03-30T10:00:00Z")),
    2,
  );
  assert.equal(
    accrued(new Date("2026-01-31T08:00:00Z"), new Date("2026-03-30T20:00:00Z")),
    4,
  );
  assert.equal(accrued(new Date("2024-01-31"), new Date("2024-02-29")), 2);
  assert.equal(accrued(new Date("2026-12-01"), new Date("2026-10-06")), 0);
});
