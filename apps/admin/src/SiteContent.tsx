import { useCallback, useEffect, useRef, useState } from "react";
import { api, mediaUrl } from "./api";
import { languages, Modal } from "./ui";
import { t as websiteCopy } from "../../web/src/lib/i18n";
import { cinematicCopy } from "../../web/src/lib/cinematic-copy";
import {
  editorCopy as s,
  type ContentLocale,
  type EditorCopyKey,
} from "./site-editor-copy";
import "./SiteContent.css";

type Site = {
  translations?: Partial<Record<ContentLocale, Record<string, string>>>;
  [key: string]: unknown;
};
type CopyField = { key: string; label: EditorCopyKey; multiline?: boolean };
type Section = {
  id: "about" | "hero" | "services" | "contact";
  title: EditorCopyKey;
  description: EditorCopyKey;
  path: string;
  globals: string[];
  groups: {
    title: EditorCopyKey;
    fields: CopyField[];
    path?: string;
    linkLabel?: EditorCopyKey;
  }[];
};
const sections: Section[] = [
  {
    id: "about",
    title: "About us",
    description: "Introduce the agency on the homepage and the About page.",
    path: "/about",
    globals: ["aboutImage"],
    groups: [
      {
        title: "Homepage introduction",
        fields: [
          { key: "agencyTitle", label: "Agency heading" },
          { key: "agencyBody", label: "Agency description", multiline: true },
        ],
      },
      {
        title: "About page",
        fields: [
          { key: "aboutTitle", label: "About heading" },
          { key: "aboutIntro", label: "About description", multiline: true },
        ],
      },
    ],
  },
  {
    id: "hero",
    title: "Hero",
    description: "Edit the first message visitors see on the homepage.",
    path: "",
    globals: ["heroImage", "heroVariant"],
    groups: [
      {
        title: "Hero copy",
        fields: [
          { key: "heroEyebrow", label: "Hero introduction" },
          { key: "hero", label: "Hero headline" },
          { key: "heroBody", label: "Hero description", multiline: true },
        ],
      },
    ],
  },
  {
    id: "services",
    title: "Services",
    description: "Explain the three services shown on the homepage.",
    path: "#approach-title",
    globals: [],
    groups: [
      {
        title: "Service 1",
        fields: [
          { key: "service1", label: "Service 1 title" },
          {
            key: "service1Body",
            label: "Service 1 description",
            multiline: true,
          },
        ],
      },
      {
        title: "Service 2",
        fields: [
          { key: "service2", label: "Service 2 title" },
          {
            key: "service2Body",
            label: "Service 2 description",
            multiline: true,
          },
        ],
      },
      {
        title: "Service 3",
        fields: [
          { key: "service3", label: "Service 3 title" },
          {
            key: "service3Body",
            label: "Service 3 description",
            multiline: true,
          },
        ],
      },
    ],
  },
  {
    id: "contact",
    title: "Contact & privacy",
    description:
      "Manage contact details, homepage contact copy and the Contact and Privacy pages.",
    path: "/contact",
    globals: ["phone", "whatsapp", "email"],
    groups: [
      {
        title: "Homepage contact section",
        fields: [{ key: "contactTitle", label: "Homepage contact heading" }],
      },
      {
        title: "Contact page",
        fields: [
          { key: "contactPage", label: "Contact page heading" },
          {
            key: "contactBody",
            label: "Description (homepage and Contact page)",
            multiline: true,
          },
        ],
      },
      {
        title: "Privacy page",
        path: "/privacy",
        linkLabel: "Open privacy page",
        fields: [
          { key: "privacyNotice", label: "Privacy notice", multiline: true },
        ],
      },
    ],
  },
];
const publicOrigin = (
  (import.meta as unknown as { env: Record<string, string> }).env
    .VITE_PUBLIC_URL || "http://localhost:3100"
).replace(/\/$/, "");
const languageName = (locale: ContentLocale) =>
  languages.find((language) => language.value === locale)?.label || locale;
const fieldsFor = (section: Section) =>
  section.groups.flatMap((group) => group.fields);
