import Link from "next/link";
import { notFound } from "next/navigation";
import { project, exchangeRate } from "@/lib/api";
import { isLocale } from "@/lib/i18n";
import { metadata } from "@/lib/seo";
import { projectBlocks, projectNavigation } from "@/lib/project-navigation";
import { Explorer } from "@/components/Explorer";
import { ChevronRight } from "lucide-react";
import { t } from "@/lib/i18n";
type Props = {
  params: Promise<{ locale: string; slug: string; blockId: string }>;
};
export async function generateMetadata({ params }: Props) {
  const { locale, slug, blockId } = await params;
  if (!isLocale(locale)) return {};
  const p = await project(slug);
  const block = p && projectBlocks(p).find((block) => block.id === blockId);
  if (!p || !block) return {};
  return metadata(
    locale,
    `${p.translations[locale]?.title || p.translations.en.title} · ${block.name}`,
    p.translations[locale]?.description || "",
    `/projects/${slug}/explore/${encodeURIComponent(blockId)}`,
  );
}
export default async function Page({ params }: Props) {
  const { locale, slug, blockId } = await params;
  if (!isLocale(locale)) notFound();
  const p = await project(slug);
  if (!p) notFound();
  const block = projectBlocks(p).find((block) => block.id === blockId);
  if (!block) notFound();
  const rate = await exchangeRate();
  const scoped = {
    ...p,
    buildings: p.buildings.filter((building) =>
      block.buildingIds.includes(building.id),
    ),
    metadata: { ...p.metadata, blocks: [] },
  };
  return (
    <>
      <nav
        className="explorer-breadcrumbs"
        aria-label={projectNavigation(locale).blocks}
      >
        <Link href={`/${locale}`}>Aura</Link>
        <ChevronRight size={12} />
        <Link href={`/${locale}/projects`}>{t(locale).projects}</Link>
        <ChevronRight size={12} />
        <Link href={`/${locale}/projects/${slug}`}>
          {p.translations[locale]?.title || p.translations.en.title}
        </Link>
        <ChevronRight size={12} />
        <Link href={`/${locale}/projects/${slug}/explore`}>
          {projectNavigation(locale).blocks}
        </Link>
        <ChevronRight size={12} />
        <span>{block.name}</span>
      </nav>
      <Explorer project={scoped} locale={locale} usdGel={rate?.usdGel} />
    </>
  );
}
