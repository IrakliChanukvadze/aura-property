import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight } from "lucide-react";
import { money, totalPrice, type Project, type Post } from "@/lib/api";
import { cinematicCopy } from "@/lib/cinematic-copy";
import { t, type Locale } from "@/lib/i18n";
import styles from "./CinematicHome.module.css";

interface Props {
  locale: Locale;
  copy: ReturnType<typeof t>;
  collection: Project[];
  articles: Post[];
  heroImage: string;
  heroDescription: string;
  agencyTitle?: string;
  collage: boolean;
}

function priceLabel(project: Project, locale: Locale, d: ReturnType<typeof t>) {
  if (project.soldOut) return d.soldOut;
  if (project.allReserved) return d.reservedAll;
  if (!project.startingPrice) return d.inquire;
  const price = project.startingPrice;
  return `${d.from} ${money(
    typeof price === "number" ? price : totalPrice(price),
    typeof price === "number"
      ? project.startingPriceCurrency || "USD"
      : price.priceCurrency,
    locale,
  )}`;
}

export function CinematicHome({
  locale,
  copy: d,
  collection,
  articles,
  heroImage,
  heroDescription,
  agencyTitle,
  collage,
}: Props) {
  const c = cinematicCopy[locale];
  const featured = collection[0];
  const title = (project: Project) =>
    project.translations[locale]?.title || project.translations.en.title;
  const description =
    featured?.translations[locale]?.description ||
    featured?.translations.en.description;
  const chapters = [
    { id: "home", label: c.welcome },
    { id: "collection", label: d.collectionLabel },
    { id: "agency", label: d.about },
    {
      id: articles.length ? "journal" : "conversation",
      label: articles.length ? d.journal : d.contact,
    },
  ];

  return (
    <div className={styles.home} lang={locale}>
      <nav className={styles.chapters} aria-label={c.navigation}>
        {chapters.map((chapter, index) => (
          <a
            key={chapter.id}
            href={`#${chapter.id}`}
            aria-label={chapter.label}
            data-chapter-link={chapter.id}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
          </a>
        ))}
      </nav>

      <section
        id="home"
        data-chapter
        data-parallax="hero"
        data-speed="0.2"
        data-depth
        className={`${styles.hero} ${collage ? styles.collage : ""}`}
        aria-labelledby="home-title"
      >
        <div className={styles.heroMedia} aria-hidden="true">
          <img
            src={heroImage}
            alt=""
            fetchPriority="high"
            className={styles.cityImage}
          />
          {collage && featured && (
            <img
              src={featured.coverImage}
              alt=""
              className={styles.collageImage}
            />
          )}
        </div>
        <div className={styles.heroShade} />
        <div className={styles.sunlight} aria-hidden="true" />
        <img
          src="/images/cinematic/foreground.png"
          alt=""
          aria-hidden="true"
          className={styles.foreground}
        />
        <div className={styles.heroContent}>
          <p className={styles.heroEyebrow}>{d.heroEyebrow}</p>
          <h1 id="home-title" className={styles.heroTitle}>
            {d.hero.split("\n").map((line, index) => (
              <span className={styles.titleLine} key={`${line}-${index}`}>
                <span style={{ animationDelay: `${index * 130 + 170}ms` }}>
                  {line}
                </span>
              </span>
            ))}
          </h1>
          <p className={styles.heroDescription}>{heroDescription}</p>
          <a className={styles.heroCta} href="#collection">
            <span>{c.exploreCollection}</span>
            <ArrowRight size={20} strokeWidth={1.3} />
          </a>
        </div>
        <div className={styles.heroBottom}>
          <a
            href="#collection"
            aria-label={d.scrollCollection}
            className={styles.scrollCue}
          >
            <span />
            <ArrowDown size={16} />
          </a>
          <span>{c.location}</span>
        </div>
      </section>

      <section
        id="collection"
        data-chapter
        className={styles.collection}
        aria-labelledby="collection-title"
      >
        <div className={styles.collectionHeader} data-reveal>
          <h2 id="collection-title" className={styles.sectionKicker}>
            <span />
            {d.collectionLabel}
          </h2>
          <p>
            {c.collectionIntro}
            <br />
            {c.collectionSubline}
          </p>
        </div>
        {collection.some((p) => p.demo) && (
          <p className={styles.notice}>{d.demo}</p>
        )}
        {featured ? (
          <article className={styles.featured}>
            <Link
              href={`/${locale}/projects/${featured.slug}`}
              className={styles.panorama}
              data-expand
              data-parallax
              data-speed="0.07"
              aria-label={`${d.discover}: ${title(featured)}`}
            >
              <img
                src={featured.coverImage}
                alt={title(featured)}
                loading="lazy"
              />
              <span className={styles.panoramaArrow} aria-hidden="true">
                <ArrowUpRight size={32} strokeWidth={1} />
              </span>
              <span className={styles.imageStatus}>
                {featured.constructionStatus === "COMPLETED"
                  ? d.completed
                  : d.ongoing}
              </span>
            </Link>
            <div className={styles.projectDetails} data-reveal>
              <span className={styles.projectNumber} aria-hidden="true">
                01 <i />
              </span>
              <div className={styles.projectCopy}>
                <h3>
                  <Link href={`/${locale}/projects/${featured.slug}`}>
                    {title(featured)}
                  </Link>
                </h3>
                <div className={styles.projectMeta}>
                  <span>{featured.city}</span>
                  <span>{priceLabel(featured, locale, d)}</span>
                </div>
                {description && (
                  <p className={styles.projectDescription}>{description}</p>
                )}
              </div>
              <Link
                href={`/${locale}/projects/${featured.slug}`}
                className={styles.projectCta}
              >
                <span>{d.discover}</span>
                <ArrowRight size={21} strokeWidth={1.3} />
              </Link>
            </div>
          </article>
        ) : (
          <p className={styles.notice}>{d.noProjects}</p>
        )}
        {collection.length > 1 && (
          <div className={styles.moreProjects}>
            {collection.slice(1, 5).map((project, index) => (
              <Link
                key={project.id}
                href={`/${locale}/projects/${project.slug}`}
                className={styles.projectRow}
                data-reveal
              >
                <span className={styles.rowNumber}>
                  {String(index + 2).padStart(2, "0")}
                </span>
                <img src={project.coverImage} alt="" loading="lazy" />
                <div>
                  <h3>{title(project)}</h3>
                  <p>
                    {project.city} · {priceLabel(project, locale, d)}
                  </p>
                </div>
                <ArrowUpRight size={28} strokeWidth={1} />
              </Link>
            ))}
            <Link
              href={`/${locale}/projects`}
              className={styles.underlinedLink}
            >
              {d.viewAll}
              <ArrowRight size={19} />
            </Link>
          </div>
        )}
      </section>

      <section
        id="agency"
        data-chapter
        className={styles.agency}
        aria-labelledby="agency-title"
      >
        <div className={styles.agencyImage} data-parallax data-speed="0.06">
          <img
            src="/images/cinematic/agency-portrait.webp"
            alt={c.agencyImage}
            loading="lazy"
          />
        </div>
        <div className={styles.agencyCopy}>
          <div data-reveal>
            <p className={styles.eyebrow}>{d.about}</p>
            <h2 id="agency-title">{agencyTitle || c.agencyTitle}</h2>
            <p className={styles.agencyBody}>{d.agencyBody}</p>
            <Link href={`/${locale}/about`} className={styles.underlinedLink}>
              {c.agencyLink}
              <ArrowRight size={19} strokeWidth={1.3} />
            </Link>
          </div>
          <span className={styles.agencyNote}>{c.together}</span>
          <img
            src="/images/cinematic/foreground.png"
            alt=""
            aria-hidden="true"
            className={styles.agencyFoliage}
            loading="lazy"
          />
        </div>
      </section>

      <section className={styles.services} aria-labelledby="approach-title">
        <h2 id="approach-title" className={styles.sectionKicker} data-reveal>
          <span />
          {c.approach}
        </h2>
        <div className={styles.servicesGrid}>
          {[
            [d.service1, d.service1Body],
            [d.service2, d.service2Body],
            [d.service3, d.service3Body],
          ].map(([heading, body], index) => (
            <article key={heading} data-reveal>
              <span>0{index + 1}</span>
              <h3>{heading}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      {articles.length > 0 && (
        <section
          id="journal"
          data-chapter
          className={styles.journal}
          aria-labelledby="journal-title"
        >
          <div className={styles.journalHeader} data-reveal>
            <h2 id="journal-title" className={styles.sectionKicker}>
              <span />
              {d.journal}
            </h2>
            <Link href={`/${locale}/blog`} className={styles.journalAll}>
              {d.journalTitle}
              <ArrowRight size={20} strokeWidth={1.3} />
            </Link>
          </div>
          <div className={styles.journalGrid}>
            {articles.slice(0, 3).map((post) => (
              <article key={post.id} className={styles.journalCard} data-reveal>
                <Link href={`/${locale}/blog/${post.slug}`}>
                  {post.coverImage && (
                    <div className={styles.journalImage}>
                      <img src={post.coverImage} alt="" loading="lazy" />
                    </div>
                  )}
                  <time dateTime={post.publishedAt}>
                    {new Intl.DateTimeFormat(
                      locale === "ka"
                        ? "ka-GE"
                        : locale === "he"
                          ? "he-IL"
                          : locale,
                      { month: "long", day: "numeric", year: "numeric" },
                    ).format(new Date(post.publishedAt))}
                  </time>
                  <h3>
                    {post.translations[locale]?.title ||
                      post.translations.en.title}
                  </h3>
                  <span className={styles.journalRead}>
                    {d.read}
                    <ArrowUpRight size={18} />
                  </span>
                </Link>
              </article>
            ))}
          </div>
        </section>
      )}

      <section
        id="conversation"
        data-chapter
        className={styles.conversation}
        aria-labelledby="conversation-title"
      >
        <p className={styles.eyebrow} data-reveal>
          {d.letsTalk}
        </p>
        <h2 id="conversation-title" data-reveal>
          {d.contactTitle}
        </h2>
        <p className={styles.conversationBody} data-reveal>
          {d.contactBody}
        </p>
        <Link
          href={`/${locale}/contact`}
          className={styles.conversationCta}
          data-reveal
        >
          <span>{d.contact}</span>
          <ArrowUpRight size={29} strokeWidth={1.1} />
        </Link>
      </section>
    </div>
  );
}
