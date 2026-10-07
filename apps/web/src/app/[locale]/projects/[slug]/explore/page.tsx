import { notFound } from "next/navigation";
import { project } from "@/lib/api";
import { isLocale } from "@/lib/i18n";
import { metadata } from "@/lib/seo";
import { projectNavigation } from "@/lib/project-navigation";
import { ProjectOverview } from "@/components/ProjectOverview";
type Props = { params: Promise<{ locale: string; slug: string }> };
export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const p = await project(slug);
  if (!p) return {};
  return metadata(
    locale,
    `${p.translations[locale]?.title || p.translations.en.title} · ${projectNavigation(locale).explore}`,
    p.translations[locale]?.description || "",
    `/projects/${slug}/explore`,
  );
}
export default async function Page({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const p = await project(slug);
  if (!p) notFound();
  return <ProjectOverview project={p} locale={locale} />;
}
