import { t } from "./i18n";
import { useEffect, useState } from "react";
import { api, download, mediaUrl } from "./api";
import {
  Form,
  Modal,
  Empty,
  currencies,
  languages,
  type Field,
  Money,
  UploadField,
} from "./ui";
const stages = [
  "NEW",
  "NOT_ANSWERED",
  "CONTACTED",
  "VIEWING_SCHEDULED",
  "NEGOTIATION",
  "FINAL_DETAILS",
];
const title = (s: string) =>
  t(
    s
      ?.replaceAll("_", " ")
      .toLowerCase()
      .replace(/^./, (x) => x.toUpperCase()),
  );
function timelineText(event: any, agents: any[], projects: any[]) {
  const data = event.payload || event.data || {};
  if (data.deleted) return t("Comment deleted");
  if (event.type === "COMMENT_EDIT") return data.to || "";
  if (data.comment || data.text || data.message)
    return data.comment || data.text || data.message;
  if (event.type === "ASSIGNED")
    return `${t("Agent")}: ${agents.find((a) => a.id === data.to)?.name || t("Team lead")}`;
  if (event.type === "INQUIRY") {
    const project = projects.find((p) => p.id === data.originalProject);
    return [
      project?.translations?.en?.title,
      data.apartmentSizes?.length
        ? `${t("Area")}: ${data.apartmentSizes.join(", ")} m²`
        : null,
      data.minFloor != null || data.maxFloor != null
        ? `${t("Floor")}: ${data.minFloor ?? "—"}–${data.maxFloor ?? "—"}`
        : null,
    ]
      .filter(Boolean)
      .join(" · ");
  }
  if (data.stage || data.toStage) return title(data.stage || data.toStage);
  if (data.dueAt) return new Date(data.dueAt).toLocaleString();
  return "";
}
const contactFields: Field[] = [
  { name: "name", label: t("Customer name"), required: true },
  { name: "phone", label: t("Phone"), type: "tel", required: true },
  {
    name: "nationality",
    label: t("Country / nationality"),
    value: "Unknown",
    required: true,
  },
  { name: "email", label: t("Email (optional)"), type: "email" },
  { name: "language", label: t("Contact language"), options: languages },
  {
    name: "projectIds",
    label: t("Projects of interest (IDs, comma separated)"),
  },
  { name: "budgetMin", label: t("Budget from (optional)"), type: "number" },
  { name: "budgetMax", label: t("Budget to (optional)"), type: "number" },
  { name: "budgetCurrency", label: t("Budget currency"), options: currencies },
];
const normalize = (v: any) => ({
  ...v,
  projectIds: (Array.isArray(v.projectIds)
    ? v.projectIds
    : String(v.projectIds || "").split(",")
  )
    .map((x: string) => x.trim())
    .filter(Boolean),
  budgetMin:
    v.budgetMin !== undefined && v.budgetMin !== ""
      ? Number(v.budgetMin)
      : undefined,
  budgetMax:
    v.budgetMax !== undefined && v.budgetMax !== ""
      ? Number(v.budgetMax)
      : undefined,
  ...(v.autoAssign !== undefined
    ? { autoAssign: v.autoAssign === true || v.autoAssign === "true" }
    : {}),
});
export function Leads({
  mode,
  user,
}: {
  mode: "active" | "lost" | "won";
  user: any;
}) {
  const [projects, setProjects] = useState<any[]>([]),
    [agents, setAgents] = useState<any[]>([]);
  useEffect(() => {
    api<any[]>("/projects")
      .then(setProjects)
      .catch(() => {});
    api<any[]>("/users")
      .then(setAgents)
      .catch(() => {});
  }, []);
  const units = projects.flatMap((p) =>
    (p.units || []).map((u: any) => ({
      ...u,
      projectName: p.translations?.en?.title || p.slug,
    })),
  );
  const unitOptions = [
    { value: "", label: t("Select available apartment") },
    ...units
      .filter((u) => u.status !== "SOLD")
      .map((u) => ({
        value: u.id,
        price:
          Number(u.price) * (u.priceMode === "PER_M2" ? Number(u.area) : 1),
        currency: u.priceCurrency,
        label: `${u.projectName} / #${u.number} · ${u.status}`,
      })),
  ];
  const [leads, setLeads] = useState<any[]>([]),
    [selected, setSelected] = useState<any>(null),
    [selectedSale, setSelectedSale] = useState<any>(null),
    [dialog, setDialog] = useState(""),
    [error, setError] = useState(""),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState(""),
    [projectFilter, setProjectFilter] = useState(""),
    [agentFilter, setAgentFilter] = useState(""),
    [sourceFilter, setSourceFilter] = useState(""),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [preview, setPreview] = useState<any>(null),
    [autoImport, setAutoImport] = useState(false),
    [busy, setBusy] = useState(false);
  const load = () =>
    api<any[]>(
      `/leads?scope=${mode}&search=${encodeURIComponent(query)}${filter ? `&stage=${filter}` : ""}&projectId=${projectFilter}&agentId=${agentFilter}&source=${sourceFilter}&from=${from}&to=${to}`,
    )
      .then((data) =>
        setLeads(
          data.filter((l) =>
            mode === "active"
              ? stages.includes(l.stage)
              : l.stage === mode.toUpperCase(),
          ),
        ),
      )
      .catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, [mode, query, filter, projectFilter, agentFilter, sourceFilter, from, to]);
  const show = async (l: any) => {
    try {
      setSelected(await api(`/leads/${l.id}`));
    } catch (e) {
      setError((e as Error).message);
    }
  };
  const changed = async () => {
    await load();
    if (selected) setSelected(await api(`/leads/${selected.id}`));
    setDialog("");
  };
  const action = async (path: string, body: any) => {
    await api(`/leads/${selected.id}/${path}`, "POST", body);
    await changed();
  };
  const visible = leads.filter(
    (l) =>
      !query ||
      `${l.customer?.name} ${l.customer?.phone}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="section-toolbar">
        <p className="muted">
          {mode === "active"
            ? "Every conversation, moving forward."
            : mode === "lost"
              ? "Review outcomes and keep the history."
              : "Signed sales and their lasting record."}
        </p>
        <div>
          <button onClick={() => setDialog("create")}>
            {t("＋ New lead")}
          </button>
          <button onClick={() => setDialog("import")}>
            {t("Import Excel")}
          </button>
          {user.role === "SUPER_ADMIN" && (
            <button
              onClick={() =>
                download("/leads/export", "aura-leads.xlsx").catch((e) =>
                  setError(e.message),
                )
              }
            >
              {t("Export")}
            </button>
          )}
        </div>
      </div>
      <div className="filters">
        <input
          placeholder={t("Search name or phone")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {mode === "active" && (
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value={""}>{t("All stages")}</option>
            {stages.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        )}
        <span className="muted">
          {visible.length}
          {t("records")}
        </span>
      </div>
      <div className="filters">
        <select
          aria-label={t("Project name")}
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
        >
          <option value="">{t("Project name")}</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.translations?.en?.title || p.slug}
            </option>
          ))}
        </select>
        <select
          aria-label={t("Agent")}
          value={agentFilter}
          onChange={(e) => setAgentFilter(e.target.value)}
        >
          <option value="">{t("Agent")}</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <select
          aria-label={t("Lead source")}
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
        >
          <option value="">{t("All sources")}</option>
          {["WEBSITE", "MANUAL", "EXCEL"].map((x) => (
            <option key={x} value={x}>
              {x}
            </option>
          ))}
        </select>
        <input
          type="date"
          aria-label={t("Received from")}
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
        <input
          type="date"
          aria-label={t("Received until")}
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {mode === "active" ? (
        <div className="kanban">
          {stages.map((stage) => (
            <section className="column" key={stage}>
              <h3>
                <i className={"dot " + stage} />
                {title(stage)}
                <small>{visible.filter((l) => l.stage === stage).length}</small>
              </h3>
              {visible
                .filter((l) => l.stage === stage)
                .map((l) => (
                  <button
                    className="lead-card"
                    key={l.id}
                    onClick={() => show(l)}
                  >
                    <div>
                      <span className="initial">
                        {l.customer?.name?.slice(0, 1) || "?"}
                      </span>
                      <strong>{l.customer?.name}</strong>
                    </div>
                    <p>{l.customer?.phone}</p>
                    <footer>
                      <span>{l.customer?.nationality || t("Unknown")}</span>
                      <span>{new Date(l.createdAt).toLocaleDateString()}</span>
                    </footer>
                  </button>
                ))}
              {!visible.some((l) => l.stage === stage) && (
                <p className="column-empty">{t("No leads here")}</p>
              )}
            </section>
          ))}
        </div>
      ) : (
        <div className="panel table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t("Customer")}</th>
                <th>{t("Phone")}</th>
                <th>{mode === "lost" ? t("Review") : "Sale"}</th>
                <th>{t("Created")}</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((l) => (
                <tr
                  key={l.id}
                  onClick={() => show(l)}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && show(l)}
                >
                  <td>
                    <strong>{l.customer?.name}</strong>
                  </td>
                  <td>{l.customer?.phone}</td>
                  <td>
                    <span className="badge">
                      {mode === "lost"
                        ? l.lostReview
                          ? "Needs review"
                          : "Confirmed"
                        : t("Won")}
                    </span>
                  </td>
                  <td>{new Date(l.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!visible.length && <Empty />}
        </div>
      )}
      {dialog === "create" && (
        <Modal title={t("New lead")} onClose={() => setDialog("")}>
          <Form
            fields={contactFields
              .map((f) =>
                f.name === "projectIds"
                  ? {
                      ...f,
                      label: t("Projects of interest"),
                      multiple: true,
                      options: projects.map((p) => ({
                        value: p.id,
                        label: p.translations?.en?.title || p.slug,
                      })),
                    }
                  : f,
              )
              .concat(
                user.role !== "AGENT"
                  ? [
                      {
                        name: "autoAssign",
                        label: t("Assignment"),
                        options: [
                          { value: "false", label: t("Assign manually") },
                          {
                            value: "true",
                            label: t("Distribute automatically within team"),
                          },
                        ],
                      },
                    ]
                  : [],
              )}
            onSubmit={async (v) => {
              await api("/leads", "POST", normalize(v));
              await changed();
            }}
            label={t("Create lead")}
          />
        </Modal>
      )}
      {dialog === "import" && (
        <Modal title="Import leads" onClose={() => setDialog("")}>
          <p>
            {t(
              "Use the fixed template. Preview validates every row before any lead is created.",
            )}
          </p>
          <button
            onClick={() =>
              download(
                "/leads/import/template",
                "aura-leads-template.xlsx",
              ).catch((e) => setError(e.message))
            }
          >
            {t("Download template")}
          </button>
          <input
            aria-label={t("Excel file")}
            type="file"
            accept=".xlsx"
            disabled={busy}
            onChange={async (e) => {
              if (!e.target.files?.[0]) return;
              setBusy(true);
              try {
                const bytes = await e.target.files[0].arrayBuffer();
                const f = {
                  file: btoa(
                    Array.from(new Uint8Array(bytes), (b) =>
                      String.fromCharCode(b),
                    ).join(""),
                  ),
                };
                setPreview(await api("/leads/import/preview", "POST", f));
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          />
          {preview && (
            <>
              <p>
                {t("Valid rows")}: {preview.valid} · {t("Skipped rows")}:{" "}
                {preview.skipped}
              </p>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>{t("Row")}</th>
                      <th>{t("Customer name")}</th>
                      <th>{t("Phone")}</th>
                      <th>{t("Status")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((row: any) => (
                      <tr key={row.row}>
                        <td>{row.row}</td>
                        <td>{row.name}</td>
                        <td dir="ltr">{row.phone}</td>
                        <td>
                          {row.valid ? t("Ready to import") : t(row.error)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {user.role !== "AGENT" && (
                <label>
                  <input
                    type="checkbox"
                    checked={autoImport}
                    onChange={(e) => setAutoImport(e.target.checked)}
                  />
                  {t("Distribute automatically within team")}
                </label>
              )}
              <button
                className="primary"
                onClick={async () => {
                  try {
                    await api("/leads/import/confirm", "POST", {
                      previewId: preview.id || preview.previewId,
                      autoAssign: autoImport,
                    });
                    setPreview(null);
                    await changed();
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                {t("Confirm valid rows")}
              </button>
            </>
          )}
        </Modal>
      )}
      {selected && (
        <Modal
          title={selected.customer?.name || "Lead details"}
          onClose={() => {
            setSelected(null);
            setDialog("");
          }}
        >
          <div className="lead-summary">
            <span className="badge">{title(selected.stage)}</span>
            <p>
              {selected.customer?.phone} ·{" "}
              {selected.customer?.email || "No email"}
            </p>
            <p>
              {selected.customer?.nationality} / {selected.customer?.language}
            </p>
          </div>
          <div className="action-grid">
            <button onClick={() => setDialog("edit")}>
              {t("Edit customer")}
            </button>
            <button
              onClick={() =>
                action("purchases", {}).catch((e) => setError(e.message))
              }
            >
              {t("New purchase")}
            </button>
            {selected.stage !== "WON" && selected.stage !== "LOST" && (
              <>
                <button onClick={() => setDialog("stage")}>
                  {t("Move stage")}
                </button>
                <button onClick={() => setDialog("call")}>
                  {t("Log call")}
                </button>
                <button onClick={() => setDialog("followup")}>
                  {t("Follow-up")}
                </button>
                <button onClick={() => setDialog("viewing")}>
                  {t("Schedule viewing")}
                </button>
                <button onClick={() => setDialog("reserve")}>
                  {t("Reserve apartment")}
                </button>
                <button onClick={() => setDialog("sale")}>
                  {t("Confirm Won sale")}
                </button>
              </>
            )}
            {(user.role === "SUPER_ADMIN" || user.role === "TEAM_LEAD") &&
              selected.stage !== "WON" && (
                <button onClick={() => setDialog("assign")}>
                  {t("Assign agent")}
                </button>
              )}
            {selected.stage === "LOST" && !selected.lostReview && (
              <button
                onClick={() =>
                  action("reopen", {}).catch((e) => setError(e.message))
                }
              >
                {t("Reopen to Contacted")}
              </button>
            )}
            {selected.stage === "LOST" &&
              selected.lostReview &&
              (user.role === "TEAM_LEAD" || user.role === "SUPER_ADMIN") && (
                <>
                  <button
                    onClick={() =>
                      action("review", { decision: "CONFIRM" }).catch((e) =>
                        setError(e.message),
                      )
                    }
                  >
                    {t("Confirm Lost")}
                  </button>
                  <button
                    onClick={() =>
                      action("review", { decision: "RETURN" }).catch((e) =>
                        setError(e.message),
                      )
                    }
                  >
                    {t("Return to agent")}
                  </button>
                </>
              )}
            {selected.stage === "LOST" && user.role === "SUPER_ADMIN" && (
              <button
                className="danger"
                onClick={async () => {
                  if (
                    !confirm(
                      "Permanently delete this Lost lead? There is no restore.",
                    )
                  )
                    return;
                  try {
                    await api(`/leads/${selected.id}`, "DELETE", {
                      confirmed: true,
                    });
                    setSelected(null);
                    await load();
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                {t("Delete permanently")}
              </button>
            )}
          </div>
          {dialog === "edit" && (
            <Form
              fields={contactFields.map((f) => ({
                ...f,
                ...(f.name === "projectIds"
                  ? {
                      label: t("Projects of interest"),
                      multiple: true,
                      options: projects.map((p) => ({
                        value: p.id,
                        label: p.translations?.en?.title || p.slug,
                      })),
                    }
                  : {}),
                value:
                  (selected.customer || {})[f.name] ??
                  (f.name === "projectIds"
                    ? selected.projectIds
                    : selected[f.name]) ??
                  f.value,
              }))}
              onSubmit={async (v) => {
                await api(`/leads/${selected.id}`, "PATCH", normalize(v));
                await changed();
              }}
            />
          )}
          {dialog === "stage" && (
            <Form
              fields={[
                {
                  name: "stage",
                  label: t("Destination"),
                  options: [...stages, "LOST"].map((s) => ({
                    value: s,
                    label: title(s),
                  })),
                  value: selected.stage,
                },
                {
                  name: "comment",
                  label: t("Explanation (required for Lost)"),
                  type: "textarea",
                },
              ]}
              onSubmit={(v) => action("stage", v)}
            />
          )}
          {dialog === "call" && (
            <Form
              fields={[
                {
                  name: "outcome",
                  label: t("Outcome"),
                  options: [
                    { value: "ANSWERED", label: t("Answered") },
                    { value: "NO_ANSWER", label: t("No answer") },
                  ],
                },
                {
                  name: "comment",
                  label: t("Call comment"),
                  required: true,
                  type: "textarea",
                },
              ]}
              onSubmit={(v) => action("calls", v)}
              label={t("Log call")}
            />
          )}
          {dialog === "followup" && (
            <Form
              fields={[
                {
                  name: "dueAt",
                  label: t("Reminder time"),
                  type: "datetime-local",
                  required: true,
                },
                {
                  name: "text",
                  label: t("What needs to happen?"),
                  type: "textarea",
                  required: true,
                },
              ]}
              onSubmit={(v) =>
                action("reminders", {
                  ...v,
                  dueAt: new Date(v.dueAt).toISOString(),
                })
              }
            />
          )}
          {dialog === "viewing" && (
            <Form
              fields={[
                {
                  name: "date",
                  label: t("Viewing time"),
                  type: "datetime-local",
                  required: true,
                },
                { name: "location", label: t("Location (optional)") },
              ]}
              onSubmit={(v) =>
                action("viewing", {
                  ...v,
                  date: new Date(v.date).toISOString(),
                })
              }
            />
          )}
          {dialog === "reserve" && (
            <Form
              fields={[
                {
                  name: "unitId",
                  label: t("Apartment"),
                  options: unitOptions,
                  required: true,
                },
              ]}
              onSubmit={(v) => action("reserve", v)}
            />
          )}
          {dialog === "assign" && (
            <Form
              fields={[
                {
                  name: "agentId",
                  label: t("Agent"),
                  options: [
                    { value: "", label: t("Automatic distribution") },
                    ...agents
                      .filter((a) => a.active && a.role === "AGENT")
                      .map((a) => ({ value: a.id, label: a.name })),
                  ],
                },
              ]}
              onSubmit={(v) =>
                action("assign", v.agentId ? v : { automatic: true })
              }
            />
          )}
          {dialog === "sale" && (
            <SaleForm
              unitOptions={unitOptions}
              onSubmit={(v) => action("sales", v)}
            />
          )}
          {dialog === "reverse" &&
            user.role === "SUPER_ADMIN" &&
            selectedSale && (
              <Form
                fields={[
                  {
                    name: "reason",
                    label: t("Detailed reversal reason"),
                    required: true,
                    type: "textarea",
                  },
                  {
                    name: "destination",
                    label: t("Destination"),
                    options: [...stages, "LOST"].map((s) => ({
                      value: s,
                      label: title(s),
                    })),
                  },
                  {
                    name: "unitStatus",
                    label: t("Apartment availability"),
                    options: [
                      { value: "AVAILABLE", label: t("Available") },
                      { value: "RESERVED", label: t("Reserved") },
                    ],
                  },
                ]}
                onSubmit={async (v) => {
                  if (v.reason.trim().length < 10)
                    throw new Error(t("Explain the reason in detail"));
                  await api(`/sales/${selectedSale.id}/reverse`, "POST", v);
                  await changed();
                }}
                label={t("Reverse sale")}
              />
            )}
          <LeadExtras selected={selected} user={user} onChange={changed} />
          <h3>{t("Timeline")}</h3>
          <Form
            fields={[
              {
                name: "text",
                label: t("Add comment"),
                type: "textarea",
                required: true,
              },
            ]}
            onSubmit={(v) => action("comments", v)}
            label={t("Add comment")}
          />
          <div className="timeline">
            {(selected.events || []).map((event: any) => (
              <article key={event.id}>
                <span className="timeline-dot" />
                <strong>{title(event.type || event.kind || "Update")}</strong>
                <small>
                  {event.actorName || t("System")} ·{" "}
                  {new Date(event.createdAt).toLocaleString()}
                </small>
                <p>
                  {event.text ||
                    event.comment ||
                    event.message ||
                    timelineText(event, agents, projects)}
                </p>
              </article>
            ))}
          </div>
          {selected.sales?.length > 0 && (
            <>
              <h3>{t("Apartment sales")}</h3>
              {selected.sales.map((s: any) => (
                <article className="sale-row" key={s.id}>
                  <strong>
                    {unitOptions.find((u) => u.value === s.unitId)?.label ||
                      `${t("Apartment")} #${units.find((u) => u.id === s.unitId)?.number || s.unitId}`}
                  </strong>
                  <Money value={s.gelTotal} />
                  {user.role === "SUPER_ADMIN" && (
                    <button
                      onClick={async () => {
                        setSelectedSale(s);
                        setDialog("reverse");
                      }}
                    >
                      {t("Reverse sale")}
                    </button>
                  )}
                </article>
              ))}
            </>
          )}
        </Modal>
      )}
    </>
  );
}
function SaleForm({
  onSubmit,
  unitOptions,
}: {
  onSubmit: (v: any) => Promise<void>;
  unitOptions: {
    value: string;
    label: string;
    price?: number;
    currency?: string;
  }[];
}) {
  const [selectedUnit, setSelectedUnit] = useState(""),
    [saleCurrency, setSaleCurrency] = useState("GEL");
  const chosenUnit = unitOptions.find((u) => u.value === selectedUnit);
  const [summary, setSummary] = useState<any>(null),
    [error, setError] = useState(""),
    [saving, setSaving] = useState(false);
  return summary ? (
    <div className="sale-confirm">
      <h3>{t("Confirm signed sale")}</h3>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <p>
        {t(
          "Won is final for agents and team leads. Verify these details carefully.",
        )}
      </p>
      <dl>
        {Object.entries(summary).map(([k, v]) => (
          <div key={k}>
            <dt>
              {t(
                (
                  {
                    unitId: "Apartment",
                    price: "Actual signed sale price",
                    currency: "Sale currency",
                    signedAt: "Contract signing date",
                    deposit: "First deposit received",
                    depositCurrency: "Deposit currency",
                    depositDate: "Deposit received date",
                  } as Record<string, string>
                )[k] || title(k),
              )}
            </dt>
            <dd>
              {k === "unitId"
                ? unitOptions.find((u) => u.value === v)?.label
                : String(v)}
            </dd>
          </div>
        ))}
      </dl>
      <button onClick={() => setSummary(null)}>{t("Edit details")}</button>
      <button
        className="primary"
        disabled={saving}
        onClick={async () => {
          setSaving(true);
          setError("");
          try {
            await onSubmit({
              ...summary,
              signedAt: new Date(
                summary.signedAt + "T12:00:00+04:00",
              ).toISOString(),
              depositDate: new Date(
                summary.depositDate + "T12:00:00+04:00",
              ).toISOString(),
              price: Number(summary.price),
              deposit: Number(summary.deposit),
              confirmed: true,
            });
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setSaving(false);
          }
        }}
      >
        {t("Confirm sale")}
      </button>
    </div>
  ) : (
    <Form
      fields={[
        {
          name: "unitId",
          label: t("Apartment"),
          options: unitOptions,
          required: true,
          onChange: setSelectedUnit,
        },
        {
          name: "price",
          label: t("Actual signed sale price"),
          type: "number",
          value: chosenUnit?.currency === saleCurrency ? chosenUnit.price : "",
          required: true,
        },
        { name: "currency", label: t("Sale currency"), options: currencies },
        {
          name: "signedAt",
          label: t("Contract signing date"),
          type: "date",
          required: true,
        },
        {
          name: "deposit",
          label: t("First deposit received"),
          type: "number",
          required: true,
        },
        {
          name: "depositCurrency",
          label: t("Deposit currency"),
          options: currencies,
        },
        {
          name: "depositDate",
          label: t("Deposit received date"),
          type: "date",
          required: true,
        },
      ]}
      onSubmit={async (v) => {
        if (Number(v.deposit) <= 0 || Number(v.price) <= 0)
          throw new Error("Sale price and received deposit must be positive");
        setSummary(v);
      }}
      label="Review sale details"
    >
      <p className="muted">
        {t(
          "Signed purchase and a received deposit are required. Documents remain optional.",
        )}
      </p>
    </Form>
  );
}