function value(site: Site | null, key: string, locale?: ContentLocale) {
  const raw = locale ? site?.translations?.[locale]?.[key] : site?.[key];
  return typeof raw === "string"
    ? raw
    : key === "heroVariant"
      ? "cityscape"
      : "";
}
function defaultCopy(key: string, locale: ContentLocale) {
  if (key === "agencyTitle") return cinematicCopy[locale].agencyTitle;
  const copy = websiteCopy(locale);
  if (key === "heroBody") return copy.footer;
  return copy[key as keyof typeof copy] || "";
}
function merge(site: Site, patch: Site): Site {
  const translations = { ...site.translations };
  for (const locale of Object.keys(
    patch.translations || {},
  ) as ContentLocale[]) {
    translations[locale] = {
      ...translations[locale],
      ...patch.translations?.[locale],
    };
  }
  return { ...site, ...patch, translations };
}
function changes(
  draft: Site,
  saved: Site,
  section: Section,
  locale: ContentLocale,
) {
  const patch: Site = {};
  for (const key of section.globals) {
    if (value(draft, key) !== value(saved, key)) patch[key] = value(draft, key);
  }
  const text = Object.fromEntries(
    fieldsFor(section)
      .filter(
        ({ key }) => value(draft, key, locale) !== value(saved, key, locale),
      )
      .map(({ key }) => [key, value(draft, key, locale)]),
  );
  if (Object.keys(text).length) patch.translations = { [locale]: text };
  return patch;
}
function isDirty(
  draft: Site,
  saved: Site,
  section: Section,
  locale: ContentLocale,
) {
  return Object.keys(changes(draft, saved, section, locale)).length > 0;
}

type ReviewField = CopyField & {
  source: string;
  current: string;
  suggestion: string;
  use: boolean;
};
type Review = {
  section: Section;
  source: ContentLocale;
  target: ContentLocale;
  fields: ReviewField[];
};

function ImagePreview({ url, label }: { url: string; label: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [url]);
  if (!url)
    return <div className="site-image-default">{s("Website default")}</div>;
  if (failed)
    return (
      <p className="site-image-error">
        {s("Image could not be loaded. Check the URL or upload another image.")}
      </p>
    );
  return (
    <img
      className="site-image-preview"
      src={mediaUrl(url, true)}
      alt={label}
      onError={() => setFailed(true)}
    />
  );
}

