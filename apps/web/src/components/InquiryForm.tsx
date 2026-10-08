"use client";
import { useState } from "react";
import { ArrowUpRight, Check } from "lucide-react";
import { apiBase, type Project } from "@/lib/api";
import { type Locale, t } from "@/lib/i18n";
interface Props {
  locale: Locale;
  projectId?: string;
  unitId?: string;
  demo?: boolean;
  project?: Project;
}
export function InquiryForm({
  locale,
  projectId,
  unitId,
  demo = false,
  project,
}: Props) {
  const d = t(locale);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [otp, setOtp] = useState(false);
  const [optional, setOptional] = useState(false);
  const [optionalAvailable, setOptionalAvailable] = useState(false);
  const [payload, setPayload] = useState<Record<string, unknown> | null>(null);
  const [code, setCode] = useState("");
  const [leadId, setLeadId] = useState("");
  const [phone, setPhone] = useState("");
  const [verified, setVerified] = useState(false);
  const [developmentCode, setDevelopmentCode] = useState("");
  const floors = project?.buildings.flatMap((b) => b.floors) || [];
  const floorNumbers = [...new Set(floors.map((f) => f.number))].sort(
    (a, b) => a - b,
  );
  const sizes = [
    ...new Set(
      floors
        .flatMap((f) => f.units)
        .filter((u) => u.area > 0)
        .map((u) => u.area),
    ),
  ].sort((a, b) => a - b);
  async function request(path: string, data: Record<string, unknown>) {
    const response = await fetch(`${apiBase}/public/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) {
      if (result.error?.code === "SMS_UNAVAILABLE")
        throw new Error(
          path === "inquiries"
            ? d.duplicateOtpUnavailable
            : d.optionalOtpUnavailable,
        );
      throw new Error(result.error?.message || result.message || d.error);
    }
    return result.data;
  }
  async function send(data: Record<string, unknown>) {
    setBusy(true);
    setError("");
    try {
      const result = await request("inquiries", data);
      if (result.requiresOtp) {
        setOtp(true);
        setOptional(false);
        setPayload({ ...data, requestId: result.requestId });
        setDevelopmentCode(
          result.developmentOtp?.code || result.developmentOtp || "",
        );
      } else {
        setSuccess(true);
        setOptionalAvailable(result.optionalVerificationAvailable === true);
        setOtp(false);
        setLeadId(result.id);
        setPhone(String(data.phone || ""));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : d.error);
    } finally {
      setBusy(false);
    }
  }
  async function optionalRequest() {
    setBusy(true);
    setError("");
    try {
      const result = await request(
        `inquiries/${encodeURIComponent(leadId)}/verify-request`,
        { phone },
      );
      setPayload({ requestId: result.requestId });
      setDevelopmentCode(
        result.developmentOtp?.code || result.developmentOtp || "",
      );
      setOtp(true);
      setOptional(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : d.error);
    } finally {
      setBusy(false);
    }
  }
  async function verify() {
    if (!optional) {
      await send({ ...payload, otpCode: code });
      return;
    }
    setBusy(true);
    setError("");
    try {
      await request("inquiries/verify", {
        requestId: payload?.requestId,
        otpCode: code,
      });
      setVerified(true);
      setOtp(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : d.error);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="inquiry-form">
      {demo ? (
        <p className="notice">
          {d.demo}. Inquiry submissions for illustrative apartments are
          disabled.
        </p>
      ) : otp ? (
        <div>
          <h3>{optional ? d.optionalOtp : d.duplicateOtp}</h3>
          {process.env.NODE_ENV !== "production" && developmentCode && (
            <p className="demo-label">Development OTP: {developmentCode}</p>
          )}
          <label>
            {d.code}
            <input
              autoComplete="one-time-code"
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </label>
          <button
            className="button primary"
            disabled={busy || !code}
            onClick={verify}
          >
            {d.verify}
          </button>
          {optional && (
            <button className="button" onClick={() => setOtp(false)}>
              {d.skip}
            </button>
          )}
        </div>
      ) : success ? (
        <div className="form-success" role="status">
          <Check />
          <h3>{d.success}</h3>
          {!verified && optionalAvailable && (
            <>
              <p>{d.optionalOtp}</p>
              <button
                className="button"
                disabled={busy}
                onClick={optionalRequest}
              >
                {d.verify}
              </button>
            </>
          )}
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            const name = String(form.get("name") || "").trim();
            const phone = String(form.get("phone") || "").trim();
            if (!/^[+\d][\d\s().-]{6,24}$/.test(phone)) {
              setError(d.invalidPhone);
              return;
            }
            const minFloor = form.get("minFloor");
            const maxFloor = form.get("maxFloor");
            if (minFloor && maxFloor && Number(minFloor) > Number(maxFloor)) {
              setError(d.invalidFloor);
              return;
            }
            send({
              name,
              phone,
              email: String(form.get("email") || "").trim() || undefined,
              nationality:
                String(form.get("country") || "").trim() || undefined,
              message: String(form.get("message") || "").trim() || undefined,
              consent: form.get("consent") === "on",
              locale,
              projectId,
              unitId,
              ...(project && !unitId
                ? {
                    apartmentSizes: form.getAll("apartmentSizes").map(Number),
                    minFloor: minFloor ? Number(minFloor) : undefined,
                    maxFloor: maxFloor ? Number(maxFloor) : undefined,
                  }
                : {}),
            });
          }}
        >
          <div className="form-grid">
            <label>
              {d.name}
              <input
                name="name"
                required
                minLength={2}
                maxLength={120}
                autoComplete="name"
              />
            </label>
            <label>
              {d.phone}
              <input
                name="phone"
                type="tel"
                required
                autoComplete="tel"
                placeholder="+995"
                dir="ltr"
              />
            </label>
            <label>
              {d.email}
              <input name="email" type="email" autoComplete="email" dir="ltr" />
            </label>
            <label>
              {d.country}
              <input name="country" autoComplete="country-name" />
            </label>
          </div>
          {project && !unitId && (
            <fieldset className="inquiry-preferences">
              <legend>
                {d.area} / {d.floor} ({d.any})
              </legend>
              <div className="size-options">
                {sizes.map((size) => (
                  <label key={size}>
                    <input type="checkbox" name="apartmentSizes" value={size} />
                    {size} m²
                  </label>
                ))}
              </div>
              <div className="form-grid">
                <label>
                  {d.floor} — {d.minimum}
                  <select name="minFloor">
                    <option value="">{d.any}</option>
                    {floorNumbers.map((n) => (
                      <option key={n}>{n}</option>
                    ))}
                  </select>
                </label>
                <label>
                  {d.floor} — {d.maximum}
                  <select name="maxFloor">
                    <option value="">{d.any}</option>
                    {floorNumbers.map((n) => (
                      <option key={n}>{n}</option>
                    ))}
                  </select>
                </label>
              </div>
            </fieldset>
          )}
          <label>
            {d.message}
            <textarea name="message" rows={3} maxLength={3000} />
          </label>
          <label className="consent">
            <input name="consent" type="checkbox" required />
            <span>{d.consent}</span>
          </label>
          <button className="button primary" disabled={busy} type="submit">
            {busy ? "…" : d.submit}
            <ArrowUpRight size={18} />
          </button>
        </form>
      )}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </div>
  );
}
