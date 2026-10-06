import { publicSite } from "@/lib/api";
import { notFound } from "next/navigation";
import { isLocale, t } from "@/lib/i18n";
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const site = await publicSite();
  return (
    <section className="section page-section article">
      <h1>{t(locale).privacy}</h1>
      {site.translations?.[locale]?.privacyNotice ? (
        <p>{site.translations[locale]?.privacyNotice}</p>
      ) : (
        <p>
          This preview privacy notice must be reviewed and completed before
          accepting live inquiries. Inquiry details are used to respond to
          property requests. Access is limited to authorized agency staff.
          Production contact information, retention periods and rights-request
          details will be added before launch.
        </p>
      )}
    </section>
  );
}
