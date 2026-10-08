import { useCallback, useEffect, useState } from "react";
import { api, mediaUrl } from "./api";
import { languages, Modal } from "./ui";
import "./WebsiteTeam.css";

type Locale = "en" | "ka" | "ru" | "he";
type ProfileText = { name: string; title: string; bio: string };
type TeamMember = ProfileText & {
  id: string;
  photo: string;
  visible: boolean;
  translations?: Partial<Record<Locale, Partial<ProfileText>>>;
};
type Site = { teamMembers?: TeamMember[] };
const copy = {
  en: {
    heading: "Our team",
    description:
      "Manage the people shown on the About page. These public profiles do not create CRM accounts.",
    edit: "Edit profile",
    language: "Content language",
    name: "Full name",
    title: "Position",
    bio: "About this person",
    photo: "Photo URL",
    upload: "Replace photo",
    format:
      "JPEG, PNG or WebP, up to 10 MB. The photo is shared across all languages.",
    visible: "Show on website",
    shown: "Visible",
    hidden: "Hidden",
    save: "Save profile",
    saving: "Saving…",
    uploading: "Uploading…",
    saved: "Profile saved. The About page is updated.",
    loading: "Loading team…",
    empty: "No public team profiles yet.",
    retry: "Try again",
    page: "Open About page",
    missing: "This profile no longer exists. Reload the team before editing.",
    invalid: "Choose a JPEG, PNG or WebP image up to 10 MB.",
    failed: "Image unavailable",
    published:
      "Saving publishes this profile to the website. Other profiles and site content stay unchanged.",
    fallback: "Empty translations use the Georgian profile text.",
  },
  ka: {
    heading: "ჩვენი გუნდი",
    description:
      "მართეთ „ჩვენ შესახებ“ გვერდზე ნაჩვენები გუნდი. ეს საჯარო პროფილები CRM-ის ანგარიშებს არ ქმნის.",
    edit: "პროფილის რედაქტირება",
    language: "კონტენტის ენა",
    name: "სახელი და გვარი",
    title: "პოზიცია",
    bio: "გუნდის წევრის შესახებ",
    photo: "სურათის ბმული",
    upload: "ფოტოს შეცვლა",
    format: "JPEG, PNG ან WebP, მაქსიმუმ 10 MB. ფოტო ყველა ენისთვის საერთოა.",
    visible: "გამოჩნდეს ვებსაიტზე",
    shown: "ხილული",
    hidden: "დამალული",
    save: "პროფილის შენახვა",
    saving: "ინახება…",
    uploading: "იტვირთება…",
    saved: "პროფილი შენახულია. „ჩვენ შესახებ“ გვერდი განახლდა.",
    loading: "გუნდი იტვირთება…",
    empty: "საჯარო გუნდის პროფილები ჯერ არ არის.",
    retry: "ხელახლა ცდა",
    page: "„ჩვენ შესახებ“ გვერდის გახსნა",
    missing: "ეს პროფილი აღარ არსებობს. რედაქტირებამდე განაახლეთ გუნდი.",
    invalid: "აირჩიეთ JPEG, PNG ან WebP სურათი, მაქსიმუმ 10 MB.",
    failed: "სურათი მიუწვდომელია",
    published:
      "შენახვის შემდეგ პროფილი გამოქვეყნდება საიტზე. სხვა პროფილები და საიტის კონტენტი უცვლელი დარჩება.",
    fallback: "ცარიელი თარგმანის ნაცვლად გამოჩნდება ქართული ტექსტი.",
  },
  ru: {
    heading: "Наша команда",
    description:
      "Управляйте профилями на странице «О нас». Публичные профили не создают учётные записи CRM.",
    edit: "Редактировать профиль",
    language: "Язык контента",
    name: "Имя и фамилия",
    title: "Должность",
    bio: "О сотруднике",
    photo: "Ссылка на фото",
    upload: "Заменить фото",
    format: "JPEG, PNG или WebP, до 10 МБ. Фото общее для всех языков.",
    visible: "Показывать на сайте",
    shown: "Опубликован",
    hidden: "Скрыт",
    save: "Сохранить профиль",
    saving: "Сохранение…",
    uploading: "Загрузка…",
    saved: "Профиль сохранён. Страница «О нас» обновлена.",
    loading: "Загрузка команды…",
    empty: "Публичных профилей пока нет.",
    retry: "Повторить",
    page: "Открыть страницу «О нас»",
    missing: "Профиль больше не существует. Обновите список команды.",
    invalid: "Выберите JPEG, PNG или WebP размером до 10 МБ.",
    failed: "Фото недоступно",
    published:
      "Сохранение публикует профиль на сайте. Остальные профили и контент не изменятся.",
    fallback: "Вместо пустого перевода отображается грузинский текст.",
  },
  he: {
    heading: "הצוות שלנו",
    description:
      "ניהול הפרופילים בדף אודות. פרופילים ציבוריים אלה אינם יוצרים חשבונות CRM.",
    edit: "עריכת פרופיל",
    language: "שפת התוכן",
    name: "שם מלא",
    title: "תפקיד",
    bio: "אודות חבר הצוות",
    photo: "קישור לתמונה",
    upload: "החלפת תמונה",
    format: "JPEG, PNG או WebP, עד 10 MB. התמונה משותפת לכל השפות.",
    visible: "הצגה באתר",
    shown: "גלוי",
    hidden: "מוסתר",
    save: "שמירת פרופיל",
    saving: "שומר…",
    uploading: "מעלה…",
    saved: "הפרופיל נשמר. דף אודות עודכן.",
    loading: "טוען את הצוות…",
    empty: "אין עדיין פרופילים ציבוריים.",
    retry: "ניסיון נוסף",
    page: "פתיחת דף אודות",
    missing: "הפרופיל אינו קיים עוד. יש לטעון את הצוות מחדש.",
    invalid: "יש לבחור תמונת JPEG, PNG או WebP עד 10 MB.",
    failed: "התמונה אינה זמינה",
    published: "השמירה מפרסמת את הפרופיל באתר. פרופילים ותוכן אחרים לא ישתנו.",
    fallback: "תרגום ריק יציג את הטקסט בגאורגית.",
  },
};
const publicOrigin = (
  (import.meta as unknown as { env: Record<string, string> }).env
    .VITE_PUBLIC_URL || "http://localhost:3100"
).replace(/\/$/, "");
const uiLocale = () => {
  const value = localStorage.getItem("aura-admin-locale");
  return value && value in copy ? (value as Locale) : "en";
};
function translated(
  member: TeamMember,
  locale: Locale,
  field: keyof ProfileText,
) {
  return member.translations?.[locale]?.[field] || member[field];
}
function ProfilePhoto({
  member,
  label,
}: {
  member: TeamMember;
  label: string;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [member.photo]);
  return member.photo && !failed ? (
    <img
      src={mediaUrl(member.photo, true)}
      alt=""
      onError={() => setFailed(true)}
    />
  ) : (
    <div className="website-team-photo-fallback" role="img" aria-label={label}>
      {member.name.slice(0, 1)}
    </div>
  );
}

