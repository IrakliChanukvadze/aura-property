import { t } from "./i18n";
import { useCallback, useEffect, useState } from "react";
import { api } from "./api";
import { Form, Modal, languages } from "./ui";
import { Leads } from "./Leads";
import { Dashboard, Personnel, Calendar, Settings } from "./Workspace";
import { SiteContent } from "./SiteContent";
import { Content } from "./Content";
const nav = {
  en: [
    "Overview",
    "Active leads",
    "Lost leads",
    "Won sales",
    "Calendar",
    "People & leave",
    "Projects",
    "Journal",
    "Settings",
  ],
  ka: [
    "მიმოხილვა",
    "აქტიური ლიდები",
    "დაკარგული ლიდები",
    "გაყიდვები",
    "კალენდარი",
    "გუნდი და შვებულება",
    "პროექტები",
    "ჟურნალი",
    "პარამეტრები",
  ],
  ru: [
    "Обзор",
    "Активные лиды",
    "Потерянные лиды",
    "Продажи",
    "Календарь",
    "Команда и отпуск",
    "Проекты",
    "Журнал",
    "Настройки",
  ],
  he: [
    "סקירה",
    "לידים פעילים",
    "לידים אבודים",
    "מכירות",
    "לוח שנה",
    "צוות וחופשות",
    "פרויקטים",
    "יומן",
    "הגדרות",
  ],
};
export default function App() {
  const [user, setUser] = useState<any>(null),
    [loading, setLoading] = useState(true),
    [page, setPage] = useState(0),
    [locale, setLocale] = useState<keyof typeof nav>(
      (localStorage.getItem("aura-admin-locale") || "en") as any,
    ),
    [theme, setTheme] = useState(
      localStorage.getItem("aura-admin-theme") || "light",
    ),
    [notes, setNotes] = useState<any[]>([]),
    [notifications, setNotifications] = useState(false),
    [menu, setMenu] = useState(false),
    [error, setError] = useState(""),
    [recovery, setRecovery] = useState(false),
    [authMessage, setAuthMessage] = useState("");
  const refresh = useCallback(
    () =>
      api("/auth/me")
        .then(setUser)
        .catch(() => setUser(null))
        .finally(() => setLoading(false)),
    [],
  );
  useEffect(() => {
    refresh();
  }, [refresh]);
  useEffect(() => {
    if (user?.role === "EDITOR") setPage(user.contentEdit ? 6 : 8);
  }, [user?.role]);
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "he" ? "rtl" : "ltr";
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("aura-admin-locale", locale);
    localStorage.setItem("aura-admin-theme", theme);
  }, [locale, theme]);
  useEffect(() => {
    if (!user) return;
    const load = () =>
      api<any[]>("/notifications")
        .then(setNotes)
        .catch(() => {});
    load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, [user]);
  const token = new URLSearchParams(location.search).get("token");
  if (loading)
    return (
      <div className="loading">
        AURA <span>{t("Opening workspace…")}</span>
      </div>
    );
  if (!user)
    return (
      <main className="auth">
        <div className="auth-brand">
          <p className="eyebrow">AURA PROPERTY</p>
          <h1>
            {t("A place for")}
            <br />
            {t("your next chapter.")}
          </h1>
          <p>{t("Your private team workspace.")}</p>
        </div>
        <section>
          <p className="eyebrow">{t("TEAM ACCESS")}</p>
          <h2>
            {token
              ? t("Set your password")
              : recovery
                ? t("Recover access")
                : t("Welcome back")}
          </h2>
          {authMessage && <p role="status">{authMessage}</p>}
          <Form
            fields={
              recovery
                ? [
                    {
                      name: "email",
                      label: t("Your email"),
                      type: "email",
                      required: true,
                    },
                  ]
                : token
                  ? [
                      {
                        name: "password",
                        label: t("New password"),
                        type: "password",
                        required: true,
                      },
                      {
                        name: "locale",
                        label: t("Admin language"),
                        options: languages,
                        value: locale,
                      },
                    ]
                  : [
                      {
                        name: "email",
                        label: t("Email"),
                        type: "email",
                        required: true,
                      },
                      {
                        name: "password",
                        label: t("Password"),
                        type: "password",
                        required: true,
                      },
                    ]
            }
            onSubmit={async (v) => {
              if (recovery) {
                await api("/auth/recover", "POST", v);
                setAuthMessage(
                  "If the account is eligible, recovery instructions have been sent.",
                );
                return;
              }
              await api(
                token ? "/auth/accept-invitation" : "/auth/login",
                "POST",
                token ? { token, password: v.password, locale: v.locale } : v,
              );
              if (token) {
                history.replaceState(null, "", location.pathname);
                setAuthMessage("Password set. Sign in with your account.");
              }
              await refresh();
            }}
            label={
              token
                ? t("Activate account")
                : recovery
                  ? t("Send recovery instructions")
                  : t("Sign in")
            }
          />
          {!token && (
            <button
              onClick={() => {
                setRecovery(!recovery);
                setAuthMessage("");
              }}
            >
              {recovery ? t("Back to sign in") : t("Forgot password?")}
            </button>
          )}
          <p className="muted">
            {t(
              "Access is invitation-only. Contact your team lead for an account.",
            )}
          </p>
        </section>
      </main>
    );
  const content = user.role === "SUPER_ADMIN" || user.contentEdit;
  return (
    <div className="workspace">
      <aside className={menu ? "open" : ""}>
        <a className="brand" href="#">
          AURA<span>{t("PROPERTY / WORKSPACE")}</span>
        </a>
        <nav>
          {nav[locale].map(
            (title, i) =>
              (i === 6 || i === 7
                ? content
                : user.role === "EDITOR"
                  ? i === 4 || i === 5 || i === 8
                  : true) && (
                <button
                  key={i}
                  className={page === i ? "selected" : ""}
                  onClick={() => {
                    setPage(i);
                    setMenu(false);
                  }}
                >
                  <span>
                    {["◈", "▤", "◌", "✓", "▦", "♧", "▱", "✎", "⚙"][i]}
                  </span>
                  {title}
                </button>
              ),
          )}
          {content && (
            <button
              className={page === 9 ? "selected" : ""}
              onClick={() => {
                setPage(9);
                setMenu(false);
              }}
            >
              <span>◇</span>
              {t("Website")}
            </button>
          )}
        </nav>
        <div className="side-bottom">
          <span className="avatar">{user.name?.slice(0, 1)}</span>
          <div>
            {user.name}
            <small>{user.role?.replaceAll("_", " ")}</small>
          </div>
          <button
            aria-label={t("Sign out")}
            onClick={async () => {
              await api("/auth/logout", "POST");
              setUser(null);
            }}
          >
            ↗
          </button>
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <button
            className="mobile icon"
            onClick={() => setMenu(!menu)}
            aria-label={t("Open navigation")}
          >
            ☰
          </button>
          <span className="muted">{t("Your team, in focus.")}</span>
          <div className="tools">
            <select
              aria-label={t("Admin language")}
              value={locale}
              onChange={(e) => {
                localStorage.setItem("aura-admin-locale", e.target.value);
                setLocale(e.target.value as any);
                api(`/users/${user.id}`, "PATCH", {
                  locale: e.target.value,
                }).catch(() => {});
              }}
            >
              {languages.map((l) => (
                <option value={l.value} key={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
            <button
              className="icon"
              aria-label={t("Toggle theme")}
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            >
              {theme === "light" ? "☾" : "☀"}
            </button>
            <button
              className="notification-button"
              onClick={() => setNotifications(true)}
            >
              ♧ <span>{notes.filter((n) => !n.readAt).length}</span>
            </button>
          </div>
        </header>
        <div className="page">
          <p className="eyebrow">{t("AURA WORKSPACE")}</p>
          <h1>{page === 9 ? t("Website") : nav[locale][page]}</h1>
          {error && <p className="error">{error}</p>}
          {page === 9 ? (
            <SiteContent />
          ) : page === 0 ? (
            <Dashboard />
          ) : page <= 3 ? (
            <Leads
              mode={page === 1 ? "active" : page === 2 ? "lost" : "won"}
              user={user}
            />
          ) : page === 4 ? (
            <Calendar />
          ) : page === 5 ? (
            <Personnel user={user} />
          ) : page === 6 || page === 7 ? (
            <Content kind={page === 6 ? "projects" : "blogs"} user={user} />
          ) : (
            <Settings user={user} refresh={refresh} />
          )}
        </div>
      </div>
      {notifications && (
        <Modal
          title={t("Notifications")}
          onClose={() => setNotifications(false)}
        >
          <p className="muted">
            {t("Reminders are kept here while you’re offline.")}
          </p>
          {notes.length ? (
            notes.map((n) => (
              <button
                className={"note " + (!n.readAt ? "unread" : "")}
                key={n.id}
                onClick={async () => {
                  try {
                    await api(`/notifications/${n.id}`, "PATCH");
                    setNotes(
                      notes.map((x) =>
                        x.id === n.id
                          ? { ...x, readAt: new Date().toISOString() }
                          : x,
                      ),
                    );
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                <strong>{n.title || n.kind || n.type}</strong>
                <p>{n.message || n.text || n.body}</p>
                <small>{new Date(n.createdAt).toLocaleString()}</small>
              </button>
            ))
          ) : (
            <p>{t("No notifications.")}</p>
          )}
        </Modal>
      )}
    </div>
  );
}
