import type { Locale } from "./i18n";
export interface Translation {
  title: string;
  description?: string;
  body?: string;
}
export interface Unit {
  id: string;
  number: string;
  area: number;
  bedrooms: number;
  polygon: number[][];
  status: "AVAILABLE" | "RESERVED" | "SOLD";
  price: number;
  priceCurrency: "USD" | "GEL";
  priceMode: "TOTAL" | "PER_M2";
  showPrice: boolean;
}
export interface Floor {
  id: string;
  number: number;
  polygon: number[][];
  image: string;
  units: Unit[];
}
export interface Project {
  id: string;
  slug: string;
  city: string;
  coverImage: string;
  constructionStatus: "ONGOING" | "COMPLETED";
  translations: Record<Locale, Translation>;
  buildings: {
    id: string;
    name: string;
    coverImage: string;
    floors: Floor[];
  }[];
  soldOut: boolean;
  allReserved: boolean;
  startingPrice: number | Unit | null;
  startingPriceCurrency?: "USD" | "GEL";
  demo?: boolean;
}
export interface Post {
  id: string;
  slug: string;
  coverImage?: string;
  publishedAt: string;
  translations: Record<Locale, Translation>;
  demo?: boolean;
}
export const apiBase =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
export const imageCity = "/images/hero-cityscape.webp";
export const imageBuilding = "/images/complex-preview.webp";
const all = (title: string, description: string): Record<Locale, Translation> =>
  Object.fromEntries(
    ["en", "ka", "ru", "he"].map((l) => [l, { title, description }]),
  ) as Record<Locale, Translation>;
export const demoProjects: Project[] = [
  "The City Collection",
  "Black Sea Living",
  "Garden Residences",
].map((title, i) => ({
  id: `preview-${i}`,
  slug: ["city-collection", "black-sea-living", "garden-residences"][i],
  city: i === 1 ? "Batumi" : "Tbilisi",
  coverImage: [imageBuilding, imageBuilding, imageBuilding][i],
  constructionStatus: i === 2 ? "COMPLETED" : "ONGOING",
  translations: all(
    title,
    "An illustrative residential collection exploring space, light and thoughtful living. Preview content only.",
  ),
  demo: true,
  soldOut: false,
  allReserved: false,
  startingPrice: 98000 + i * 15000,
  buildings: [
    {
      id: `building-${i}`,
      name: "Building A",
      coverImage: imageBuilding,
      floors: [2, 3, 4, 5].map((n) => ({
        id: `floor-${i}-${n}`,
        number: n,
        image: "/preview-plan.svg",
        polygon: [
          [12, 80 - n * 10],
          [88, 80 - n * 10],
          [88, 87 - n * 10],
          [12, 87 - n * 10],
        ],
        units: [0, 1, 2, 3].map((u) => ({
          id: `unit-${i}-${n}-${u}`,
          number: `${n}0${u + 1}`,
          area: 54 + u * 14,
          bedrooms: u < 2 ? 1 : 2,
          status: u === 2 ? "RESERVED" : u === 3 ? "SOLD" : "AVAILABLE",
          price: 98000 + i * 15000 + n * 2000 + u * 12000,
          priceCurrency: "USD",
          priceMode: "TOTAL",
          showPrice: true,
          polygon:
            u === 0
              ? [
                  [4, 8],
                  [45, 8],
                  [45, 43],
                  [4, 43],
                ]
              : u === 1
                ? [
                    [55, 8],
                    [96, 8],
                    [96, 43],
                    [55, 43],
                  ]
                : u === 2
                  ? [
                      [4, 57],
                      [45, 57],
                      [45, 92],
                      [4, 92],
                    ]
                  : [
                      [55, 57],
                      [96, 57],
                      [96, 92],
                      [55, 92],
                    ],
        })),
      })),
    },
  ],
}));
async function get<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(`${apiBase}/public/${path}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (
      response.status === 404 &&
      (path.startsWith("projects/") || path.startsWith("posts/"))
    )
      return fallback;
    if (!response.ok) {
      if (process.env.NODE_ENV === "production")
        throw new Error("Public inventory service is unavailable");
      return fallback;
    }
    const result = await response.json();
    const normalize = (value: unknown): unknown => {
      if (typeof value === "string" && value.startsWith("/api/public/media/"))
        return apiBase.replace(/\/api\/?$/, "") + value;
      if (Array.isArray(value)) return value.map(normalize);
      if (value && typeof value === "object")
        return Object.fromEntries(
          Object.entries(value).map(([key, item]) => [key, normalize(item)]),
        );
      return value;
    };
    return normalize(result.data) as T;
  } catch (e) {
    if (process.env.NODE_ENV === "production") throw e;
    return fallback;
  }
}
export const projects = () =>
  get<Project[]>(
    "projects",
    process.env.NODE_ENV === "production" ? [] : demoProjects,
  );
export async function project(slug: string) {
  return get<Project | null>(
    `projects/${encodeURIComponent(slug)}`,
    process.env.NODE_ENV === "production"
      ? null
      : demoProjects.find((p) => p.slug === slug) || null,
  );
}
export const posts = () => get<Post[]>("posts", []);
export const post = (slug: string) =>
  get<Post | null>(`posts/${encodeURIComponent(slug)}`, null);
export const totalPrice = (u: Unit) =>
  u.priceMode === "PER_M2" ? u.price * u.area : u.price;
export const money = (amount: number, currency: string, locale: Locale) =>
  new Intl.NumberFormat(
    locale === "ka" ? "ka-GE" : locale === "he" ? "he-IL" : locale,
    { style: "currency", currency, maximumFractionDigits: 0 },
  ).format(amount);

export interface TeamMember {
  id: string;
  name: string;
  publicData: {
    role?: string;
    title?: string;
    photo?: string;
    phone?: string;
    whatsapp?: string;
    bio?: string;
  };
}
export const publicTeam = () => get<TeamMember[]>("team", []);
export const exchangeRate = () =>
  get<{ usdGel: number; date: string; source: string } | null>(
    "exchange-rate",
    null,
  );

export interface SiteContent {
  phone?: string;
  whatsapp?: string;
  email?: string;
  heroImage?: string;
  heroVariant?: "cityscape" | "collage";
  translations?: Partial<Record<Locale, Record<string, string>>>;
}
export const publicSite = () => get<SiteContent>("site", {});
