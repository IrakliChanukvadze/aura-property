# Initial production public-content transfer

## Brief and boundary

Prepare the owner's approved current Tbilisi Boulevard and public website/team content for the first Aura production launch. The local business database remains read-only. Never restore its full dump or run the development seed in production. No Pini access or writes are part of this transfer.

The transfer is an explicit allowlist: Project, Unit, approved published Post, public AgencySettings.siteContent, and only referenced non-customer Media. Raw Pini source metadata, user/team/auth records, CRM/customer records, agreements, sales/commissions, exchange rates, audit, hidden team profiles, draft posts, unreferenced uploads and minimum-price overrides are excluded. Three marketing team profiles do not create CRM users.

## Tool and guards

`scripts/public-content.mjs` runs on Node 22+ with the repository dependencies and generated Prisma client. It never logs credentials or source database URLs. Export uses a read-only repeatable-read transaction. Source/destination identity excludes the password when checking for accidental reuse. Explicit environment files avoid inheriting an unintended database from the shell.

Export is read-only by default; `--out` writes a new mode-0600 snapshot only under gitignored `.local`, refusing to overwrite a file. Articles default to none; a legitimate published article must be explicitly selected with `--post-slugs slug1,slug2`. The known seeded article `buying-in-georgia`, demo/test/qa slugs, incomplete translations and drafts are rejected. The seeded article must be replaced with reviewed editorial content separately, not carried into production.

Import defaults to dry-run. Applying requires `--apply --confirm-empty-database EXACT_DB_NAME`, a different database from the source, and **every Aura table empty** (Prisma's migration history is allowed). Run after migrations and before `owner:init`, while the production API is stopped. An exclusive table lock and one serializable transaction prevent partial imports and competing content/account creation. A repeat run refuses to overwrite existing content. Stable project, building, floor, block and unit IDs survive unchanged.

All referenced static assets are SHA-256/size checked against `apps/web/public`, including symlink/path containment. Media references must resolve to non-agreement records with no lead association. Export records their source file hashes without copying the original owner ID. A future referenced uploaded image must be copied to the configured **private R2 bucket** at the exact manifest path, then import verifies its content type, size and full downloaded SHA-256 before writing any database records. This tool performs no R2 upload. There are currently **zero referenced uploaded files**, so no R2 migration is needed for this snapshot. The three unused local uploads are excluded.

`Media.ownerId` is a scalar without a User foreign key. If referenced media is added before launch, import sets it to `public-content-migration`, a non-login provenance label. Media publication still requires its URL to be referenced by published content. No migration user/session/token is created.

## Commands

Run from the Aura repository, without printing environment contents:

```sh
# Read-only report; no snapshot and no database writes.
node scripts/public-content.mjs export --source-env .env

# Private content-only artifact. Use a fresh output filename for each run.
node scripts/public-content.mjs export --source-env .env --out .local/production-launch/public-content-2026-10-08.json

# Transfer this ignored file through the authorized secure deployment channel.
# On the destination release checkout/container, after migrations, before API/owner:
node scripts/public-content.mjs import --destination-env /secure/aura.env --input /secure/public-content.json
node scripts/public-content.mjs import --destination-env /secure/aura.env --input /secure/public-content.json --apply --confirm-empty-database aura_production
```

The destination env must point to the new database, not the local source. Actual database name must replace `aura_production`. Provide `--public-dir /app/apps/web/public` if runtime file layout differs. Do not run `owner:init` before import. Default export upload directory is `apps/api/.data/uploads`; override `--upload-dir` only when the actual local storage path differs.

## Verified snapshot (2026-10-08)

Private artifact: `.local/production-launch/public-content-2026-10-08.json` (not committed).

- Tbilisi Boulevard: 4 buildings, 27 floors, 382 units.
- Unit statuses: 188 available, 14 reserved, 180 sold.
- 3 visible marketing team profiles; no CRM users copied.
- 0 legitimate articles selected: one seeded published article and two test drafts excluded.
- 34 referenced repo images; 97,523,005 bytes; hashes verified. Mock team images remain intentionally temporary as requested by the owner.
- 0 referenced uploaded Media records; all 3 unused local uploads excluded.
- No minimum-price overrides existed in the source.

## Content limitations to resolve or acknowledge before launch

- Project Hebrew remains explicitly `reviewed: false`, `fallbackLocale: en`; English fallback is preserved and is not presented as an approved Hebrew translation.
- 97 available apartments lack a known price; 14 lack an apartment polygon. Existing missing-data/inquiry behavior is preserved. No prices, areas or polygons are fabricated.
- Site settings contain only the three team profiles. Website copy is currently the repository's localized default content; no newer local CMS hero/about/contact overrides exist to copy.
- The illustrative local USD/GEL rate is deliberately excluded. Set a verified exchange rate in production; do not copy the seeded 2.7 rate.
- Final contact/privacy copy and genuine photos are editorial follow-ups outside this migration.

## Evidence

Focused tests exercise explicit field exclusion, hidden profile omission, preserved IDs/geometry/locale review state, malicious extra fields, orphan/duplicate inventory, unreferenced assets, demo-article rejection, altered files/symlink escapes, same-database and confirmation guards, and nonempty auth/CRM table refusal. A fresh isolated PostgreSQL database is migrated and used for the real import test; it is deleted after verification. The test checks a dry-run writes nothing, an injected mid-import error rolls back Project/Unit writes, successful import creates no users/customers/leads/sales/tokens, and a repeated import refuses overwrite. The source business database is not changed.

Fast checks: `node --test scripts/public-content.test.mjs` (database test skips without explicit disposable DB). Real integration requires `PUBLIC_CONTENT_TEST_DATABASE_URL` whose database name matches `aura_public_content_test_*`, migrated and empty. Use a fresh throwaway database, never `aura` or the shared API test database.

No production database write, media upload, remote change or commit has been performed by this preparation slice.