function LeadExtras({
  selected,
  user,
  onChange,
}: {
  selected: any;
  user: any;
  onChange: () => Promise<void>;
}) {
  const [docs, setDocs] = useState<any[]>([]),
    [error, setError] = useState("");
  useEffect(() => {
    api<any[]>(`/leads/${selected.id}/documents`)
      .then(setDocs)
      .catch((e) => setError(e.message));
  }, [selected.id]);
  const update = async (path: string, body: any, method = "PATCH") => {
    try {
      await api(path, method, body);
      await onChange();
    } catch (e) {
      setError((e as Error).message);
    }
  };
  return (
    <>
      <h3>{t("Follow-ups")}</h3>
      {(selected.reminders || [])
        .filter((r: any) => r.kind === "MANUAL" && r.state === "PENDING")
        .map((r: any) => (
          <div className="list-row" key={r.id}>
            <div>
              <strong>{r.text}</strong>
              <small>{new Date(r.dueAt).toLocaleString()}</small>
            </div>
            <button
              onClick={() =>
                update(`/reminders/${r.id}`, { state: "COMPLETED" })
              }
            >
              {t("Complete")}
            </button>
            <button
              onClick={() =>
                update(`/reminders/${r.id}`, { state: "CANCELLED" })
              }
            >
              {t("Cancel")}
            </button>
            <button
              onClick={() => {
                const date = prompt("New date/time, e.g. 2026-10-10T14:30");
                if (date && !Number.isNaN(Date.parse(date)))
                  update(`/reminders/${r.id}`, {
                    dueAt: new Date(date).toISOString(),
                  });
              }}
            >
              {t("Reschedule")}
            </button>
          </div>
        ))}
      {(selected.reservations || [])
        .filter((r: any) => !r.releasedAt)
        .map((r: any) => (
          <div className="list-row" key={r.id}>
            <div>
              <strong>
                {t("Reserved apartment")}
                {r.unitId}
              </strong>
              <small>
                {t("Review")}
                {new Date(r.nextReviewAt).toLocaleString()}
              </small>
            </div>
            <button
              onClick={() =>
                update(
                  `/reservations/${r.id}/review`,
                  { decision: "KEEP" },
                  "POST",
                )
              }
            >
              {t("Keep")}
            </button>
            <button
              onClick={() =>
                update(
                  `/reservations/${r.id}/review`,
                  { decision: "REMOVE" },
                  "POST",
                )
              }
            >
              {t("Remove")}
            </button>
          </div>
        ))}
      <h3>{t("Comments")}</h3>
      {(selected.comments || [])
        .filter((c: any) => !c.deleted)
        .map((c: any) => (
          <div className="list-row" key={c.id}>
            <div>
              <p>{c.text}</p>
              {c.versions?.length > 0 && (
                <details>
                  <summary>{t("Previous versions")}</summary>
                  {c.versions.map((v: any, i: number) => (
                    <p key={i}>
                      <small>{new Date(v.at).toLocaleString()}</small>
                      <br />
                      {v.text}
                    </p>
                  ))}
                </details>
              )}
            </div>
            {c.actorId === user.id && (
              <button
                onClick={() => {
                  const text = prompt("Edit comment", c.text);
                  if (text) update(`/comments/${c.id}`, { text });
                }}
              >
                {t("Edit own")}
              </button>
            )}
            {user.role === "SUPER_ADMIN" && (
              <button
                className="danger"
                onClick={() =>
                  confirm("Delete this comment? Audit history is retained.") &&
                  update(`/comments/${c.id}`, {}, "DELETE")
                }
              >
                {t("Delete")}
              </button>
            )}
          </div>
        ))}
      <h3>{t("Optional documents")}</h3>
      <UploadField
        name="agreement"
        purpose="AGREEMENT"
        leadId={selected.id}
        onUploaded={(v) => setDocs([...docs, v])}
      />
      {docs.map((d) => (
        <p key={d.id}>
          <a href={mediaUrl(d.url)} target="_blank" rel="noreferrer">
            {d.name}
          </a>
        </p>
      ))}
      {error && <p className="error">{error}</p>}
    </>
  );
}
