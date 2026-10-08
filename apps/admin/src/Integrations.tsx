import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError } from "./api";
import { Modal } from "./ui";
import {
  integrationCopy,
  integrationLocale,
  integrationText,
  type IntegrationId,
} from "./integrations-copy";
import "./Integrations.css";

type Integration = {
  id: IntegrationId;
  provider: "resend" | "openrouter" | "openai" | "r2" | "webhook" | null;
  configured: boolean;
  mode: "live" | "development" | "missing";
  state: "configured" | "incomplete" | "not_configured" | "development";
  requiredFields: { name: string; configured: boolean }[];
  guides: { title: string; url: string }[];
  capabilities: { configurationCheck: boolean; liveCheck: boolean };
};
type CheckResult = {
  integrationId: IntegrationId;
  status:
    | "configuration_valid"
    | "configuration_incomplete"
    | "not_configured"
    | "development";
  checkedAt: string;
  checks: { code: string; passed: boolean; message: string }[];
};
type CheckError = "failed" | "denied" | "limited";

function ServiceIcon({ id }: { id: IntegrationId }) {
  const paths: Record<IntegrationId, React.ReactNode> = {
    email: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="3" />
        <path d="m4 7 8 6 8-6" />
      </>
    ),
    translation: (
      <>
        <path d="M3 5h12M9 3v2M5 5c0 6 6 10 10 11M13 5c0 5-4 9-10 12M14 21l4-10 4 10M15.5 17h5" />
      </>
    ),
    storage: (
      <>
        <path d="M3 8V5a2 2 0 0 1 2-2h5l3 3h6a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8Z" />
        <path d="M3 9h18" />
      </>
    ),
    sms: (
      <>
        <rect x="6" y="2" width="12" height="20" rx="3" />
        <path d="M10 5h4M11 18h2" />
      </>
    ),
    fx: (
      <>
        <path d="M4 8h15l-4-4M20 16H5l4 4" />
        <path d="M19 8v3M5 16v-3" />
      </>
    ),
  };
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[id]}
    </svg>
  );
}

