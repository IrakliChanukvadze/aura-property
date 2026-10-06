import { notFound } from "next/navigation";
import { isLocale, t } from "@/lib/i18n";
import { metadata } from "@/lib/seo";
import { posts } from "@/lib/api";
import { PostCard } from "@/components/Cards";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : "en";
  return metadata(l, t(l).journal, t(l).journalTitle, "/blog");
}
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const list = await posts();
  const d = t(locale);
  return (
    <section className="section page-section">
      <p className="eyebrow">AURA / {d.journal}</p>
      <h1>{d.journalTitle}</h1>
      <div className="journal-grid">
        {list.map((p) => (
          <PostCard key={p.id} post={p} locale={locale} />
        ))}
      </div>
      {!list.length && <p className="notice">{d.noPosts}</p>}
    </section>
  );
}
