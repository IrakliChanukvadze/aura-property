import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { t, type Locale } from "@/lib/i18n";
import { money, totalPrice, type Project, type Post } from "@/lib/api";
export function ProjectCard({
  project: p,
  locale,
  index = 0,
}: {
  project: Project;
  locale: Locale;
  index?: number;
}) {
  const d = t(locale);
  return (
    <Link
      href={`/${locale}/projects/${p.slug}`}
      className="project-card"
      data-depth
      data-reveal
    >
      <div className="project-image">
        <img
          src={p.coverImage}
          alt={p.translations[locale]?.title || p.translations.en.title}
          loading="lazy"
        />
        <span className="project-status">
          {p.constructionStatus === "COMPLETED" ? d.completed : d.ongoing}
        </span>
        <span className="card-arrow">
          <ArrowUpRight size={22} />
        </span>
      </div>
      <div className="card-meta">
        <span>{p.city}</span>
        <span>0{index + 1}</span>
      </div>
      <h3>{p.translations[locale]?.title || p.translations.en.title}</h3>
      <p>
        {p.soldOut
          ? d.soldOut
          : p.allReserved
            ? d.reservedAll
            : p.startingPrice
              ? `${d.from} ${money(typeof p.startingPrice === "number" ? p.startingPrice : totalPrice(p.startingPrice), typeof p.startingPrice === "number" ? p.startingPriceCurrency || "USD" : p.startingPrice.priceCurrency, locale)}`
              : d.inquire}
      </p>
    </Link>
  );
}
export function PostCard({ post: p, locale }: { post: Post; locale: Locale }) {
  return (
    <Link className="post-card" href={`/${locale}/blog/${p.slug}`}>
      {p.coverImage && <img src={p.coverImage} alt="" loading="lazy" />}
      <time>{new Date(p.publishedAt).toLocaleDateString(locale)}</time>
      <h3>{p.translations[locale]?.title || p.translations.en.title}</h3>
      <span>
        {t(locale).read} <ArrowUpRight size={16} />
      </span>
    </Link>
  );
}
