import { publicSite } from "@/lib/api";
import { notFound } from "next/navigation";
import { isLocale, t } from "@/lib/i18n";
import { metadata } from "@/lib/seo";
import { InquiryForm } from "@/components/InquiryForm";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : "en";
  const site = await publicSite();
  const copy = { ...t(l), ...site.translations?.[l] };
  return metadata(l, copy.contact, copy.contactBody, "/contact");
}
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const site = await publicSite();
  const d = { ...t(locale), ...site.translations?.[locale] };
  return (
    <section className="section page-section inquiry-section">
      <div>
        <p className="eyebrow">AURA / {d.contact}</p>
        <h1>{d.contactPage}</h1>
        <p className="page-intro">{d.contactBody}</p>
        <p className="contact-location">
          Georgia
          <br />
          Tbilisi · Batumi
        </p>
      </div>
      <div>
        {site.phone && (
          <p>
            <a href={`tel:${site.phone}`}>{site.phone}</a>
          </p>
        )}
        {site.whatsapp && (
          <p>
            <a href={`https://wa.me/${site.whatsapp.replace(/\D/g, "")}`}>
              WhatsApp
            </a>
          </p>
        )}
        {site.email && (
          <p>
            <a href={`mailto:${site.email}`}>{site.email}</a>
          </p>
        )}
        <InquiryForm locale={locale} />
      </div>
    </section>
  );
}
