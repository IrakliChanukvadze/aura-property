# Marketing website implementation for owner review

8 October 2026. The owner explicitly requested implementation of the suggested website improvements on separate branches. This supersedes the research-only restriction for this bounded slice and authorizes Pini frontend edits despite Aura's source-reference boundary. No push, merge, deployment or external-account changes.

## Scope

Both frontend repositories use local branch `codex/marketing-website-improvements`. Aura retains D-231 cinematic homepage and D-232 explorer decisions. Add factual agency clarity, understandable buying-support steps and existing project/advisor contact links, in ka/ru/he/en. Pini retains map-first Projects/Houses/Land; improve category clarity, empty-result recovery and listing price/cover presentation where actual source data supports it.

## Non-goals

No Premium price/offer selection, new paid service, invented advisors/testimonials/inventory, project data mutation, CRM changes, house/land fee assumption, standalone flat listings, cross-brand private data routing or broad replacement design. Existing Pini `design-qa.md` is unrelated and must remain untouched.

## Acceptance and verification

Review implementation diffs independently. Run frontend type checks and relevant existing map tests. Check existing local previews on desktop, mobile and keyboard; Aura Hebrew RTL. Preserve actual inquiry paths and motion accessibility. Record exact changed files, reasons, results and limitations below before handoff. Existing dev servers on ports 3000/3100/4000 must not be disrupted by a concurrent production build.

## Status

Implemented locally. Neither merged nor deployed.

## What changed and why

Aura: three homepage/copy/style files add a factual agency-role line, secondary team-contact action, project exploration guidance, a collection link even with one project, and actionable links for the existing buying-support steps. Four locale strings and responsive/focus/RTL styling keep the longer cinematic sequence intact. No staff profiles or testimonials were fabricated.

Pini: visible category controls, mobile map-first default with list toggle, category-preserving empty-state recovery, exact house/land currency totals, honest project-price fallback, failed-cover placeholder and localized project hover inventory text. The current map feed omits project currency, so cards/hover say See project prices instead of guessing USD. Backend data was not changed. Mobile filter wrapping drove two extra fixes: measured header height positions cadastral controls; attribution begins collapsed through its own toggle; the list switch reserves chat space.

## Independent verification

- Orchestrator ran Aura web typecheck and Pini type-check successfully; Pini's existing map suite passed all 49 tests. Implementer also ran targeted Pini ESLint. Both diffs pass whitespace checks.
- Independent specialist source review found no blocking regression; report saved beside this file. Its potential narrow-screen overlap was confirmed in the browser and repaired before handoff.
- Local browser: Aura English desktop hero and collection/process links inspected; Hebrew 390×844 RTL had no horizontal overflow, and team CTA keyboard activation reached the Hebrew contact page. Contact form was not submitted.
- Pini: desktop category controls and Land empty recovery tested. Removing price limits retained `propertyType=land`. At 390px map/list switching retained the category/query and had no horizontal overflow. At 320×740 Russian, wrapped filters no longer overlap cadastral control, list toggle no longer overlaps chat, and Enter activates map/list switch. Mobile map tiles rendered; attribution stays available through compact control.
- Screenshots: `marketing-web-evidence/aura-desktop.jpg` and `pini-mobile.jpg`. Review is scoped, not exhaustive browser coverage.

## Limits and remaining choices

No production build was run against active development servers. Pini local feed returned no records, so live populated card/hover appearance and house/project detail journeys remain unverified visually; source/type checks cover those changes but are not a substitute for populated-data QA. Existing feed hooks collapse failures into empty results; that pre-existing limitation remains. Project currency requires a later public API contract fix before showing map starting amounts. Native language review of new copy remains needed before release.

These changes implement the shared clarity/map foundation, not every alternative business/design plan simultaneously. Exact Premium offer, house/land pricing, new fact-history schema and result/group identity remain product choices; no invented data was added to simulate them. Pini's pre-existing untracked `design-qa.md` was untouched. No push, merge, deploy or external account action.
