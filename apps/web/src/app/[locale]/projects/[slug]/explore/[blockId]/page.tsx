import Link from "next/link";
import { notFound } from "next/navigation";
import { project, exchangeRate } from "@/lib/api";
import { isLocale } from "@/lib/i18n";
import { metadata } from "@/lib/seo";
import { projectBlocks, projectNavigation } from "@/lib/project-navigation";
import { Explorer } from "@/components/Explorer";
import { ProjectInquiry } from "@/components/ProjectInquiry";
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
        className="section"
        style={{
          paddingBlock: "24px 0",
          display: "flex",
          gap: 20,
          flexWrap: "wrap",
        }}
        aria-label={projectNavigation(locale).blocks}
      >
        <Link href={`/${locale}/projects/${slug}`}>
          {projectNavigation(locale).back}
        </Link>
        <Link href={`/${locale}/projects/${slug}/explore`}>
          ← {projectNavigation(locale).blocks}
        </Link>
        <h1 style={{ fontSize: "24px", margin: 0 }}>{block.name}</h1>
        {!p.soldOut && <ProjectInquiry project={p} locale={locale} />}
      </nav>
      <Explorer project={scoped} locale={locale} usdGel={rate?.usdGel} />
    </>
  );
}
