import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { project } from "@/lib/api";
import { isLocale, t } from "@/lib/i18n";
import { projectBlocks, projectNavigation } from "@/lib/project-navigation";
import { metadata } from "@/lib/seo";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const p = await project(slug);
  if (!p) return {};
  const l = isLocale(locale) ? locale : "en";
  return metadata(
    l,
    p.translations[l]?.title || p.translations.en.title,
    p.translations[l]?.description || "",
    `/projects/${slug}`,
  );
}
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const p = await project(slug);
  if (!p) notFound();
  const d = t(locale);
  const query = await searchParams;
  const buildingId =
    typeof query.building === "string" ? query.building : undefined;
  const floorId = typeof query.floor === "string" ? query.floor : undefined;
  const unitId = typeof query.unit === "string" ? query.unit : undefined;
  const selectedBuilding = p.buildings.find(
    (building) =>
      building.id === buildingId ||
      building.floors.some(
        (floor) =>
          floor.id === floorId ||
          floor.units.some((unit) => unit.id === unitId),
      ),
  );
  if (selectedBuilding) {
    const block = projectBlocks(p).find((block) =>
      block.buildingIds.includes(selectedBuilding.id),
    );
    if (block) {
      const preserved = new URLSearchParams({ building: selectedBuilding.id });
      if (floorId) preserved.set("floor", floorId);
      if (unitId) preserved.set("unit", unitId);
      redirect(
        `/${locale}/projects/${slug}/explore/${encodeURIComponent(block.id)}?${preserved}`,
      );
    }
  }
  return (
    <>
      <section className="project-hero" data-parallax="hero" data-speed="0.16">
        <img src={p.coverImage} alt={p.translations[locale].title} />
        <div>
          <Link href={`/${locale}/projects`}>{d.back}</Link>
          <p className="eyebrow">
            {p.city} /{" "}
            {p.constructionStatus === "COMPLETED" ? d.completed : d.ongoing}
          </p>
          <h1>{p.translations[locale].title}</h1>
          <Link
            className="button hero-explore-link"
            href={`/${locale}/projects/${slug}/explore`}
          >
            {projectNavigation(locale).explore}
            <ArrowUpRight size={18} />
          </Link>
        </div>
      </section>
      <section className="project-intro section">
        <p>{p.translations[locale].description}</p>
        {p.demo && <p className="demo-label">{d.demo}</p>}
        <Link
          className="button primary"
          href={`/${locale}/projects/${slug}/explore`}
        >
          {projectNavigation(locale).explore} ↗
        </Link>
      </section>
    </>
  );
}