export function WebsiteTeam({
  user,
}: {
  user: { active?: boolean; role?: string };
}) {
  if (!user.active || user.role !== "SUPER_ADMIN") return null;
  return <TeamEditor />;
}
function TeamEditor() {
  const text = copy[uiLocale()];
  const [members, setMembers] = useState<TeamMember[] | null>(null);
  const [locale, setLocale] = useState<Locale>(uiLocale);
  const [draft, setDraft] = useState<TeamMember | null>(null);
  const [error, setError] = useState("");
  const [editError, setEditError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const busy = saving || uploading;
  const load = useCallback(async () => {
    setError("");
    try {
      const site = await api<Site>("/site");
      setMembers(site.teamMembers || []);
    } catch (cause) {
      setError((cause as Error).message);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const close = useCallback(() => {
    if (!busy) setDraft(null);
  }, [busy]);
  useEffect(() => {
    if (!draft) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [!!draft]);
  const updateText = (field: keyof ProfileText, value: string) =>
    setDraft(
      (current) =>
        current && {
          ...current,
          ...(locale === "ka" ? { [field]: value } : {}),
          translations: {
            ...current.translations,
            [locale]: { ...current.translations?.[locale], [field]: value },
          },
        },
    );
  return (
    <section className="website-team" aria-labelledby="website-team-title">
      <div className="website-team-header">
        <div>
          <h2 id="website-team-title">{text.heading}</h2>
          <p>{text.description}</p>
        </div>
        <a
          href={`${publicOrigin}/${locale}/about#team`}
          target="_blank"
          rel="noreferrer"
        >
          {text.page} ↗
        </a>
      </div>
      {message && (
        <p className="website-team-message" role="status">
          {message}
        </p>
      )}
      {error && (
        <div role="alert" className="error">
          <p>{error}</p>
          <button type="button" onClick={() => void load()}>
            {text.retry}
          </button>
        </div>
      )}
      {!members && !error && <p role="status">{text.loading}</p>}
      {members?.length === 0 && <p>{text.empty}</p>}
      <div className="website-team-grid">
        {members?.map((member) => (
          <article className="website-team-card" key={member.id}>
            <div className="website-team-photo">
              <ProfilePhoto member={member} label={text.failed} />
            </div>
            <div
              className="website-team-card-copy"
              dir={locale === "he" ? "rtl" : "ltr"}
            >
              <span
                className={`website-team-status${member.visible ? "" : " is-hidden"}`}
              >
                {member.visible ? text.shown : text.hidden}
              </span>
              <h3>{translated(member, locale, "name")}</h3>
              <p className="website-team-position">
                {translated(member, locale, "title")}
              </p>
              <p className="website-team-bio">
                {translated(member, locale, "bio")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setDraft(structuredClone(member));
                setEditError("");
                setMessage("");
              }}
            >
              {text.edit}
            </button>
          </article>
        ))}
      </div>
      {draft && (
        <Modal title={`${text.edit} · ${draft.name}`} onClose={close}>
          <form
            className="website-team-form"
            onSubmit={async (event) => {
              event.preventDefault();
              if (busy) return;
              setSaving(true);
              setEditError("");
              try {
                const latest = await api<Site>("/site");
                const current = latest.teamMembers || [];
                if (!current.some((member) => member.id === draft.id))
                  throw new Error(text.missing);
                const teamMembers = current.map((member) =>
                  member.id === draft.id ? { ...member, ...draft } : member,
                );
                const result = await api<Site>("/site", "PATCH", {
                  teamMembers,
                });
                setMembers(result.teamMembers || teamMembers);
                setDraft(null);
                setMessage(text.saved);
              } catch (cause) {
                setEditError((cause as Error).message);
              } finally {
                setSaving(false);
              }
            }}
          >
            <fieldset disabled={busy}>
              <label htmlFor="team-content-language">
                {text.language}
                <select
                  id="team-content-language"
                  value={locale}
                  onChange={(event) => setLocale(event.target.value as Locale)}
                >
                  {languages.map((language) => (
                    <option key={language.value} value={language.value}>
                      {language.label}
                    </option>
                  ))}
                </select>
              </label>
              <p className="website-team-hint">{text.fallback}</p>
              {(["name", "title", "bio"] as const).map((field) => (
                <label key={field} htmlFor={`team-${field}`}>
                  {text[field]}
                  {field === "bio" ? (
                    <textarea
                      id={`team-${field}`}
                      dir={locale === "he" ? "rtl" : "ltr"}
                      value={
                        locale === "ka"
                          ? draft[field]
                          : draft.translations?.[locale]?.[field] || ""
                      }
                      placeholder={draft[field]}
                      maxLength={6000}
                      onChange={(event) =>
                        updateText(field, event.target.value)
                      }
                    />
                  ) : (
                    <input
                      id={`team-${field}`}
                      dir={locale === "he" ? "rtl" : "ltr"}
                      value={
                        locale === "ka"
                          ? draft[field]
                          : draft.translations?.[locale]?.[field] || ""
                      }
                      placeholder={draft[field]}
                      required={locale === "ka" && field === "name"}
                      maxLength={field === "name" ? 200 : 300}
                      onChange={(event) =>
                        updateText(field, event.target.value)
                      }
                    />
                  )}
                </label>
              ))}
              <div className="website-team-image-editor">
                <div className="website-team-photo">
                  <ProfilePhoto member={draft} label={text.failed} />
                </div>
                <div>
                  <label htmlFor="team-photo">
                    {text.photo}
                    <input
                      id="team-photo"
                      value={draft.photo}
                      dir="ltr"
                      maxLength={2000}
                      onChange={(event) =>
                        setDraft({ ...draft, photo: event.target.value })
                      }
                    />
                  </label>
                  <label htmlFor="team-photo-upload">
                    {text.upload}
                    <input
                      id="team-photo-upload"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      aria-describedby="team-photo-format"
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        event.target.value = "";
                        if (!file) return;
                        setEditError("");
                        if (
                          file.size > 10000000 ||
                          !["image/jpeg", "image/png", "image/webp"].includes(
                            file.type,
                          )
                        ) {
                          setEditError(text.invalid);
                          return;
                        }
                        setUploading(true);
                        try {
                          let encoded = "";
                          for (const byte of new Uint8Array(
                            await file.arrayBuffer(),
                          ))
                            encoded += String.fromCharCode(byte);
                          const upload = await api<{ url: string }>(
                            "/uploads",
                            "POST",
                            {
                              name: file.name,
                              mime: file.type,
                              file: btoa(encoded),
                              purpose: "PROFILE",
                            },
                          );
                          setDraft(
                            (current) =>
                              current && { ...current, photo: upload.url },
                          );
                        } catch (cause) {
                          setEditError((cause as Error).message);
                        } finally {
                          setUploading(false);
                        }
                      }}
                    />
                  </label>
                  <small id="team-photo-format">{text.format}</small>
                </div>
              </div>
              <label className="website-team-visibility">
                <input
                  type="checkbox"
                  checked={draft.visible}
                  onChange={(event) =>
                    setDraft({ ...draft, visible: event.target.checked })
                  }
                />
                {text.visible}
              </label>
            </fieldset>
            <p className="website-team-hint">{text.published}</p>
            {editError && (
              <p className="error" role="alert">
                {editError}
              </p>
            )}
            {uploading && <p role="status">{text.uploading}</p>}
            <button className="primary" disabled={busy}>
              {saving ? text.saving : text.save}
            </button>
          </form>
        </Modal>
      )}
    </section>
  );
}
