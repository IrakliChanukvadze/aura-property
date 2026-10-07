import { t } from "./i18n";
import { useEffect, useState } from "react";
import { api } from "./api";
import { Form, Modal, Empty, Money, languages, type Field } from "./ui";
export function Dashboard() {
  const [month, setMonth] = useState(
      new Date()
        .toLocaleDateString("en-CA", { timeZone: "Asia/Tbilisi" })
        .slice(0, 7),
    ),
    [data, setData] = useState<any>({}),
    [rank, setRank] = useState<any>({}),
    [commissions, setCommissions] = useState<any[]>([]),
    [staff, setStaff] = useState<any[]>([]),
    [period, setPeriod] = useState("monthly"),
    [error, setError] = useState("");
  useEffect(() => {
    Promise.all([
      api(`/dashboard?month=${month}`),
      api(`/leaderboards?month=${month}&period=${period}`),
      api(`/commissions?month=${month}`),
      api("/users"),
    ])
      .then(([d, r, earnings, people]) => {
        setData(d);
        setRank(r);
        setCommissions(earnings);
        setStaff(people);
      })
      .catch((e) => setError(e.message));
  }, [month, period]);
  const metrics = {
    ...data.counts,
    ...data.metrics,
    earnings: data.earnings,
    leadsReceived: data.counts?.received,
    salesCount: data.counts?.sold,
  };
  return (
    <>
      <div className="section-toolbar">
        <p className="muted">{t("A clear picture of the month.")}</p>
        <select
          aria-label={t("Leaderboard period")}
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
        >
          <option value="monthly">{t("Monthly leaderboard")}</option>
          <option value="yearly">{t("Yearly individuals")}</option>
        </select>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        />
      </div>
      {error && <p className="error">{error}</p>}
      <div className="metrics">
        {[
          [
            t("Leads received"),
            metrics.leadsReceived || 0,
            t("Selected month"),
          ],
          [
            t("Apartments sold"),
            metrics.salesCount || metrics.sold || 0,
            t("Selected month"),
          ],
          [
            t("Earnings"),
            metrics.earningsGel || metrics.earnings || 0,
            t("GEL · selected month"),
          ],
          [
            t("Active leads"),
            metrics.active || metrics.activeCount || 0,
            t("Current total"),
          ],
        ].map(([label, value, note]) => (
          <article className="metric" key={label}>
            <p>{label}</p>
            <strong>{Number(value).toLocaleString()}</strong>
            <small>{note}</small>
          </article>
        ))}
      </div>
      <div className="dashboard-grid">
        <section className="panel">
          <h2>{t("Team leaderboard")}</h2>
          <p className="muted">{t("Sold apartments · shared ranking")}</p>
          <Ranking rows={data.leaderboards?.teams || rank.teams || []} />
        </section>
        <section className="panel">
          <h2>
            {period === "yearly"
              ? t("Yearly individual ranking")
              : t("Individual leaderboard")}
          </h2>
          <p className="muted">
            {period === "yearly" ? t("Calendar year") : t("This month")}
          </p>
          <Ranking rows={rank.agents || rank.individuals || []} />
        </section>
        <section className="panel">
          <h2>{t("Latest Won")}</h2>
          {(data.latestWon || []).slice(0, 3).map((l: any) => (
            <div className="list-row" key={l.id}>
              <span className="avatar">✓</span>
              <div>
                <strong>
                  {l.customerName ||
                    l.customer?.name ||
                    l.lead?.customer?.name ||
                    l.name}
                </strong>
                <small>
                  {l.unitNumber
                    ? `${t("Apartment")} #${l.unitNumber}`
                    : t("Signed sale")}
                </small>
              </div>
              <span className="badge">{t("Won")}</span>
            </div>
          ))}
          {!data.latestWon?.length && (
            <Empty text={t("Your latest signed sales will appear here")} />
          )}
        </section>
        <section className="panel">
          <h2>{t("Commission earnings")}</h2>
          {commissions.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{t("Contract signing date")}</th>
                    <th>{t("Agent")}</th>
                    <th>{t("Earnings")}</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.map((s) => (
                    <tr key={s.id}>
                      <td>
                        {new Date(s.signedAt).toLocaleDateString(undefined, {
                          timeZone: "Asia/Tbilisi",
                        })}
                      </td>
                      <td>
                        {staff.find((u) => u.id === s.agentId)?.name ||
                          t("Your earnings")}
                      </td>
                      <td>
                        {s.amount !== undefined ? (
                          <Money value={s.amount} />
                        ) : (
                          <div>
                            {t("Agent")}: <Money value={s.agentAmount} />
                            <br />
                            {t("Team lead")}: <Money value={s.leadAmount} />
                            {Number(s.actingAmount) > 0 && (
                              <>
                                <br />
                                {t("Acting lead")}:{" "}
                                <Money value={s.actingAmount} />
                              </>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty />
          )}
        </section>
        <section className="panel">
          <h2>{t("Current workload")}</h2>
          {[
            [t("New"), metrics.new || metrics.newCount || 0],
            [t("Active"), metrics.active || metrics.activeCount || 0],
            [t("Lost"), metrics.lost || metrics.lostCount || 0],
          ].map(([label, value]) => (
            <div className="list-row" key={label}>
              <strong>{label}</strong>
              <span>{value}</span>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
function Ranking({ rows }: { rows: any[] }) {
  return rows.length ? (
    <ol className="ranking">
      {rows.map((r, i) => (
        <li key={r.id || i}>
          <span className="rank">{r.rank || i + 1}</span>
          <div>
            <strong>{r.name}</strong>
            <small>
              {r.salesCount ?? r.count ?? 0}
              {t("apartments sold")}
            </small>
          </div>
        </li>
      ))}
    </ol>
  ) : (
    <Empty text={t("Rankings begin with the first sale")} />
  );
}
export function Calendar() {
  const [items, setItems] = useState<any[]>([]),
    [month, setMonth] = useState(new Date().toISOString().slice(0, 7)),
    [error, setError] = useState("");
  useEffect(() => {
    api<any[]>(`/calendar?month=${month}`)
      .then(setItems)
      .catch((e) => setError(e.message));
  }, [month]);
  return (
    <>
      <div className="section-toolbar">
        <p className="muted">{t("Viewings, follow-ups and approved leave.")}</p>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        />
      </div>
      {error && <p className="error">{error}</p>}
      <div className="panel">
        {items.length ? (
          items.map((x: any) => (
            <article className="list-row" key={x.id}>
              <span className="calendar-day">
                {new Date(x.startsAt || x.date || x.dueAt || x.start).getDate()}
              </span>
              <div>
                <strong>{x.title || x.text || x.type}</strong>
                <small>
                  {new Date(
                    x.startsAt || x.date || x.dueAt || x.start,
                  ).toLocaleString()}{" "}
                  · {x.location || x.user?.name || ""}
                </small>
              </div>
              <span className="badge">{x.type}</span>
            </article>
          ))
        ) : (
          <Empty text={t("Nothing scheduled in this month")} />
        )}
      </div>
    </>
  );
}
export function Personnel({ user }: { user: any }) {
  const [users, setUsers] = useState<any[]>([]),
    [leave, setLeave] = useState<any[]>([]),
    [teams, setTeams] = useState<any[]>([]),
    [schedules, setSchedules] = useState<any[]>([]),
    [balance, setBalance] = useState<any>({}),
    [activeLeads, setActiveLeads] = useState<any[]>([]),
    [error, setError] = useState(""),
    [dialog, setDialog] = useState(""),
    [selected, setSelected] = useState<any>(null);
  const manager =
    user.role === "SUPER_ADMIN" || user.role === "TEAM_LEAD" || user.actingLead;
  const canReviewLeave = (request: any) => {
    if (request.userId === user.id) return false;
    if (user.role === "SUPER_ADMIN") return true;
    const target = request.user || users.find((u) => u.id === request.userId);
    return Boolean(
      manager &&
      target &&
      user.teamId &&
      request.teamId === user.teamId &&
      target?.role !== "TEAM_LEAD" &&
      target?.role !== "SUPER_ADMIN",
    );
  };
  const load = () =>
    Promise.all([
      api<any[]>("/users"),
      api<any[]>("/leave"),
      api<any[]>("/teams"),
      api<any[]>("/schedules"),
      api("/leave/balance"),
      api<any[]>("/leads?scope=active"),
    ])
      .then(([u, l, t, s, b, a]) => {
        setUsers(u);
        setLeave(l);
        setTeams(t);
        setSchedules(s);
        setBalance(b);
        setActiveLeads(a);
      })
      .catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);
  const close = async () => {
    setDialog("");
    await load();
  };
  return (
    <>
      <div className="section-toolbar">
        <p className="muted">{t("People, schedules and time away.")}</p>
        <div>
          <button onClick={() => setDialog("leave")}>
            {t("Request vacation")}
          </button>
          {manager && (
            <button onClick={() => setDialog("user")}>
              {t("Invite teammate")}
            </button>
          )}
          {user.role === "SUPER_ADMIN" && (
            <button
              onClick={() => {
                setSelected(null);
                setDialog("team");
              }}
            >
              {t("Create team")}
            </button>
          )}
        </div>
      </div>
      {error && <p className="error">{error}</p>}
      {user.role === "SUPER_ADMIN" && (
        <section className="panel">
          <h2>{t("Teams")}</h2>
          {teams.map((team) => (
            <div className="list-row" key={team.id}>
              <div>
                <strong>{team.name}</strong>
                <small className="block">
                  {users.find((u) => u.id === team.leadId)?.name ||
                    t("No team lead yet")}
                </small>
              </div>
              <button
                onClick={() => {
                  setSelected(team);
                  setDialog("team");
                }}
              >
                {t("Edit")}
              </button>
            </div>
          ))}
        </section>
      )}
      <div className="panel table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t("Name")}</th>
              <th>{t("Role")}</th>
              <th>{t("Team")}</th>
              <th>{t("Status")}</th>
              <th>{t("Actions")}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  <strong>{u.name}</strong>
                  <small className="block">{u.email}</small>
                </td>
                <td>{u.role}</td>
                <td>{teams.find((t) => t.id === u.teamId)?.name || "—"}</td>
                <td>{u.active ? t("Active") : "Deactivated"}</td>
                <td>
                  {manager && (
                    <button
                      onClick={() => {
                        setSelected(u);
                        setDialog("schedule");
                      }}
                    >
                      {t("Schedule")}
                    </button>
                  )}
                  {user.role === "SUPER_ADMIN" && (
                    <button
                      onClick={() => {
                        setSelected(u);
                        setDialog("permissions");
                      }}
                    >
                      {t("Manage")}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <section className="panel">
        <h2>{t("Vacation requests")}</h2>
        <p>
          {t("Your balance:")}
          <strong>
            {balance.balance ?? "—"}
            {t("days")}
          </strong>
        </p>
        {user.role === "SUPER_ADMIN" &&
          schedules
            .filter((s) => !s.approved)
            .map((s) => (
              <div className="list-row" key={s.id}>
                <span>
                  {t("Schedule awaiting approval:")}{" "}
                  {users.find((u) => u.id === s.userId)?.name}
                </span>
                <button
                  onClick={async () => {
                    try {
                      await api(`/schedules/${s.id}/approve`, "POST", {});
                      await load();
                    } catch (e) {
                      setError((e as Error).message);
                    }
                  }}
                >
                  {t("Approve schedule")}
                </button>
              </div>
            ))}
        <p className="muted">
          {t(
            "2 days earned per completed employment month. Unused balance carries forever; approved minimum −2 days.",
          )}
        </p>
        {leave.map((l) => (
          <article className="list-row" key={l.id}>
            <div>
              <strong>
                {l.user?.name ||
                  users.find((u) => u.id === l.userId)?.name ||
                  "Vacation"}
              </strong>
              <small>
                {String(l.startsAt || l.start || l.startDate).slice(0, 10)} —{" "}
                {String(l.endsAt || l.end || l.endDate).slice(0, 10)} ·{" "}
                {l.status}
              </small>
            </div>
            {canReviewLeave(l) && l.status === "PENDING" && (
              <div>
                <button
                  onClick={() => {
                    setSelected(l);
                    setDialog("approve");
                  }}
                >
                  {t("Review")}
                </button>
              </div>
            )}
            {canReviewLeave(l) && l.cancellationRequested && (
              <div>
                <button
                  onClick={async () => {
                    try {
                      await api(`/leave/${l.id}/cancel-review`, "POST", {
                        approve: true,
                      });
                      await load();
                    } catch (e) {
                      setError((e as Error).message);
                    }
                  }}
                >
                  {t("Approve cancellation / early return")}
                </button>
                <button
                  onClick={async () => {
                    try {
                      await api(`/leave/${l.id}/cancel-review`, "POST", {
                        approve: false,
                      });
                      await load();
                    } catch (e) {
                      setError((e as Error).message);
                    }
                  }}
                >
                  {t("Reject cancellation")}
                </button>
              </div>
            )}
            {l.userId === user.id && (
              <button
                onClick={async () => {
                  try {
                    const returnDate =
                      l.status === "APPROVED" &&
                      new Date(l.startsAt) <= new Date()
                        ? prompt("First return date (YYYY-MM-DD)")
                        : null;
                    await api(
                      `/leave/${l.id}/cancel`,
                      "POST",
                      returnDate
                        ? {
                            returnAt: new Date(
                              returnDate + "T00:00:00+04:00",
                            ).toISOString(),
                          }
                        : {},
                    );
                    await load();
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                {l.status === "PENDING" ? "Withdraw" : "Request cancellation"}
              </button>
            )}
          </article>
        ))}
        {!leave.length && <Empty />}
      </section>
      {dialog && (
        <Modal
          title={
            dialog === "user"
              ? t("Invite teammate")
              : dialog === "schedule"
                ? "Recurring weekly schedule"
                : dialog === "permissions"
                  ? "User settings"
                  : dialog === "approve"
                    ? "Approve vacation"
                    : dialog === "team"
                      ? t("Create team")
                      : t("Request vacation")
          }
          onClose={() => setDialog("")}
        >
          {dialog === "user" && (
            <Form
              fields={[
                { name: "name", label: t("Name"), required: true },
                {
                  name: "email",
                  label: t("Invitation email"),
                  type: "email",
                  required: true,
                },
                {
                  name: "role",
                  label: t("Role"),
                  options: (user.role === "SUPER_ADMIN"
                    ? ["AGENT", "TEAM_LEAD", "EDITOR"]
                    : ["AGENT"]
                  ).map((r) => ({ value: r, label: r })),
                },
                {
                  name: "teamId",
                  label: t("Team"),
                  options: [
                    { value: "", label: t("Select team") },
                    ...teams.map((t) => ({ value: t.id, label: t.name })),
                  ],
                },
                { name: "locale", label: t("Language"), options: languages },
              ]}
              onSubmit={async (v) => {
                await api("/users", "POST", {
                  ...v,
                  ...(v.teamId ? {} : { teamId: undefined }),
                });
                await close();
              }}
              label={t("Send invitation")}
            />
          )}
          {dialog === "team" && (
            <Form
              fields={[
                {
                  name: "name",
                  label: t("Team name"),
                  required: true,
                  value: selected?.name,
                },
                {
                  name: "leadId",
                  label: t("Permanent team lead"),
                  value: selected?.leadId || "",
                  options: [
                    { value: "", label: t("No team lead yet") },
                    ...users
                      .filter(
                        (u) =>
                          u.role === "TEAM_LEAD" &&
                          u.active &&
                          (!u.teamId || u.id === selected?.leadId),
                      )
                      .map((u) => ({ value: u.id, label: u.name })),
                  ],
                },
              ]}
              onSubmit={async (v) => {
                await api(
                  selected?.id ? `/teams/${selected.id}` : "/teams",
                  selected?.id ? "PATCH" : "POST",
                  { ...v, leadId: v.leadId || null },
                );
                await close();
              }}
            />
          )}
          {dialog === "leave" && (
            <Form
              fields={[
                {
                  name: "start",
                  label: t("First day away"),
                  type: "date",
                  required: true,
                },
                {
                  name: "end",
                  label: t("First return day"),
                  type: "date",
                  required: true,
                },
                { name: "comment", label: t("Note"), type: "textarea" },
                {
                  name: "coverAgentId",
                  label: t("Acting lead nominee (team leads only)"),
                  options: [
                    { value: "", label: t("None") },
                    ...users
                      .filter((u) => u.role === "AGENT")
                      .map((u) => ({ value: u.id, label: u.name })),
                  ],
                },
              ]}
              onSubmit={async (v) => {
                await api("/leave", "POST", {
                  startsAt: new Date(v.start + "T00:00:00+04:00").toISOString(),
                  endsAt: new Date(v.end + "T00:00:00+04:00").toISOString(),
                  ...(v.coverAgentId ? { actingUserId: v.coverAgentId } : {}),
                });
                await close();
              }}
            />
          )}
          {dialog === "approve" && selected && canReviewLeave(selected) && (
            <Form
              fields={[
                {
                  name: "decision",
                  label: t("Decision"),
                  options: [
                    { value: "APPROVE", label: t("Approve") },
                    { value: "REJECT", label: t("Reject") },
                  ],
                },
                {
                  name: "reassign",
                  label: t(
                    "Optional active-lead reassignment at vacation start",
                  ),
                  options: [
                    { value: "none", label: t("Keep assignments") },
                    { value: "auto", label: t("Automatically redistribute") },
                  ],
                },
                {
                  name: "comment",
                  label: t("Review comment"),
                  type: "textarea",
                },
              ]}
              onSubmit={async (v) => {
                const pending =
                  v.reassign === "auto"
                    ? await api<any[]>("/leads?scope=active")
                    : [];
                await api(`/leave/${selected.id}/approve`, "POST", {
                  decision: v.decision,
                  reassign: pending
                    .filter((l) => l.agentId === selected.userId)
                    .map((l) => ({ leadId: l.id, automatic: true })),
                });
                await close();
              }}
            />
          )}
          {dialog === "schedule" && (
            <Form
              fields={[
                {
                  name: "workingDays",
                  label: t(
                    "Working days (0 Sunday — 6 Saturday), exactly five",
                  ),
                  value: "1,2,3,4,5",
                  required: true,
                },
                {
                  name: "reapprove",
                  label: t("Review affected approved vacations"),
                  options: [
                    {
                      value: "no",
                      label: t("Keep approved vacation deductions unchanged"),
                    },
                    {
                      value: "yes",
                      label: t(
                        "Confirm recalculation of affected approved vacations",
                      ),
                    },
                  ],
                },
                {
                  name: "exceptions",
                  label: t('Dated exceptions JSON, e.g. {"2026-10-10":false}'),
                  value: "{}",
                  type: "textarea",
                },
              ]}
              onSubmit={async (v) => {
                const days = v.workingDays.split(",").map(Number);
                if (
                  new Set(days).size !== 5 ||
                  days.some((d: number) => d < 0 || d > 6)
                )
                  throw new Error("Choose five distinct weekdays");
                await api("/schedules", "POST", {
                  userId: selected.id,
                  weekdays: days,
                  exceptions: JSON.parse(v.exceptions || "{}"),
                  reviewLeaveIds:
                    v.reapprove === "yes"
                      ? leave
                          .filter(
                            (l) =>
                              l.userId === selected.id &&
                              l.status === "APPROVED",
                          )
                          .map((l) => l.id)
                      : [],
                });
                await close();
              }}
            />
          )}
          {dialog === "permissions" && (
            <Form
              fields={[
                {
                  name: "active",
                  label: t("Account access"),
                  value: String(selected.active),
                  options: [
                    { value: "true", label: t("Active") },
                    {
                      value: "false",
                      label: t("Deactivated — sessions blocked"),
                    },
                  ],
                },
                {
                  name: "redistribution",
                  label: t("Active lead redistribution on deactivation"),
                  options: [
                    { value: "TEAM_LEAD", label: t("Team-lead inbox") },
                    { value: "AUTOMATIC", label: t("Automatic distribution") },
                  ],
                },
                {
                  name: "contentEdit",
                  label: t("Personal content-editing permission"),
                  value: String(selected.contentEdit),
                  options: [
                    { value: "false", label: t("No content permission") },
                    { value: "true", label: t("Can edit and publish content") },
                  ],
                },
                {
                  name: "teamId",
                  label: t("Team"),
                  value: selected.teamId,
                  options: [
                    { value: "", label: t("No team") },
                    ...teams.map((t) => ({ value: t.id, label: t.name })),
                  ],
                },
                {
                  name: "publicProfile",
                  label: t("Show on agency team page"),
                  value: String(selected.publicProfile || false),
                  options: [
                    { value: "false", label: t("Private") },
                    { value: "true", label: t("Public") },
                  ],
                },
                {
                  name: "publicPhone",
                  label: t("Public phone"),
                  value: selected.publicData?.phone || "",
                },
                {
                  name: "publicWhatsapp",
                  label: "WhatsApp",
                  value: selected.publicData?.whatsapp || "",
                },
                {
                  name: "publicPhoto",
                  label: t("Profile photo"),
                  type: "upload",
                  purpose: "PROFILE",
                  value: selected.publicData?.photo || "",
                },
                {
                  name: "publicTitle",
                  label: t("Public profile title"),
                  value: selected.publicData?.title || "",
                },
                {
                  name: "moveLeadIds",
                  label: t("Active leads to transfer"),
                  multiple: true,
                  options: activeLeads
                    .filter((l) => l.agentId === selected.id)
                    .map((l) => ({
                      value: l.id,
                      label: l.customer?.name || l.id,
                    })),
                  value: [],
                },
                {
                  name: "agentRate",
                  label: t("Agent commission %"),
                  type: "number",
                  value: selected.agentRate ?? 1,
                },
                {
                  name: "leadRate",
                  label: t("Team-lead commission %"),
                  type: "number",
                  value: selected.leadRate ?? 0.5,
                },
              ]}
              onSubmit={async (v) => {
                const {
                  publicPhone,
                  publicWhatsapp,
                  publicPhoto,
                  publicTitle,
                  moveLeadIds,
                  ...settings
                } = v;
                const payload: any = {
                  ...settings,
                  teamId: v.teamId || null,
                  publicProfile: v.publicProfile === "true",
                  publicData: {
                    phone: publicPhone,
                    whatsapp: publicWhatsapp,
                    photo: publicPhoto,
                    title: publicTitle,
                  },
                  moveLeadIds: moveLeadIds || [],
                  active: v.active === "true",
                  contentEdit: v.contentEdit === "true",
                  agentRate: Number(v.agentRate),
                  leadRate: Number(v.leadRate),
                };
                if (selected.role === "SUPER_ADMIN")
                  for (const key of [
                    "role",
                    "active",
                    "teamId",
                    "agentRate",
                    "leadRate",
                    "moveLeadIds",
                    "redistribution",
                  ])
                    delete payload[key];
                await api(`/users/${selected.id}`, "PATCH", payload);

                await close();
              }}
            />
          )}
        </Modal>
      )}
    </>
  );
}
export function Settings({
  user,
  refresh,
}: {
  user: any;
  refresh: () => void;
}) {
  const [message, setMessage] = useState("");
  const [defaults, setDefaults] = useState<any>(null);
  useEffect(() => {
    if (user.role === "SUPER_ADMIN")
      api("/settings")
        .then(setDefaults)
        .catch((e) => setMessage(e.message));
  }, [user.role]);
  return (
    <div className="settings-grid">
      <section className="panel">
        <h2>{t("Personal preferences")}</h2>
        <Form
          fields={[
            {
              name: "locale",
              label: t("Admin language"),
              options: languages,
              value: user.locale,
            },
          ]}
          onSubmit={async (v) => {
            await api(`/users/${user.id}`, "PATCH", v);
            localStorage.setItem("aura-admin-locale", v.locale);
            refresh();
            setMessage("Preferences saved");
          }}
        />
      </section>
      <section className="panel">
        <h2>{t("Change your password")}</h2>
        <p className="muted">{t("Only you manage your password.")}</p>
        <Form
          fields={[
            {
              name: "currentPassword",
              label: t("Current password"),
              type: "password",
              required: true,
            },
            {
              name: "newPassword",
              label: t("New password"),
              type: "password",
              required: true,
            },
          ]}
          onSubmit={async (v) => {
            await api("/auth/password", "POST", v);
            setMessage("Password changed");
          }}
        />
      </section>
      {user.role === "SUPER_ADMIN" && defaults && (
        <section className="panel">
          <h2>{t("Default commission rates")}</h2>
          <p className="muted">
            {t(
              "Defaults apply to new staff and new acting assignments. Historical earnings stay unchanged.",
            )}
          </p>
          <Form
            fields={[
              {
                name: "defaultAgentRate",
                label: t("Default agent percentage"),
                type: "number",
                required: true,
                value: Number(defaults.defaultAgentRate),
              },
              {
                name: "defaultLeadRate",
                label: t("Default team lead percentage"),
                type: "number",
                required: true,
                value: Number(defaults.defaultLeadRate),
              },
            ]}
            onSubmit={async (values) => {
              const updated = await api("/settings", "PATCH", {
                defaultAgentRate: Number(values.defaultAgentRate),
                defaultLeadRate: Number(values.defaultLeadRate),
              });
              setDefaults(updated);
              setMessage(t("Preferences saved"));
            }}
          />
        </section>
      )}
      {user.role === "SUPER_ADMIN" && (
        <section className="panel">
          <h2>{t("USD to GEL exchange rate")}</h2>
          <p className="muted">
            {t(
              "Record a verified rate for the signing date. Saved sales keep their original conversion.",
            )}
          </p>
          <Form
            fields={[
              {
                name: "date",
                label: t("Rate date"),
                type: "date",
                required: true,
              },
              {
                name: "usdGel",
                label: t("GEL per USD"),
                type: "number",
                required: true,
              },
              { name: "source", label: t("Rate source"), required: true },
            ]}
            onSubmit={async (values) => {
              await api("/fx", "POST", {
                ...values,
                usdGel: Number(values.usdGel),
              });
              setMessage(t("Preferences saved"));
            }}
          />
        </section>
      )}
      {message && <p role="status">{message}</p>}
    </div>
  );
}
