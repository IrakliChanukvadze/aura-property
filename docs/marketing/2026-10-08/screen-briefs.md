# Concrete screen briefs: overnight pass 1

8 October 2026. Written screen specifications for owner review, not visual mocks, implementation or a new approved design. English copy below is proposed source copy; ka/ru and Aura he require native review. No code, account changes, forms, outreach or paid generation performed.

## Fixed scope and shared truths

Pini is map-first with Projects / Houses / Land. No standalone individual-flat posts or flat catalogue. Apartments appear only inside a selected development's building/floor explorer. Free **project** listing is confirmed; do not infer that house/land posting or every Premium service is free. Exact Premium scope/pricing remains undecided.

Aura remains an independent residential-complex agency. D-231 approves the longer cinematic editorial homepage and richer motion. Preserve its deeper layout and separate project-introduction, complex-overview and block/floor URLs. D-232 removes A/B tabs from the explorer filter bar: shared-cover buildings expose floor regions together; accessible fallback selection remains necessary. Earlier QA images are evidence of an earlier local state, not an instruction to restore superseded controls.

The browser review found actual Pini English defects: Georgian catalogue title, starting-price currency not visible and `სატესტო` on Boulevard. These corrections precede concept implementation. No performance or mobile live baseline was measured. House/land brand scope is confirmed, but field/workflow capability must still be inspected before implementation.

## Shared Pini anatomy and data states

### Global shell

Header: Pini identity; compact `List your project — free` developer action; language and theme; clearly secondary menu. Buyer assistance and developer onboarding have separate labels/destinations. No free-house/land promise.

Map toolbar: category chips `Projects`, `Houses`, `Land`; location control labelled `Choose a city or area`; only relevant category filters. Visible count means actual published results, not submissions or potential stock. Map is primary at desktop and mobile; a text-results alternative supports access and crawling without becoming the main homepage identity.

Project card: cover with `Architectural rendering` where appropriate; fully localized name; city/district; construction status; starting **total** with explicit currency/basis according to supported actual inventory; availability summary if current; `Open project`. Do not calculate starting price from Reserved/Sold if source rules exclude them. Project stages: introduction → whole complex → building/floor → apartment. Never expose an `Add apartment listing` action.

House card/detail: actual property image, location, house area and plot area separately when supplied, price/currency/basis, provided room/features, contact recipient. CTA `View house`. No tower/floor selector imposed on a standalone house.

Land card/detail: actual parcel/image/boundary if authorized, location, parcel area, price/currency/basis, accurately sourced land-use/documentation context and contact. CTA `View land`. `Buildable` requires authoritative documentation and review; no certainty inferred from an attractive render.

Shared detail order: title/location → image/source label → essential category facts → relevant plan/boundary/detail → source/update information → clearly named recipient and inquiry entry. Prices or areas missing: `Price on request` / `Area not supplied`, with no zero fallback. Date: `Information updated [date]` only when the date actually tracks the relevant source update. No payment-created verification badge.

### Empty and error copy

- Empty current area: `No published [projects/houses/land] in this area yet.` Actions `Widen the map` and `Choose another area`; retain selected category.
- Filters exclude stock: `No results match these filters.` Action `Clear filters`; do not erase the chosen city silently.
- Category unavailable due to loading failure: `We couldn't load these results. Try again.` Do not report zero inventory from a network error.
- Map unavailable: `The map couldn't load. You can still browse these results.` Provide real links and accessible location text; keep error separate from empty stock.
- Source record unavailable: `This listing is no longer available.` Offer relevant category results; server status/SEO treatment must fit actual removal policy.
- Detail missing assets: `Floor plan not supplied` for projects; `Boundary image not supplied` for land. Avoid generated factual replacements.

## Plan A screen brief — project discovery utility

### Pini desktop order

1. Header + developer action.
2. Primary national/city map, approximately two-thirds viewport, with synchronized project/house/land drawer at one side. This ratio is a proposal to test, not a required source match.
3. Persistent category/location toolbar immediately above map; small city shortcuts reflect real supply.
4. Compact drawer introduction: `Find the place. Understand the property.` Supporting copy: `Explore projects, houses and land across Georgia. Open a listing to see its details and next contact.`
5. Real category cards; selected card and pin visibly linked without requiring hover. Selected state has name, photo, essential facts and a normal `Open…` link.
6. Map-adjacent footer/menu access to How it works, developer listing, Premium, contact and policy. No enormous below-map brochure that hides the utility.

Desktop states to specify: national Projects; chosen city Projects; selected Boulevard pin; Houses in same city; Land in same city; filtered zero; map error/text fallback; sponsored pin/card with visible `Sponsored` and unchanged essential facts. Category switch preserves useful city context but drops incompatible filters.

### Pini mobile order

Header → full-width category row → location/filter controls → map → bottom card drawer collapsed to one current listing with count. Expanded drawer overlays part of the map and scrolls independently, retaining map context and a clear collapse action. No hover dependency, drag-only trap or chat bubble covering the open-listing CTA. Selecting a pin opens its corresponding card; opening detail preserves a way back to the map/category state.

