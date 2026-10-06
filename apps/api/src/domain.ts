import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHash,
} from "node:crypto";
export const stages = [
  "NEW",
  "NOT_ANSWERED",
  "CONTACTED",
  "VIEWING_SCHEDULED",
  "NEGOTIATION",
  "FINAL_DETAILS",
  "LOST",
  "WON",
] as const;
export function phone(value: string) {
  const p = value.replace(/[\s().-]/g, "");
  if (!/^\+?[0-9]{7,15}$/.test(p))
    throw new Error("Valid international phone required");
  return p.startsWith("+") ? p : `+${p}`;
}
export function hashPassword(value: string) {
  if (value.length < 12)
    throw new Error("Password must contain at least 12 characters");
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(value, salt, 64).toString("hex")}`;
}
export function verifyPassword(value: string, hash: string) {
  const [salt, key] = hash.split(":");
  if (!salt || !key) return false;
  const actual = scryptSync(value, salt, 64),
    expected = Buffer.from(key, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
export const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export function commission(
  price: number,
  rate: number,
  agentRate = 1,
  leadRate = 0.5,
  actingRate = 0,
) {
  if (price <= 0 || rate <= 0 || actingRate > leadRate)
    throw new Error("Invalid commission inputs");
  const gel = price * rate;
  const round = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
  return {
    gelTotal: round(gel),
    agentAmount: round((gel * agentRate) / 100),
    leadAmount: round((gel * (leadRate - actingRate)) / 100),
    actingAmount: round((gel * actingRate) / 100),
  };
}
/** Agency dates use Tbilisi (UTC+4); leave is tracked as whole calendar dates. */
export function agencyDate(value: Date) {
  return new Date(value.getTime() + 4 * 3600000).toISOString().slice(0, 10);
}
export function accrued(joined: Date, now: Date) {
  const [jy, jm, jd] = agencyDate(joined).split("-").map(Number),
    [ny, nm, nd] = agencyDate(now).split("-").map(Number);
  let months = (ny - jy) * 12 + nm - jm;
  const anniversary = Math.min(jd, new Date(Date.UTC(ny, nm, 0)).getUTCDate());
  if (nd < anniversary) months--;
  return Math.max(0, months) * 2;
}
export function workingDates(
  start: Date,
  end: Date,
  weekdays: number[],
  exceptions: Record<string, boolean> = {},
) {
  const dates: string[] = [];
  const last = agencyDate(end);
  for (
    let d = new Date(agencyDate(start) + "T00:00:00Z");
    d.toISOString().slice(0, 10) <= last;
    d.setUTCDate(d.getUTCDate() + 1)
  ) {
    const key = d.toISOString().slice(0, 10);
    if (exceptions[key] ?? weekdays.includes(d.getUTCDay())) dates.push(key);
  }
  return dates;
}
export function workdays(
  start: Date,
  end: Date,
  weekdays: number[],
  exceptions: Record<string, boolean> = {},
) {
  return workingDates(start, end, weekdays, exceptions).length;
}
export function consumedLeaveDays(snapshot: string[], returnAt: Date) {
  return snapshot.filter((date) => date < agencyDate(returnAt)).length;
}
export function validEarlyReturn(
  startsAt: Date,
  endsAt: Date,
  returnAt: Date,
  now: Date,
) {
  return (
    agencyDate(returnAt) >= agencyDate(now) &&
    agencyDate(returnAt) >= agencyDate(startsAt) &&
    agencyDate(returnAt) <= agencyDate(endsAt)
  );
}
