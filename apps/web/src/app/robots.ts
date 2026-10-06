import type { MetadataRoute } from "next";
import { origin } from "@/lib/seo";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/admin/"] },
    sitemap: `${origin}/sitemap.xml`,
  };
}
