# Cinematic homepage design QA — AURA-022

final result: passed

## Reference and rendered evidence

- Selected direction: docs/design/references/cinematic-home-selected.png, 1015×1549 source pixels. Owner selected the first cinematic concept and asked to develop it further with scroll animation.
- Desktop viewport: 1440×900 CSS pixels, density 1, English, dark mode. Final hero: docs/design/qa/cinematic-desktop.jpg. Full document: cinematic-full.jpg, 1440×3540 pixels.
- Combined full comparison: docs/design/qa/cinematic-comparison.jpg. Source on left, implementation on right; each normalized to 720 pixels wide while retaining proportions. Opened and visually reviewed after final CSS fixes.
- Focused hero comparison: cinematic-hero-comparison.jpg; source crop covers the hero, implementation uses the settled first viewport. Opened and reviewed. The responsive implementation uses a full viewport hero rather than the reference's shorter static hero.
- Collection screenshot: cinematic-collection.jpg, at the collection anchor with the image expanded. The full document screenshot records one scroll state; offscreen parallax/expansion transforms are not a static layout specification.
- Mobile evidence: cinematic-mobile-dark.jpg, cinematic-mobile-light.jpg and cinematic-mobile-he.jpg, 390×844. Dark mobile capture predates the final foliage overscan and support-copy size refinements; light/Hebrew captures follow those refinements.
- Prior explorer QA is preserved in docs/design/qa/explorer-design-qa.md.

## Required fidelity surfaces

1. Typography: large two-line serif hero, restrained sans-serif supporting copy, numbered editorial project title, asymmetric agency heading. Georgian/Russian sizing and Hebrew RTL have dedicated responsive treatment.
2. Spacing/layout: transparent overlay header; full viewport image hero; wide project panorama; agency portrait/copy split. Existing services, CMS journal and contact content continue below the reference composition. Mobile stacks without horizontal overflow.
3. Color: evergreen, ivory and warm gold follow the selected direction. Light mode uses ivory surfaces with dark green type. Contrast overlays remain behind hero copy and controls.
4. Images: original approved cityscape retained, with a separate generated transparent foliage layer and illustrative lifestyle portrait. Real Boulevard cover, apartment plans and polygon coordinates remain authoritative. The lifestyle portrait does not represent a named team member.
5. Content: actual localized CMS project title, construction status, price and description replace reference sample copy. The current journal contains one seed post without a cover; no fake articles or inventory were introduced to resemble the mockup.

## Findings and fixes

- Header contact text wrapped at desktop width: increased minimum width and prevented wrapping.
- Foliage lower edge could become visible during parallax: added bottom overscan; checked final hero and collection transition.
- Supporting project/service/agency copy too small: increased to 14–15px with comfortable line height.
- Expanding image could clip an external keyboard outline: added a 3px inset focus ring and removed clipping while focused. Browser Tab check confirmed the focused project link, computed outline and clip-path:none.
- Chapter indicator selector disagreed with aria-current=location: corrected the CSS selector and initial fallback. Independent review also checked motion cleanup, CMS overrides and localization.
- No outstanding P0/P1/P2 visual or interaction findings in this scope. Photo crop, real project geometry, CMS journal population and longer content are intentional differences from the generated concept.

## Verified interactions

- Hero collection link uses native scrolling; chapter state and scroll CSS variables update. All below-fold content becomes visible. Document width equals the desktop and mobile viewport widths.
- Mobile menu, dark/light toggle and Hebrew RTL checked. Language switch from Hebrew to Georgian navigated successfully after waiting for the Next route transition.
- New homepage project link → project hero Explore project → whole-complex overview → Block E SVG polygon → floor 4 → Available only → A401 polygon → correct apartment dialog and URL.
- No browser console errors in homepage or project-flow checks.
- Typecheck: npm run typecheck -w @aura/web passed. Production build: npm run build -w @aura/web passed; all existing project/explorer routes remain available. Local development services restarted afterward.

## Motion and limitations

Native scrolling, event-driven requestAnimationFrame updates, one-time intersection reveals, pointer depth limited to fine pointers, and observer/listener cleanup were code-reviewed. Primary content is server-rendered and visible before JavaScript enhancement. Reduced-motion CSS and preference handling were code-reviewed; OS-level reduced-motion emulation was unavailable in the browser tool and is not claimed as a live browser test. No frame-rate benchmark was performed. Interactive floor-plan geometry stays stationary.

Implemented and locally verified; not deployed to production.