function ImageField({
  name,
  label,
  url,
  disabled,
  onChange,
  onBusy,
}: {
  name: string;
  label: EditorCopyKey;
  url: string;
  disabled: boolean;
  onChange: (url: string) => void;
  onBusy: (busy: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<EditorCopyKey | null>(null);
  return (
    <fieldset className="site-field-group" disabled={disabled || busy}>
      <legend>{s(label)}</legend>
      <p className="site-hint">
        {s(
          "Images, layout and contact details are shared across all languages.",
        )}
      </p>
      <div className="site-image-editor">
        <ImagePreview url={url} label={s(label)} />
        <div className="site-image-controls">
          <label htmlFor={`site-${name}`}>{s("Image URL")}</label>
          <input
            id={`site-${name}`}
            name={name}
            value={url}
            dir="ltr"
            maxLength={2000}
            onChange={(event) => onChange(event.target.value)}
          />
          <label htmlFor={`site-${name}-upload`}>{s("Upload image")}</label>
          <input
            id={`site-${name}-upload`}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            aria-describedby={`site-${name}-help`}
            onChange={async (event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              setError(null);
              if (
                file.size > 10000000 ||
                !["image/jpeg", "image/png", "image/webp"].includes(file.type)
              ) {
                setError("Choose a JPEG, PNG or WebP image up to 10 MB.");
                return;
              }
              setBusy(true);
              onBusy(true);
              try {
                const bytes = new Uint8Array(await file.arrayBuffer());
                let encoded = "";
                for (const byte of bytes) encoded += String.fromCharCode(byte);
                const result = await api<{ url: string }>("/uploads", "POST", {
                  name: file.name,
                  mime: file.type,
                  file: btoa(encoded),
                  purpose: "PROJECT",
                });
                onChange(result.url);
              } catch {
                setError("Upload failed. Try again.");
              } finally {
                setBusy(false);
                onBusy(false);
              }
            }}
          />
          <small id={`site-${name}-help`}>
            {s("JPEG, PNG or WebP, up to 10 MB.")}
          </small>
          {url && (
            <button type="button" onClick={() => onChange("")}>
              {s("Use default image")}
            </button>
          )}
          {busy && <p role="status">{s("Uploading…")}</p>}
          {error && (
            <p role="alert" className="error">
              {s(error)}
            </p>
          )}
        </div>
      </div>
    </fieldset>
  );
}

export function SiteContent() {
  const [draft, setDraft] = useState<Site | null>(null);
  const [saved, setSaved] = useState<Site | null>(null);
  const [sectionId, setSectionId] = useState<Section["id"]>("about");
  const [locale, setLocale] = useState<ContentLocale>("en");
  const [source, setSource] = useState<ContentLocale>("en");
  const [loadingError, setLoadingError] = useState(false);
  const [loadVersion, setLoadVersion] = useState(0);
  const [provider, setProvider] = useState<
    "checking" | "ready" | "missing" | "failed"
  >("checking");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<EditorCopyKey | null>(null);
  const [review, setReview] = useState<Review | null>(null);
  const [reviewed, setReviewed] = useState(false);
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const closeReview = useCallback(() => setReview(null), []);
  const section = sections.find((item) => item.id === sectionId)!;
  const dirty = !!draft && !!saved && isDirty(draft, saved, section, locale);
  const sectionDirty = (item: Section) =>
    !!draft &&
    !!saved &&
    languages.some((language) =>
      isDirty(draft, saved, item, language.value as ContentLocale),
    );
  const anyDirty = sections.some(sectionDirty);

  useEffect(() => {
    let active = true;
    setLoadingError(false);
    api<Site>("/site")
      .then((site) => {
        if (active) {
          setDraft(site);
          setSaved(site);
        }
      })
      .catch(() => {
        if (active) setLoadingError(true);
      });
    return () => {
      active = false;
    };
  }, [loadVersion]);
  const checkProvider = useCallback(async () => {
    setProvider("checking");
    try {
      const status = await api<{
        configured: boolean;
        provider: "openai" | "webhook" | null;
      }>("/translation/status");
      setProvider(status.configured ? "ready" : "missing");
    } catch {
      setProvider("failed");
    }
  }, []);
  useEffect(() => {
    void checkProvider();
  }, [checkProvider]);
  useEffect(() => {
    if (!anyDirty && !uploading && !translating && !review) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [anyDirty, uploading, translating, review]);

  const edit = (key: string, text: string, language?: ContentLocale) => {
    setDraft(
      (current) =>
        current &&
        merge(
          current,
          language
            ? { translations: { [language]: { [key]: text } } }
            : { [key]: text },
        ),
    );
    setMessage("");
    setError(null);
  };
  const useWebsiteText = (language: ContentLocale) => {
    if (!draft) return;
    const text = Object.fromEntries(
      fieldsFor(section)
        .filter(({ key }) => !value(draft, key, language).trim())
        .map(({ key }) => [key, defaultCopy(key, language)]),
    );
    setDraft(
      (current) =>
        current && merge(current, { translations: { [language]: text } }),
    );
    setMessage("");
  };
  const save = async () => {
    if (!draft || !saved || saving || uploading || translating || review)
      return;
    const patch = changes(draft, saved, section, locale);
    if (!Object.keys(patch).length) return;
    setSaving(true);
    setMessage("");
    setError(null);
    try {
      const result = await api<Site>("/site", "PATCH", patch);
      const persisted: Site = {};
      for (const key of section.globals)
        if (key in patch) persisted[key] = value(result, key);
      const textKeys = Object.keys(patch.translations?.[locale] || {});
      if (textKeys.length)
        persisted.translations = {
          [locale]: Object.fromEntries(
            textKeys.map((key) => [key, value(result, key, locale)]),
          ),
        };
      setSaved((current) => current && merge(current, persisted));
      // Inputs are locked during this save; update only the submitted fields.
      setDraft((current) => current && merge(current, persisted));
      setMessage(
        `${s("Saved")}: ${s(section.title)} · ${languageName(locale)}`,
      );
    } catch {
      setError("Could not save. Your draft is still here; try again.");
    } finally {
      setSaving(false);
    }
  };
  const sourceFields = fieldsFor(section).filter(({ key }) =>
    value(draft, key, source).trim(),
  );
  const translate = async () => {
    if (
      !draft ||
      translating ||
      provider !== "ready" ||
      source === locale ||
      !sourceFields.length
    )
      return;
    setTranslating(true);
    setError(null);
    setMessage("");
    const requestedSection = section,
      requestedSource = source,
      target = locale;
    try {
      const fields = await Promise.all(
        sourceFields.map(async (field) => {
          const text = value(draft, field.key, requestedSource);
          const result = await api<{ text: string }>("/translate", "POST", {
            text,
            source: requestedSource,
            target,
          });
          if (
            typeof result.text !== "string" ||
            !result.text.trim() ||
            result.text.length > 10000
          )
            throw new Error("Invalid translation");
          return { ...field, source: text, suggestion: result.text, use: true };
        }),
      );
      setReviewed(false);
      setReview({
        section: requestedSection,
        source: requestedSource,
        target,
        fields: fields.map((field) => ({
          ...field,
          current: value(draftRef.current, field.key, target),
        })),
      });
    } catch {
      setError("Translation failed. Your draft has not changed; try again.");
    } finally {
      setTranslating(false);
    }
  };
  const applyTranslation = () => {
    if (!review || !reviewed) return;
    const text = Object.fromEntries(
      review.fields
        .filter((field) => field.use)
        .map((field) => [field.key, field.suggestion]),
    );
    setDraft(
      (current) =>
        current && merge(current, { translations: { [review.target]: text } }),
    );
    setSectionId(review.section.id);
    setLocale(review.target);
    setReview(null);
    setMessage(
      s("Translation applied to draft. Save this section when ready."),
    );
  };

  if (!draft || !saved)
    return (
      <section className="panel site-editor">
        {loadingError ? (
          <>
            <p role="alert" className="error">
              {s("Could not load website content.")}
            </p>
            <button onClick={() => setLoadVersion((version) => version + 1)}>
              {s("Retry")}
            </button>
          </>
        ) : (
          <p role="status">{s("Loading content…")}</p>
        )}
      </section>
    );
  const contentDirection = locale === "he" ? "rtl" : "ltr";
  const canTranslate =
    provider === "ready" &&
    source !== locale &&
    sourceFields.length > 0 &&
    !translating &&
    !saving &&
    !uploading;
  const previewImage =
    section.id === "about"
      ? value(draft, "aboutImage")
      : section.id === "hero" && value(draft, "heroVariant") !== "collage"
        ? value(draft, "heroImage")
        : "";
  return (
    <section className="panel site-editor">
      <header className="site-editor-header">
        <div>
          <h2>{s("Edit website content")}</h2>
          <p className="site-hint">
            {s(
              "Choose a section, edit its content, then save when it is ready.",
            )}
          </p>
        </div>
        {anyDirty && <span className="site-dirty">{s("Unsaved changes")}</span>}
      </header>
      <nav className="site-section-nav" aria-label={s("Website sections")}>
        {sections.map((item) => (
          <button
            type="button"
            key={item.id}
            aria-current={sectionId === item.id ? "page" : undefined}
            onClick={() => setSectionId(item.id)}
            disabled={saving || uploading}
          >
            {s(item.title)}
            {sectionDirty(item) && (
              <span
                className="site-dirty-dot"
                role="img"
                aria-label={s("Unsaved changes")}
              />
            )}
          </button>
        ))}
      </nav>
      <div className="site-editor-toolbar">
        <label htmlFor="site-content-language">
          {s("Content language")}
          <select
            id="site-content-language"
            value={locale}
            disabled={saving}
            onChange={(event) => setLocale(event.target.value as ContentLocale)}
          >
            {languages.map((language) => (
              <option key={language.value} value={language.value}>
                {language.label}
                {isDirty(draft, saved, section, language.value as ContentLocale)
                  ? " •"
                  : ""}
              </option>
            ))}
          </select>
        </label>
        <div className="site-public-links">
          <a
            href={`${publicOrigin}/${locale}${section.path}`}
            target="_blank"
            rel="noreferrer"
          >
            {s("Open website")} ↗
          </a>
          {section.id === "about" && (
            <a
              href={`${publicOrigin}/${locale}#agency`}
              target="_blank"
              rel="noreferrer"
            >
              {s("Open homepage")} ↗
            </a>
          )}
        </div>
      </div>
      <div className="site-editor-layout">
        <form
          className="site-section-form"
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          <div className="site-section-intro">
            <h3>{s(section.title)}</h3>
            <p>{s(section.description)}</p>
            <p className="site-hint" id="site-default-help">
              {s(
                "Leave text empty to use the website’s default wording. An empty image uses the default image.",
              )}
            </p>
            {fieldsFor(section).some(
              ({ key }) => !value(draft, key, locale).trim(),
            ) && (
              <button
                type="button"
                disabled={saving}
                onClick={() => useWebsiteText(locale)}
              >
                {s("Use current website text")}
              </button>
            )}
            <p className="site-hint">
              {s(
                "Fill empty fields with the current website wording, then edit it here.",
              )}
            </p>
          </div>
          {section.groups.map((group) => (
            <fieldset
              className="site-field-group"
              key={group.title}
              disabled={saving}
            >
              <legend>{s(group.title)}</legend>
              {group.path && group.linkLabel && (
                <a
                  className="site-group-link"
                  href={`${publicOrigin}/${locale}${group.path}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {s(group.linkLabel)} ↗
                </a>
              )}
              {group.fields.map((field) => (
                <label
                  className="site-copy-field"
                  key={field.key}
                  htmlFor={`site-${field.key}`}
                >
                  {s(field.label)}
                  <textarea
                    id={`site-${field.key}`}
                    name={field.key}
                    rows={field.multiline ? 4 : 2}
                    className={field.multiline ? "" : "site-short-text"}
                    lang={locale}
                    dir={contentDirection}
                    value={value(draft, field.key, locale)}
                    placeholder={defaultCopy(field.key, locale)}
                    maxLength={10000}
                    aria-describedby="site-default-help"
                    onChange={(event) =>
                      edit(field.key, event.target.value, locale)
                    }
                  />
                </label>
              ))}
            </fieldset>
          ))}
          {section.id === "hero" && (
            <fieldset className="site-field-group" disabled={saving}>
              <legend>{s("Hero layout")}</legend>
              <label className="site-copy-field" htmlFor="site-hero-variant">
                {s("Hero layout")}
                <select
                  id="site-hero-variant"
                  value={value(draft, "heroVariant")}
                  onChange={(event) => edit("heroVariant", event.target.value)}
                >
                  <option value="cityscape">{s("Cityscape")}</option>
                  <option value="collage">{s("Project collage")}</option>
                </select>
              </label>
              <p className="site-hint">
                {s(
                  "Collage uses published project images. The hero image is used with Cityscape.",
                )}
              </p>
            </fieldset>
          )}
          {(section.id === "about" || section.id === "hero") && (
            <ImageField
              key={section.id}
              name={section.id === "about" ? "aboutImage" : "heroImage"}
              label={section.id === "about" ? "About image" : "Hero image"}
              url={value(
                draft,
                section.id === "about" ? "aboutImage" : "heroImage",
              )}
              disabled={saving}
              onBusy={setUploading}
              onChange={(url) =>
                edit(section.id === "about" ? "aboutImage" : "heroImage", url)
              }
            />
          )}
          {section.id === "contact" && (
            <fieldset className="site-field-group" disabled={saving}>
              <legend>{s("Shared contact details")}</legend>
              <p className="site-hint">
                {s(
                  "Images, layout and contact details are shared across all languages.",
                )}
              </p>
              {(
                [
                  ["phone", "Public phone", "tel"],
                  ["whatsapp", "WhatsApp", "tel"],
                  ["email", "Email (optional)", "email"],
                ] as const
              ).map(([key, label, type]) => (
                <label
                  key={key}
                  className="site-copy-field"
                  htmlFor={`site-${key}`}
                >
                  {s(label)}
                  <input
                    id={`site-${key}`}
                    type={type}
                    dir="ltr"
                    value={value(draft, key)}
                    maxLength={key === "email" ? 254 : 100}
                    onChange={(event) => edit(key, event.target.value)}
                  />
                </label>
              ))}
            </fieldset>
          )}
          <footer className="site-save-bar">
            <div>
              <strong className={dirty ? "site-dirty" : "site-hint"}>
                {s(dirty ? "Unsaved changes" : "No changes to save")}
              </strong>
              <p className="site-hint">
                {s(
                  "Saving updates this section on the website. Other drafts stay unsaved.",
                )}
              </p>
            </div>
            <button
              className="primary"
              type="submit"
              disabled={
                !dirty || saving || uploading || translating || !!review
              }
            >
              {s(saving ? "Saving…" : "Save section")}
            </button>
          </footer>
          {message && (
            <p className="site-notice" role="status">
              {message}
            </p>
          )}
          {error && (
            <p role="alert" className="error">
              {s(error)}
            </p>
          )}
        </form>
        <div
          className="site-editor-aside"
          role="complementary"
          aria-label={s("Draft preview")}
        >
          <section className="site-preview" aria-label={s("Draft preview")}>
            <h3>{s("Draft preview")}</h3>
            <p className="site-hint">
              {s(
                "A text preview of your draft. Open the website to see the saved layout and defaults.",
              )}
            </p>
            {previewImage && (
              <ImagePreview
                url={previewImage}
                label={s(section.id === "about" ? "About image" : "Hero image")}
              />
            )}
            {section.groups.map((group) => (
              <div className="site-preview-group" key={group.title}>
                <h4>{s(group.title)}</h4>
                <div lang={locale} dir={contentDirection}>
                  {group.fields.map((field) => (
                    <p
                      key={field.key}
                      className={
                        field.multiline
                          ? "site-preview-body"
                          : "site-preview-heading"
                      }
                    >
                      {value(draft, field.key, locale).trim()
                        ? value(draft, field.key, locale)
                        : defaultCopy(field.key, locale) ||
                          s("Website default")}
                    </p>
                  ))}
                </div>
              </div>
            ))}
            {section.id === "contact" && (
              <div className="site-preview-contacts" dir="ltr">
                {section.globals.map(
                  (key) =>
                    value(draft, key) && <p key={key}>{value(draft, key)}</p>,
                )}
              </div>
            )}
          </section>
          <section
            className="site-translation"
            aria-labelledby="site-translation-title"
          >
            <h3 id="site-translation-title">{s("AI translation")}</h3>
            <p className="site-hint">
              {s(
                "Translate the source draft into the selected content language. Review the suggestion before applying it.",
              )}
            </p>
            <label className="site-copy-field" htmlFor="site-source-language">
              {s("Source language")}
              <select
                id="site-source-language"
                value={source}
                disabled={translating}
                onChange={(event) =>
                  setSource(event.target.value as ContentLocale)
                }
              >
                {languages.map((language) => (
                  <option key={language.value} value={language.value}>
                    {language.label}
                  </option>
                ))}
              </select>
            </label>
            <p className="site-translation-target">
              {s("Target language")}: <strong>{languageName(locale)}</strong>
            </p>
            {provider === "checking" && (
              <p role="status" className="site-hint">
                {s("Checking translation availability…")}
              </p>
            )}
            {provider === "missing" && (
              <p className="site-hint">
                {s(
                  "AI translation is not connected yet. An administrator must configure the translation provider; you can still write each language manually.",
                )}
              </p>
            )}
            {provider === "failed" && (
              <>
                <p className="site-hint">
                  {s(
                    "Could not check translation availability. Retry or edit manually.",
                  )}
                </p>
                <button type="button" onClick={() => void checkProvider()}>
                  {s("Retry")}
                </button>
              </>
            )}
            {source === locale ? (
              <p className="site-hint">
                {s("Choose a different source language.")}
              </p>
            ) : !sourceFields.length ? (
              <>
                <p className="site-hint">
                  {s(
                    "This section has no source text. Add text in the source language first; website defaults are not translated here.",
                  )}
                </p>
                <button
                  type="button"
                  disabled={saving || translating}
                  onClick={() => useWebsiteText(source)}
                >
                  {s("Use website text in source draft")}
                </button>
              </>
            ) : (
              <p className="site-hint">
                {s(
                  "Only entered source text is translated. Empty source fields leave the target unchanged.",
                )}
              </p>
            )}
            <button
              className="site-translate-button"
              type="button"
              disabled={!canTranslate}
              onClick={() => void translate()}
            >
              {s(translating ? "Translating…" : "Translate section for review")}
            </button>
          </section>
        </div>
      </div>
      <p className="site-hint site-draft-help">
        {s(
          "Drafts stay here while you switch sections or languages. Save before leaving Website.",
        )}
      </p>
      {review && (
        <Modal title={s("Review translation")} onClose={closeReview}>
          <div className="site-translation-review">
            <p>
              <strong>{s(review.section.title)}</strong> ·{" "}
              {languageName(review.source)} → {languageName(review.target)}
            </p>
            <p className="site-hint">
              {s(
                "Check and edit each suggestion. Applying replaces only selected fields in the target draft; save the section separately to update the website.",
              )}
            </p>
            {review.fields.map((field, index) => (
              <fieldset className="site-field-group" key={field.key}>
                <legend>{s(field.label)}</legend>
                <div className="site-review-original">
                  <span>{s("Source text")}</span>
                  <p
                    lang={review.source}
                    dir={review.source === "he" ? "rtl" : "ltr"}
                  >
                    {field.source}
                  </p>
                  <span>{s("Current target text")}</span>
                  <p
                    lang={review.target}
                    dir={review.target === "he" ? "rtl" : "ltr"}
                  >
                    {field.current ||
                      defaultCopy(field.key, review.target) ||
                      s("Website default")}
                  </p>
                </div>
                <label
                  className="site-copy-field"
                  htmlFor={`site-suggestion-${field.key}`}
                >
                  {s("Suggested translation")}
                  <textarea
                    id={`site-suggestion-${field.key}`}
                    maxLength={10000}
                    lang={review.target}
                    dir={review.target === "he" ? "rtl" : "ltr"}
                    value={field.suggestion}
                    onChange={(event) => {
                      const suggestion = event.target.value;
                      setReviewed(false);
                      setReview(
                        (current) =>
                          current && {
                            ...current,
                            fields: current.fields.map((item, i) =>
                              i === index ? { ...item, suggestion } : item,
                            ),
                          },
                      );
                    }}
                  />
                </label>
                <label className="site-check">
                  <input
                    type="checkbox"
                    checked={field.use}
                    onChange={(event) => {
                      const use = event.target.checked;
                      setReviewed(false);
                      setReview(
                        (current) =>
                          current && {
                            ...current,
                            fields: current.fields.map((item, i) =>
                              i === index ? { ...item, use } : item,
                            ),
                          },
                      );
                    }}
                  />
                  {s("Use this translation")}
                </label>
              </fieldset>
            ))}
            <label className="site-check site-review-ack">
              <input
                type="checkbox"
                checked={reviewed}
                onChange={(event) => setReviewed(event.target.checked)}
              />
              {s("I reviewed the selected translations.")}
            </label>
            <div className="site-review-actions">
              <button type="button" onClick={closeReview}>
                {s("Discard suggestions")}
              </button>
              <button
                className="primary"
                type="button"
                disabled={
                  !reviewed || !review.fields.some((field) => field.use)
                }
                onClick={applyTranslation}
              >
                {s("Apply to draft")}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}
