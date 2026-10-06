# Approved implementation architecture

TypeScript npm workspaces: Next.js public web (port 3000), React/Vite admin (5173), Node/Fastify API (4000), PostgreSQL/Prisma database (local 5434). Keep business rules in API/domain transactions, never in UI alone. Separate customer identity, purchase opportunity and apartment sale.

## Local and deployment boundary
Local Docker PostgreSQL uses isolated development credentials in compose.yaml. Production credentials must be supplied through environment/secrets, never copied from Pini. Cookie-authenticated admin requests require configured trusted origins and active-user checks. External email/OTP/translation/storage adapters must fail clearly if production configuration is absent; demo adapters must not run in production.

Cloudflare is approved for DNS/security and R2. Public website can run on a Node host behind Cloudflare initially; Cloudflare-native Next deployment is a separate compatibility gate, not assumed from a successful Next build. API plus background scheduler run as long-lived Node processes, PostgreSQL as a persistent managed/self-hosted service. Admin is a static Vite build served under a configured origin. No hosting purchase or live release yet.

## Cloudflare references inspected
- [Next.js deployment guidance](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/)
- [OpenNext adapter](https://developers.cloudflare.com/workers/framework-guides/web-apps/opennext/)
- [R2 presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/)
- [Hyperdrive PostgreSQL](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/)

These document supported deployment paths; final provider/version compatibility must be tested before release. Private agreements use authenticated download authorization, public marketing images may use public delivery. Do not serve contracts from the public media bucket.

## SEO acceptance
Public content server rendered; locale-prefixed URLs en/ka/ru/he; localized metadata and headings; canonical/hreflang; robots and sitemap exclude admin, drafts and private records; truthful schema.org data; optimized responsive images; clean project/blog slugs. No ranking guarantee or fabricated project facts. Hebrew RTL, keyboard exploration and reduced motion are required.
