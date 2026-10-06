import { useEffect, useState } from "react";
import { api } from "./api";
import { Form, languages } from "./ui";
import { t } from "./i18n";
const keys = [
  "heroEyebrow",
  "hero",
  "heroBody",
  "agencyTitle",
  "agencyBody",
  "aboutTitle",
  "aboutIntro",
  "contactTitle",
  "contactBody",
  "service1",
  "service1Body",
  "service2",
  "service2Body",
  "service3",
  "service3Body",
  "privacyNotice",
];
const labels = [
  "Hero introduction",
  "Hero headline",
  "Hero description",
  "Agency heading",
  "Agency description",
  "About heading",
  "About description",
  "Contact heading",
  "Contact description",
  "Service 1 title",
  "Service 1 description",
  "Service 2 title",
  "Service 2 description",
  "Service 3 title",
  "Service 3 description",
  "Privacy notice",
];
export function SiteContent() {
  const [site, setSite] = useState<any>(null),
    [locale, setLocale] = useState("en"),
    [message, setMessage] = useState("");
  useEffect(() => {
    api("/site")
      .then(setSite)
      .catch((e) => setMessage(e.message));
  }, []);
  return (
    <section className="panel">
      <p className="muted">
        {t(
          "Website copy and contact details. Empty text uses the default translation.",
        )}
      </p>
      <select
        aria-label={t("Content language")}
        value={locale}
        onChange={(e) => setLocale(e.target.value)}
      >
        {languages.map((l) => (
          <option key={l.value} value={l.value}>
            {l.label}
          </option>
        ))}
      </select>
      {site && (
        <Form
          key={locale}
          fields={[
            {
              name: "phone",
              label: t("Public phone"),
              value: site.phone || "",
            },
            { name: "whatsapp", label: "WhatsApp", value: site.whatsapp || "" },
            {
              name: "email",
              label: t("Email (optional)"),
              type: "email",
              value: site.email || "",
            },
            {
              name: "heroVariant",
              label: t("Hero layout"),
              options: [
                { value: "cityscape", label: t("Cityscape") },
                { value: "collage", label: t("Project collage") },
              ],
              value: site.heroVariant || "cityscape",
            },
            {
              name: "heroImage",
              label: t("Hero image"),
              type: "upload",
              purpose: "PROJECT",
              value: site.heroImage || "",
            },
            ...keys.map((name, i) => ({
              name,
              label: t(labels[i]),
              type: "textarea",
              value: site.translations?.[locale]?.[name] || "",
            })),
          ]}
          onSubmit={async (values) => {
            const copy = Object.fromEntries(
              keys.filter((k) => values[k]?.trim()).map((k) => [k, values[k]]),
            );
            const next = {
              phone: values.phone,
              whatsapp: values.whatsapp,
              email: values.email,
              heroVariant: values.heroVariant,
              heroImage: values.heroImage,
              translations: { ...site.translations, [locale]: copy },
            };
            setSite(await api("/site", "PATCH", next));
            setMessage(t("Preferences saved"));
          }}
        />
      )}
      {message && <p role="status">{message}</p>}
    </section>
  );
}