Proposed first-use microcopy: `Choose a category, then explore the map.` Avoid a forced onboarding carousel. Empty states live in the drawer, not in a full-screen dead end.

### Aura companion

Existing cinematic hero → agency introduction → genuine represented collection → richer city/lifestyle editorial sequence → factual agency/team context → journal → contact/footer. Confirm actual existing section order before changes; this is an alignment brief, not a wholesale reorder. Proposed factual hero subline: `A Georgian property agency for selected residential developments.` Primary `Explore our projects`; secondary `Speak with an advisor`. Keep deeper imagery/motion and a project-entry link at relevant narrative points.

## Plan B screen brief — concierge map / trusted buying journey

### Pini desktop order

1. Shared shell/category/location controls.
2. Primary map and real category cards, with compact optional assistance panel anchored beside the map rather than gating it.
3. Assistance headline `Need help choosing?` Supporting copy `Explore the map first, or tell us what matters to you.` Action `Explore assistance`. This opens an explanatory page/panel before any personal-data form.
4. Clear category-aware assistance explanation: Projects → development/area preferences; Houses → home/plot needs; Land → parcel/search needs. Exact service, provider and fee disclosed only after confirmed. No default Aura routing for houses/land.
5. Selected listing card retains ordinary details/contact action irrespective of assistance purchase. If paid service is piloted, `What is included` and price appear on that service page, not as a price-information paywall.

States: assistance closed; assistance explanation open without user data; selected project with direct detail; house/land with category-aware assistance; Premium explanation; no matching result; map error. If Aura assistance is offered for a represented project, label `Agency assistance by Aura Property` and require an explicit click; do not imply Pini/Aura are interchangeable.

### Pini mobile order

Shared header/category/location → map → card drawer. Assistance is a small secondary row `Need help choosing?`, not a modal interrupting map exploration. Expand explanation at user choice; close restores the same map state. Do not introduce a multi-step intake flow or promised response time until service scope and staffing are approved.

### Aura companion

Retain longer cinematic homepage and approved imagery. Within agency/story sections, show real advisor portraits, verified public language capabilities and representation explanation. Proposed heading `A person to help you choose.` Subline `Talk with our team about the residential developments we represent.` CTA `Meet our advisors`; project CTA stays clearly available. Actual staff names/photos/contact permissions required before replacing fixtures. No new house/land offering, legal guarantee or invented review/sales counter.

## Plan C screen brief — editorial map / property media

### Pini desktop order

1. Shared shell/category/location controls.
2. Primary map with a compact editorial rail titled `From pin to place.` Supporting copy `Stories and useful details, connected to real properties.`
3. Story cards tied to specific map pins/areas; selecting a story highlights the genuine category listing. Project examples: architectural rendering versus current site photos; location explanation; a selected project's floor-plan decision. House/land examples require their own real property/parcel facts.
4. Map-selected story panel: headline, short factual summary, dated/source-labelled image and `Open project` / `View house` / `View land`. Story panel never replaces essential listing facts with a generic cinematic video.
5. Separate developer `Premium production` destination only after exact service confirmation. Examples disclose generated/filmed/rendered material and authorized portfolio status; sponsored/client work labelled.

States: map with story rail; selected story and highlighted pin; native video/story paused by default with usable poster; factual listing detail; sponsored/client item; absent story for category uses normal listing cards; empty results; map fallback. No autoplay-with-sound or interaction-required-only textual project details.

### Pini mobile order

Header/category/location → map → drawer with `Properties` / `Stories` content tabs inside the map surface. Property facts remain one tap away; the map stays visible. Story media respects reduced motion and data constraints; poster plus brief text communicates the subject before play. CTA takes users to the real category detail, not a video-only wall.

### Aura companion

Preserve the deeper cinematic editorial sequence, with genuine represented project features and native-reviewed narration/media. Proposed story heading `Places, understood.` Supporting copy `Explore the setting, the architecture and the details of our selected residential developments.` Map/masterplan/floor selection stays on the approved separate routes. Production quality is proof of process, not proof of agency sales results or guaranteed investment outcomes.

## What differs — and what does not

| Element | A utility | B concierge | C editorial |
|---|---|---|---|
| First benefit | Clear current property discovery | Reduce choice uncertainty | Understand place through useful stories |
| Main supporting panel | Synchronized factual cards | Same cards + optional service explanation | Same facts + pin-connected editorial rail |
| Growth path | Useful supply → discovery → sponsor renewal | Discovery → explicit assistance → qualified conversation | Useful stories → real listing visits → bounded production pilots |
| Premium hypothesis | Clearly sponsored project visibility | Distinct assistance if validated | Scoped developer media production |
| Largest operating cost | Data refresh/moderation | Human assistance capacity | Capture/edit/native review |

