import { publicSite } from "@/lib/api";
import { projects, posts, imageCity } from "@/lib/api";
import { isLocale, t, type Locale } from "@/lib/i18n";
import { CinematicHome } from "@/components/CinematicHome";
import { metadata, origin } from "@/lib/seo";
import { notFound } from "next/navigation";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const selected = isLocale(locale) ? locale : "en";
  const site = await publicSite();
  const copy = { ...t(selected), ...site.translations?.[selected] };
  return metadata(selected, copy.heroEyebrow, copy.heroBody);
}
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const site = await publicSite();
  const d = { ...t(locale), ...site.translations?.[locale] };
  const [collection, articles] = await Promise.all([projects(), posts()]);
  const collage = site.heroVariant
    ? site.heroVariant === "collage"
    : process.env.NEXT_PUBLIC_HERO_VARIANT === "collage";
  return (
    <>
      <CinematicHome
        locale={locale}
        copy={d}
        collection={collection}
        articles={articles}
        heroImage={site.heroImage || imageCity}
        heroDescription={site.translations?.[locale]?.heroBody || d.footer}
        agencyTitle={site.translations?.[locale]?.agencyTitle}
        collage={collage}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "RealEstateAgent",
            name: "Aura Property",
            url: origin,
            areaServed: { "@type": "Country", name: "Georgia" },
          }).replace(/</g, "\\u003c"),
        }}
      />
    </>
  );
}
