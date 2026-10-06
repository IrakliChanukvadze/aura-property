import Link from "next/link";
import {
  ArrowUpRight,
  ArrowDown,
  Compass,
  Layers,
  Handshake,
} from "lucide-react";
import { projects, posts, imageCity } from "@/lib/api";
import { isLocale, t, type Locale } from "@/lib/i18n";
import { ProjectCard, PostCard } from "@/components/Cards";
import { metadata, origin } from "@/lib/seo";
import { notFound } from "next/navigation";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return metadata(
    isLocale(locale) ? locale : "en",
    "Residential developments in Georgia",
    t(isLocale(locale) ? locale : "en").heroBody,
  );
}
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const d = t(locale);
  const [collection, articles] = await Promise.all([projects(), posts()]);
  const collage = process.env.NEXT_PUBLIC_HERO_VARIANT === "collage";
  return (
    <>
      <section className={`hero ${collage ? "collage" : ""}`}>
        <div className="hero-image">
          <img
            src={imageCity}
            alt="Illustrative Georgian city architecture"
            fetchPriority="high"
          />
          {collage && collection[0] && (
            <img
              className="collage-image"
              src={collection[0].coverImage}
              alt={collection[0].translations[locale].title}
            />
          )}
        </div>
        <div className="hero-shade" />
        <div className="hero-content">
          <p className="eyebrow">{d.heroEyebrow}</p>
          <h1>
            {d.hero.split("\n").map((line, i) => (
              <span key={line}>
                {line}
                {i === 0 && <br />}
              </span>
            ))}
          </h1>
          <p className="hero-description">{d.heroBody}</p>
          <Link className="button hero-button" href={`/${locale}/projects`}>
            {d.explore}
            <ArrowUpRight size={19} />
          </Link>
        </div>
        <div className="hero-bottom">
          <span>TBILISI · BATUMI · GEORGIA</span>
          <a href="#collection" aria-label={d.scrollCollection}>
            <ArrowDown size={18} />
          </a>
          <span>{d.residentialCollection}</span>
        </div>
      </section>
      <section className="section" id="collection">
        <div className="section-heading">
          <div>
            <p className="eyebrow">01 / {d.collectionLabel}</p>
            <h2>{d.collection}</h2>
            <p className="section-description">{d.collectionBody}</p>
          </div>
          <Link href={`/${locale}/projects`} className="text-link">
            {d.viewAll}
            <ArrowUpRight size={18} />
          </Link>
        </div>
        {collection.some((p) => p.demo) && (
          <p className="demo-label">{d.demo}</p>
        )}
        <div className="projects-grid">
          {collection.slice(0, 3).map((p, i) => (
            <ProjectCard key={p.id} project={p} locale={locale} index={i} />
          ))}
        </div>
        {collection.length === 0 && <p className="notice">{d.noProjects}</p>}
      </section>
      <section className="agency-section section">
        <div>
          <p className="eyebrow">02 / {d.agencyEyebrow}</p>
          <h2>{d.agencyTitle}</h2>
        </div>
        <div className="agency-copy">
          <p>{d.agencyBody}</p>
          <Link className="text-link" href={`/${locale}/about`}>
            {d.learn}
            <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="services">
          {[
            [Compass, d.service1, d.service1Body],
            [Layers, d.service2, d.service2Body],
            [Handshake, d.service3, d.service3Body],
          ].map(([Icon, title, body], i) => {
            const C = Icon as typeof Compass;
            return (
              <article key={i}>
                <C size={26} strokeWidth={1} />
                <h3>{String(title)}</h3>
                <p>{String(body)}</p>
              </article>
            );
          })}
        </div>
      </section>
      {articles.length > 0 && (
        <section className="section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">03 / {d.journal}</p>
              <h2>{d.journalTitle}</h2>
            </div>
            <Link className="text-link" href={`/${locale}/blog`}>
              {d.journal}
              <ArrowUpRight size={18} />
            </Link>
          </div>
          <div className="journal-grid">
            {articles.slice(0, 3).map((p) => (
              <PostCard key={p.id} post={p} locale={locale} />
            ))}
          </div>
        </section>
      )}
      <section className="contact-banner">
        <p className="eyebrow">{d.letsTalk}</p>
        <h2>{d.contactTitle}</h2>
        <p>{d.contactBody}</p>
        <Link className="button primary" href={`/${locale}/contact`}>
          {d.contact}
          <ArrowUpRight size={19} />
        </Link>
      </section>
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
