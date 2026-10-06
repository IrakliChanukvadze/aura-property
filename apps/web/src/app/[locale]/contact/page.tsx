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
  return metadata(l, t(l).contact, t(l).contactBody, "/contact");
}
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const d = t(locale);
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
      <InquiryForm locale={locale} />
    </section>
  );
}