All three: primary map, Projects/Houses/Land, free project onboarding, no standalone flat listings, truthful essential facts, separate brand attribution, accessible fallback. These are alternatives in business emphasis, not a choice to remove the map.

## Buyer task-test scripts

Use a consented participant or local simulated tasks. Read tasks without explaining the UI. Ask them to think aloud. Use public read-only browsing or local fixtures; never send an inquiry, call, WhatsApp message, save personal information or pay. Stop at the point before submission/external contact. Test proposed target states when they exist; current unsupported state is recorded as absent, not silently fabricated. Five tasks per category below; run across relevant languages and mobile/keyboard as capacity permits. A small qualitative pass is not a statistical conversion forecast.

### Projects: five tasks

1. `You want to understand a new development near Tbilisi Sea. Starting on the homepage, find the relevant project.` Record chosen category, map interaction and whether pin/card relationship is understood.
2. `Explain what the starting price means: currency, total or per-square-metre, and what it applies to.` Record wrong assumptions; do not disclose answer until task ends.
3. `Open the development and find how you would choose a building, floor and available apartment.` Record nesting, status comprehension and non-pointer fallback. No standalone flat discovery expected.
4. `Tell me which pictures show a rendering and which show a current real view, and what information is missing.` Record whether labels/source dates are clear. Participant can answer “not clear”.
5. `Find who receives a question about this project and stop just before contacting them. Then return to your map state.` Record agency/developer/Pini confusion, CTA findability and retained map context.

### Houses: five tasks

1. `Find houses in your chosen area without changing to apartment projects.` Record correct category, map context and whether unrelated filters disappear.
2. `Open a house and explain the difference between the house area and plot area.` Record missing-field treatment and confusion; no tower/floor-plan workflow expected.
3. `Explain the asking price and what you can verify from this page.` Record currency/basis and whether a paid badge is mistaken for legal/source certification.
4. `Choose an area or filter with no matching houses. Show how you would continue searching.` Record recovery, honest zero versus error recognition and category retention.
5. `Identify the contact recipient and stop before any call/message/form. Return to the same house on the map.` Record wrong Aura assumption and preservation of selection.

### Land: five tasks

1. `Find land in your chosen area and open one parcel.` Record category recognition, pin/map boundary understanding and actual detail navigation.
2. `Explain the parcel area and price. Is the price total or per unit of area?` Record whether basis is supplied and whether the UI implies precision it does not have.
3. `Can you tell from this page whether a house may legally be built here? Show what evidence supports your answer.` Correct behavior may be “not enough information”; never lead participant to infer buildability from image/pin.
4. `Find the boundary or documentation context. Explain what is missing or uncertain.` Record distinction between approximate map pin, documented boundary and legal claim.
5. `Find who can answer your question and stop before contacting them. Switch back to Projects and explain what changed.` Record routing clarity, category-specific controls and that flat inventory is nested only in developments.

### Recorded acceptance

Per task: completion yes/partial/no; observed steps; assistance required; time; critical misunderstanding; device/locale; fact absent versus navigation failure. Hard release blockers: wrong category/recipient, misleading currency/basis, inferred legal status from a paid label, standalone-flat posting path, broken keyboard equivalent, form submission without intent. Proposed directional goal: no critical misunderstandings in the moderated pass; this is a release judgement, not measured conversion uplift.

## SEO and map-first: primary-source guardrails

Map-first describes the interface, not a requirement to hide all content inside map gestures. Each legitimate project/house/land should have a stable, crawlable detail URL and descriptive visible text. Category/city landing links can support discovery without replacing the map home screen. No claim these changes guarantee rank, traffic or a specific uplift.

Google's JavaScript guidance describes separate crawl/render/index stages and recommends server/pre-rendering for speed and bots that cannot run JS. Use stable detail routes, meaningful status codes, titles and consistent canonicals; do not make a hash fragment the sole identity of a listing. Source: https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics

Google says crawlable links generally require normal `a` elements with `href`; a pin's click handler alone is insufficient link architecture. Pin-associated cards and category/city/detail links should expose normal hyperlinks, with relevant descriptive text. Source: https://developers.google.com/search/docs/crawling-indexing/links-crawlable

Google's mobile-first guidance requires equivalent main content/metadata on mobile and warns against loading primary content only after user interaction. A swipe drawer must not make essential listing facts available only to a person who taps/drags. Validate rendered mobile content and text/link fallback. Source: https://developers.google.com/search/docs/crawling-indexing/mobile/mobile-sites-mobile-first-indexing

For translated detail pages, maintain reciprocal hreflang and fully translated relevant content; local map labels alone are not a translated listing. Source: https://developers.google.com/search/docs/specialty/international/localized-versions

Practical verification ticket: inspect initial HTML and rendered DOM for representative category/city/detail routes; confirm hyperlinks, locale metadata/canonicals, status codes, mobile parity and absence of private/draft inventory. A desktop screenshot is not SEO verification. Crawlable fallback is a supporting infrastructure surface, not a permission to introduce independent flat listings or make Pini list-first.