export function Integrations({
  onOpenSettings,
}: {
  onOpenSettings: () => void;
}) {
  const locale = integrationLocale();
  const c = integrationCopy[locale];
  const [items, setItems] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<CheckError | null>(null);
  const [selectedId, setSelectedId] = useState<IntegrationId | null>(null);
  const [checkingId, setCheckingId] = useState<IntegrationId | null>(null);
  const [results, setResults] = useState<
    Partial<Record<IntegrationId, CheckResult>>
  >({});
  const [checkErrors, setCheckErrors] = useState<
    Partial<Record<IntegrationId, CheckError>>
  >({});
  const inFlight = useRef(false);
  const closeGuide = useCallback(() => setSelectedId(null), []);
  const errorType = (error: unknown): CheckError =>
    error instanceof ApiError && error.code === "FORBIDDEN"
      ? "denied"
      : error instanceof ApiError &&
          ["RATE_LIMIT", "RATE_LIMIT_EXCEEDED", "FST_ERR_RATE_LIMIT"].includes(
            error.code,
          )
        ? "limited"
        : "failed";
  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await api<{ items: Integration[] }>("/integrations");
      setItems(data.items);
    } catch (error) {
      setLoadError(errorType(error));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const check = async (item: Integration) => {
    if (inFlight.current || !item.capabilities.configurationCheck) return;
    inFlight.current = true;
    setCheckingId(item.id);
    setCheckErrors((current) => ({ ...current, [item.id]: undefined }));
    try {
      const result = await api<CheckResult>(
        `/integrations/${item.id}/check`,
        "POST",
        {},
      );
      setResults((current) => ({ ...current, [item.id]: result }));
      await load();
    } catch (error) {
      setCheckErrors((current) => ({
        ...current,
        [item.id]: errorType(error),
      }));
    } finally {
      inFlight.current = false;
      setCheckingId(null);
    }
  };
  const errorText = (error: CheckError) =>
    error === "denied"
      ? c.checkDenied
      : error === "limited"
        ? c.checkLimited
        : c.checkFailed;
  const stateText = (item: Integration) =>
    checkErrors[item.id]
      ? c.checkError
      : item.state === "configured"
        ? c.configured
        : item.state === "incomplete"
          ? c.incomplete
          : item.state === "development"
            ? c.development
            : c.missing;
  const stateNote = (item: Integration) =>
    checkErrors[item.id]
      ? c.checkErrorNote
      : item.state === "configured"
        ? c.configuredNote
        : item.state === "incomplete"
          ? c.incompleteNote
          : item.state === "development"
            ? c.developmentNote
            : c.missingNote;
  const stateClass = (item: Integration) =>
    checkErrors[item.id] ? "failed" : item.state;
  const providerName = (item: Integration) =>
    item.provider === "webhook"
      ? c.relay
      : item.provider === "openai"
        ? "OpenAI"
        : integrationText(locale, item.id).provider;
  const resultTitle = (result: CheckResult) =>
    result.status === "configuration_valid"
      ? c.checkPassed
      : result.status === "configuration_incomplete"
        ? c.checkIncomplete
        : result.status === "development"
          ? c.checkDevelopment
          : c.checkMissing;
  const checkRule = (code: string) =>
    code === "API_KEY"
      ? c.keyRule
      : code === "SENDER"
        ? c.senderRule
        : code === "WEBHOOK_URL"
          ? c.urlRule
          : code === "ACCOUNT_FORMAT"
            ? c.accountRule
            : code === "BUCKET_FORMAT"
              ? c.bucketRule
              : c.r2Rule;
  const fieldTitle = (name: string) =>
    name === "EMAIL_FROM"
      ? c.fieldSender
      : name === "R2_ACCOUNT_ID"
        ? c.fieldAccount
        : name === "R2_ACCESS_KEY_ID"
          ? c.fieldAccess
          : name === "R2_SECRET_ACCESS_KEY"
            ? c.fieldSecret
            : name === "R2_BUCKET"
              ? c.fieldBucket
              : name.endsWith("_URL")
                ? c.fieldUrl
                : c.fieldKey;
  const guideTitle = (url: string) =>
    url.includes("/domains/")
      ? c.docsDomain
      : url.includes("/api-keys")
        ? c.docsKey
        : url.includes("authentication")
          ? c.docsAuth
          : url.includes("create-buckets")
            ? c.docsBucket
            : url.includes("/tokens/")
              ? c.docsToken
              : c.docsProvider;
  const selected = items.find((item) => item.id === selectedId);
  const selectedCopy = selected ? integrationText(locale, selected.id) : null;
  const selectedResult = selected ? results[selected.id] : undefined;
  const selectedError = selected ? checkErrors[selected.id] : undefined;
  const selectedGuides =
    selected?.guides.filter((guide) => {
      if (selected.provider === "webhook") return false;
      if (selected.id !== "translation") return true;
      return selected.provider === "openai"
        ? guide.url.includes("openai.com/")
        : guide.url.includes("openrouter.ai/");
    }) || [];
  const configuredCount = items.filter((item) => item.configured).length;
  const checkErrorCount = items.filter((item) => checkErrors[item.id]).length;

  return (
    <div className="integrations">
      <div className="integrations-intro">
        <p>{c.intro}</p>
        <button
          onClick={() => void load()}
          disabled={loading || checkingId !== null}
        >
          {loading && items.length ? c.loading : c.refresh}
        </button>
      </div>
      {loadError && (
        <div role="alert" className="error integrations-load-error">
          <p>{loadError === "denied" ? c.checkDenied : c.unavailable}</p>
          <button onClick={() => void load()} disabled={loading}>
            {c.retry}
          </button>
        </div>
      )}
      {loading && !items.length && (
        <p role="status" className="integrations-loading">
          {c.loading}
        </p>
      )}
      {items.length > 0 && (
        <>
          <div className="integrations-summary" aria-label={c.summary}>
            <span>
              <strong>{configuredCount}</strong> {c.configured}
            </span>
            <span>
              <strong>{items.length - configuredCount}</strong> {c.attention}
            </span>
            {checkErrorCount > 0 && (
              <span>
                <strong>{checkErrorCount}</strong> {c.checkError}
              </span>
            )}
            <small>{c.unverified}</small>
          </div>
          <div className="integrations-services">
            {items.map((item) => {
              const text = integrationText(locale, item.id);
              return (
                <article className="integrations-service" key={item.id}>
                  <div
                    className={`integrations-icon integrations-icon-${item.id}`}
                  >
                    <ServiceIcon id={item.id} />
                  </div>
                  <div className="integrations-service-info">
                    <div className="integrations-service-heading">
                      <h2>{text.title}</h2>
                      <span className="integrations-provider">
                        <bdi>{providerName(item)}</bdi>
                      </span>
                    </div>
                    <p>{text.purpose}</p>
                    <span
                      className={`integrations-state integrations-state-${stateClass(item)}`}
                    >
                      <span aria-hidden="true" />
                      {stateText(item)}
                    </span>
                  </div>
                  <button
                    className="integrations-review"
                    onClick={() => setSelectedId(item.id)}
                    aria-label={`${c.review}: ${text.title}`}
                  >
                    {c.review}
                    <span aria-hidden="true">↗</span>
                  </button>
                </article>
              );
            })}
          </div>
          <div className="integrations-managed">
            <span aria-hidden="true">⌑</span>
            <p>
              <strong>{c.managed}</strong>
              {c.managedNote}
            </p>
          </div>
          <section className="integrations-future">
            <h2>{c.future}</h2>
            <p>{c.futureNote}</p>
            <p className="integrations-future-channels">{c.futureChannels}</p>
          </section>
        </>
      )}
      {selected && selectedCopy && (
        <Modal title={selectedCopy.title} onClose={closeGuide}>
          <div className="integrations-detail">
            <div className="integrations-detail-lead">
              <div
                className={`integrations-icon integrations-icon-${selected.id}`}
              >
                <ServiceIcon id={selected.id} />
              </div>
              <div>
                <span className="integrations-provider">
                  <bdi>{providerName(selected)}</bdi>
                </span>
                <p>{selectedCopy.purpose}</p>
              </div>
            </div>
            <div className="integrations-detail-status">
              <span
                className={`integrations-state integrations-state-${stateClass(selected)}`}
              >
                <span aria-hidden="true" />
                {stateText(selected)}
              </span>
              <p>{stateNote(selected)}</p>
            </div>
            <div className="integrations-needs">
              <h3>{c.needs}</h3>
              <p>{c.needsNote}</p>
            </div>
            <ol className="integrations-steps" aria-label={c.guide}>
              <li>
                <span className="integrations-step-number" aria-hidden="true">
                  1
                </span>
                <div>
                  <h3>{c.instructions}</h3>
                  <p>
                    {selected.provider === "webhook" &&
                    ["email", "translation", "storage"].includes(selected.id)
                      ? c.webhookInstruction
                      : selected.provider === "openai"
                        ? c.prepareOpenai
                        : selectedCopy.prepare}
                  </p>
                  {selectedGuides.length > 0 && (
                    <div className="integrations-guides" aria-label={c.docs}>
                      {selectedGuides.map((guide) => (
                        <a
                          href={guide.url}
                          target="_blank"
                          rel="noreferrer"
                          key={guide.url}
                        >
                          {guideTitle(guide.url)}{" "}
                          <span aria-hidden="true">↗</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </li>
              <li>
                <span className="integrations-step-number" aria-hidden="true">
                  2
                </span>
                <div>
                  <h3>{c.requirements}</h3>
                  <p>{c.requirementsNote}</p>
                  <details className="integrations-technical">
                    <summary>{c.settingNames}</summary>
                    <dl className="integrations-fields">
                      {selected.requiredFields.map((field) => (
                        <div key={field.name}>
                          <dt>
                            <span className="integrations-field-label">
                              {fieldTitle(field.name)}
                            </span>
                            <code dir="ltr">{field.name}</code>
                          </dt>
                          <dd
                            className={
                              field.configured
                                ? "integrations-field-present"
                                : "integrations-field-missing"
                            }
                          >
                            {field.configured ? c.present : c.notSet}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </details>
                </div>
              </li>
              <li>
                <span className="integrations-step-number" aria-hidden="true">
                  3
                </span>
                <div>
                  <h3>{c.checkHeading}</h3>
                  <p>{c.checkNote}</p>
                  <button
                    className="primary"
                    aria-disabled={
                      checkingId !== null ||
                      !selected.capabilities.configurationCheck
                    }
                    aria-busy={checkingId === selected.id}
                    onClick={() => void check(selected)}
                  >
                    {checkingId === selected.id ? c.checking : c.check}
                  </button>
                  {selectedError && (
                    <p className="error integrations-check-error" role="alert">
                      {errorText(selectedError)}
                    </p>
                  )}
                  {selectedResult && !selectedError && (
                    <div
                      className={`integrations-result ${selectedResult.status === "configuration_valid" ? "integrations-result-valid" : "integrations-result-attention"}`}
                      role="status"
                    >
                      <strong>{resultTitle(selectedResult)}</strong>
                      <p>{c.unverified}</p>
                      <small>
                        {c.lastChecked}:{" "}
                        {new Date(selectedResult.checkedAt).toLocaleString(
                          locale,
                        )}
                      </small>
                      {selectedResult.checks.length > 0 && (
                        <ul>
                          {selectedResult.checks.map((entry) => (
                            <li key={entry.code}>
                              <span
                                className={
                                  entry.passed
                                    ? "integrations-field-present"
                                    : "integrations-field-missing"
                                }
                              >
                                {entry.passed ? c.valid : c.fix}
                              </span>
                              <div>
                                <code dir="ltr">{entry.code}</code>
                                <p>{checkRule(entry.code)}</p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              </li>
            </ol>
            <section className="integrations-after-setup">
              <h3>{c.afterSetup}</h3>
              <p>{selectedCopy.use}</p>
            </section>
            {selected.id === "fx" && (
              <div className="integrations-fx-note">
                <p>{c.fxManual}</p>
                <button
                  onClick={() => {
                    closeGuide();
                    onOpenSettings();
                  }}
                >
                  {c.settings}
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
