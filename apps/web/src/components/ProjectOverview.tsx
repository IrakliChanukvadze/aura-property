import Link from "next/link";
import type { Project } from "@/lib/api";
import type { Locale } from "@/lib/i18n";
import { projectBlocks, projectNavigation } from "@/lib/project-navigation";
import styles from "./ProjectOverview.module.css";
export function ProjectOverview({
  project,
  locale,
}: {
  project: Project;
  locale: Locale;
}) {
  const copy = projectNavigation(locale);
  const blocks = projectBlocks(project);
  const href = (id: string) =>
    `/${locale}/projects/${project.slug}/explore/${encodeURIComponent(id)}`;
  return (
    <section className={`section ${styles.section}`}>
      <Link
        className={styles.back}
        href={`/${locale}/projects/${project.slug}`}
      >
        ← {copy.back}
      </Link>
      <div className="section-heading">
        <div>
          <p className="eyebrow">
            {project.city} /{" "}
            {project.translations[locale]?.title ||
              project.translations.en.title}
          </p>
          <h1>{copy.choose}</h1>
        </div>
      </div>
      <div className={styles.cover} data-depth data-reveal>
        <img
          src={project.coverImage}
          alt={
            project.translations[locale]?.title || project.translations.en.title
          }
        />
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-label={copy.choose}
        >
          {blocks
            .filter((block) => block.polygon.length >= 3)
            .map((block) => (
              <a key={block.id} href={href(block.id)} aria-label={block.name}>
                <title>{block.name}</title>
                <polygon
                  points={block.polygon
                    .map((point) => point.join(","))
                    .join(" ")}
                />
              </a>
            ))}
        </svg>
      </div>
      <nav className={styles.blocks} aria-label={copy.choose}>
        {blocks.map((block) => (
          <Link className="button" key={block.id} href={href(block.id)}>
            {block.name} ↗
          </Link>
        ))}
      </nav>
    </section>
  );
}
