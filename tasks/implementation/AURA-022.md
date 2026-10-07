# AURA-022 — Cinematic public website

## Brief and approved direction
Owner selected the first displayed cinematic homepage concept on 2026-10-07 and requested richer scroll animations. Refined reference: docs/design/references/cinematic-home-selected.png. Earlier request permits a longer homepage; keep the separate project / overview / block exploration routes and current business rules.

## Plan
1. Preserve server-rendered localized content, actual inventory, CMS overrides and existing hero alternatives.
2. Match photo-led hero, wide project panorama and asymmetric agency section. Generate separate decorative foliage and illustrative lifestyle portrait; never substitute generated architecture for inventory.
3. Add native-scroll parallax, image expansion, chapter links, progressive reveals and pointer depth; layer the same visual language onto project entry and collection cards.
4. Verify desktop, mobile, dark/light, Hebrew RTL, keyboard, reduced motion, routes, filters and exact polygon interactions. Compare rendered screenshots against selected concept. Run typecheck/build; independent review; commit ticket.

## Boundaries
No scroll hijacking, mandatory loading screen, public registration, invented project facts, production deployment or CRM changes. Reduced-motion preference disables decorative motion. Missing JavaScript never hides primary content. Pointer depth runs only on fine pointers; floor-plan targets remain stationary. Asset generation is illustrative lifestyle/decorative only.

## Research
- https://videinfra.com/work/era — layered real-estate imagery and spatial transitions.
- https://vintage.agency/portfolio/view/sergey-makhno-architect — architecture as an editorial narrative.

## Evidence
Implemented and locally verified on 2026-10-07.

- Server-rendered CinematicHome and four-language cinematic copy preserve CMS overrides and the existing alternate hero setting.
- MotionSystem provides native-scroll parallax, project image expansion, progressive reveals, active chapter links, reading progress and fine-pointer depth. Project cards and project entry inherit the motion language; apartment geometry remains stationary.
- Generated decorative foliage and illustrative lifestyle portrait are local assets under apps/web/public/images/cinematic. Actual project media is unchanged.
- Independent review found and resolved panorama keyboard-focus clipping and the chapter highlight selector mismatch.
- Typecheck and production web build passed. Browser verified desktop, mobile, light/dark, Hebrew RTL, language switch, keyboard focus, complete project-to-apartment flow and empty console error logs.
- Screenshot comparisons and detailed limitations: root design-qa.md; evidence under docs/design/qa/cinematic-*.jpg.
- Reduced-motion behavior was code-reviewed, not browser-emulated. No new dependency, backend change or production deployment.
- Development preview restarted at http://localhost:3100/en.
