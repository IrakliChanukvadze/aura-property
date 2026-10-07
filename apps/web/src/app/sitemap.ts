import type { MetadataRoute } from "next";
import { projects, posts } from "@/lib/api";
import { locales } from "@/lib/i18n";
import { origin } from "@/lib/seo";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [p, b] = await Promise.all([projects(), posts()]);
  const paths = [
    "",
    "/projects",
    "/about",
    "/contact",
    "/blog",
    ...p
      .filter((x) => !x.demo)
      .flatMap((x) => [
        `/projects/${x.slug}`,
        `/projects/${x.slug}/explore`,
        ...(x.metadata?.blocks?.length
          ? x.metadata.blocks.map((b) => `/projects/${x.slug}/explore/${b.id}`)
          : x.buildings.map((b) => `/projects/${x.slug}/explore/${b.id}`)),
      ]),
    ...b.map((x) => `/blog/${x.slug}`),
  ];
  return paths.flatMap((path) =>
    locales.map((locale) => ({
      url: `${origin}/${locale}${path}`,
      alternates: {
        languages: Object.fromEntries(
          locales.map((l) => [l, `${origin}/${l}${path}`]),
        ),
      },
    })),
  );
}
