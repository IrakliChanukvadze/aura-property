"use client";
import { useParams } from "next/navigation";
import { isLocale, t } from "@/lib/i18n";
export default function ErrorPage({ reset }: { reset: () => void }) {
  const params = useParams();
  const locale =
    typeof params.locale === "string" && isLocale(params.locale)
      ? params.locale
      : "en";
  const d = t(locale);
  return (
    <section className="section page-section">
      <p className="eyebrow">AURA PROPERTY</p>
      <h1>{d.temporaryUnavailable}</h1>
      <p className="page-intro">{d.loadError}</p>
      <button className="button primary" onClick={reset}>
        {d.retry}
      </button>
    </section>
  );
}
