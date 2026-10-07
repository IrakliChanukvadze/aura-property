# Pini and Aura: website design and conversion research

Prepared 8 October 2026. Research and proposals only; no code, inventory, settings, deployments or messages changed.

## Recommendation

Keep the brands independent. Pini should become the memorable **map-first discovery tool for new-building projects, houses and land**; Aura should become the reassuring **human agency that helps a buyer make a decision**. They can share production standards, research and licensed project material without sharing private customers or misleading users about representation.

Do not redesign Aura wholesale: the owner already selected its warm cinematic architecture direction. Improve the proposition, evidence and project access inside that direction. Pini needs clearer city entry points and usable project cards before spending substantially on traffic. Brand growth will depend on accurate inventory, local-language content and fast human follow-up more than decorative animation.

## Sources and evidence boundary

Read Aura README, current MVP specification, naming/design references, explorer QA and superseding decision D-231. D-231 (7 October) approves the longer cinematic editorial homepage and richer scroll depth; it supersedes the earlier short-landing preference still present in older documents. Viewed actual local `cinematic-desktop.jpg` and `explorer-mobile-he.jpg`. Aura evidence is local QA, not a current production audit. No live Aura domain identified. Its README explicitly separates verified local implementation from production launch; translation/content/provider prerequisites remain.

Pini live browser review: https://pini.ge/en → visible View all projects navigation → https://pini.ge/en/projects → https://pini.ge/en/complexes/tbilisi-bulvari. Desktop screenshot and AX state inspected. No mobile, complete keyboard path, contact submission or performance measurement performed. Web fetch could not access Pini, but the browser could. Source data observed on a public page is not certification of inventory accuracy.

Current Pini observations:

- Homepage is a distinctive large pastel Georgia map on cream, with gold/olive accents. Header offers the buyer-request action, language and theme. Map instruction is small at the bottom; no obvious named Tbilisi/Batumi city shortcuts in the inspected screenshot. View-all-projects exists in AX but is not visually prominent in the screenshot.
- Public English catalogue shows one project. Its card is text-only in the inspected view, with Georgian project title, `From 52,397` without an explicit visible currency, and `188 available`. English surrounding instructions are clear but there is little visual reason to open the project.
- Boulevard detail has a strong full-width architectural rendering and English title, but the visible lower label still says Georgian `სატესტო` (test). The screenshot confirms it remains live. Block C and Block E links exist in AX; complete selection affordance not tested.
- Homepage AX includes `No projects yet` despite the catalogue showing one project. It was not visible in the screenshot, so this is a possible hidden/live-state inconsistency to inspect, not a proven customer-facing bug.

Local Aura observations:

- Cinematic desktop has elegant city photography, cream serif display type, restrained navigation and one Explore the collection CTA. This fits the approved direction. The headline communicates emotion but not clearly that Aura is an agency representing Georgian residential complexes; the subline is also abstract.
- Hebrew mobile explorer QA shows responsive stacking and mirrored text, green/ivory palette, available-only toggle and preserved building imagery. It is not evidence that every mixed-script label, phone or number is correctly handled; prior QA explicitly did not independently verify language-selector navigation.

## Three proposed directions for Pini

These are decision concepts, not generated visual mocks and not approval to implement.

### P1 — Project discovery utility (recommended launch plan)

The map is the primary product surface in every viewport. Keep the recognizable cream/pastel Georgia map, add named city shortcuts for actual published inventory and synchronize project pins with image-rich project cards. On mobile a swipeable project-card drawer supports the map; a text-list accessibility alternative exists but is not a competing list-first homepage. Compact controls show city, project construction status and only confirmed project-level fields. Map category chips `Projects / Houses / Land` keep these three supported discovery types explicit. Each category uses its own truthful fields and detail structure. No individual-apartment listing entry or independent flat catalogue.

Growth plan: recruit developers through `List your project — free`; publish accurate, complete new-building project records; distribute short screen-recorded map-to-project demonstrations. Acquisition lands on the relevant map region or project pin. Inside a selected project only, users can choose building, floor and apartment. Measure project-open rate, qualified project inquiries and accepted published developer listings separately.

Why: expresses Pini's fixed map-first identity and gets value from useful project data rather than decorative features. Risk: thin launch coverage; city shortcuts must never imply projects exist where none are published. First test is clearer project pins/cards against the current map, never map versus non-map.

### P2 — Editorial map / Georgia living atlas

The map remains the opening and discovery surface. A compact editorial layer highlights factual neighborhood or development stories tied directly to real project pins: `A morning by Tbilisi Sea`, `What this project's floor plans change`, `City rhythm and a quieter setting`. Selecting a story reveals the relevant map area and its new-building project; the map does not shrink into a decorative thumbnail beside a generic editorial landing.

Growth plan: build repeatable neighborhood/project explainers and native-language guides, pair each with a short creator video and link to its project pin. Use genuine imagery, label renders and verify travel/infrastructure claims. Shared stories can create attention while map interactions convert it into project exploration. Track story-to-project opens, qualified inquiries and organic entry pages; do not equate shares with sales.

Why: gives a memorable map brand content worth revisiting and sharing. Risk: ongoing research/editorial cost and tempting unsupported lifestyle claims. Launch only after core data and translations are reliable. The map retains `Projects / Houses / Land` category chips. Editorial stories connect to the relevant category and genuine listing detail. Apartment examples live inside the relevant project's explorer; houses and parcels use their own detail structures, never apartment-floor-plan workflows.

### P3 — Concierge map

Keep the full primary map with `Projects / Houses / Land` category chips and a calm assistance panel: `Tell us what kind of new development you need`. Visible city/area context and category-appropriate pins remain understandable without submitting a form. Project, house and land detail structures stay distinct; assistance must capture the selected category explicitly. The buyer-assistance action is separate from developer onboarding; no registration or conversational gate to basic project facts. Assistance may guide users to a project, then its existing building/floor/apartment explorer.

Growth plan: publish practical buyer-question content and run assisted-selection campaigns with a clearly described human response process. The exact service scope, staffing, response promise and brand/agency relationship require confirmation before copy is published. Optional Premium developer services stay distinct from buyer assistance and essential project information.

Why: can reduce uncertainty for buyers who do not know neighborhoods or building options. Risk: manual workload and confused representation if Pini appears to be an agency without an approved relationship. Measure qualified assistance requests, contacted/viewing outcomes and staff minutes per accepted request. No guaranteed recommendation accuracy or fabricated response SLA.

## Three proposed directions for Aura

All preserve approved warm ivory/charcoal, champagne/olive accents, architectural imagery and the longer cinematic editorial homepage approved in D-231. There is no recommendation to shorten the existing homepage. These are written concept directions only, not actual visual mocks or selected implementation targets. No name change: Aura is the selected launch name. Naming clearance remains separate.

### A1 — Cinematic agency with concrete proof (recommended)

Keep existing cityscape hero and typography. Refine the factual subline to something like `A Georgian property agency. Selected residential developments in Tbilisi and Batumi.` City wording must follow actual represented catalogue. Primary `Explore our projects`; secondary restrained `Speak with an advisor`. Within the approved longer editorial sequence, make actual project count and real project cards easy to reach; retain richer agency/lifestyle/story sections, reviewed journal material and contact. Keep clear project-entry CTAs at relevant points so depth does not become a barrier. Do not add an unsupported service workflow or force the homepage into a short landing.

Project cards show truthful actual availability starting price and status under existing business rules. Team section states real names, relevant languages and direct approved contacts. Explain representation honestly; do not imply Aura owns or develops buildings. This is the lowest-risk improvement because it strengthens comprehension within owner-approved design.

### A2 — Architectural collection

Use the retained approved collage alternative as a project-forward test: one city/lifestyle image, two genuine project covers, restrained headings and highly legible project facts. Minimal decorative motion, strong editorial grid. Hero shows agency identity first but lets buyers reach stock faster.

Why: may suit high-intent visitors who care about a specific complex more than a brand manifesto. Risk: one project becomes mistaken for the agency identity unless labels and representative language remain explicit. This is an existing permitted alternative, not a replacement mandated overnight.

### A3 — Advisor-led welcome

Warm split hero: architectural photograph paired with a real consenting advisor portrait, concise agency proposition and `Talk to an advisor` beside `View projects`. Small language capabilities and process explanation: select a project → explore apartment → ask for a viewing. No fabricated reviews, awards or sales counters.

Why: addresses trust and language support for remote buyers. It requires verified staff profiles and service promises before launch. Do not implement unsupported guaranteed response times or legal/investment service claims. This direction is a new proposal requiring owner design selection.

## Prioritized delivery plan

### First 7 days: make traffic safe to convert

1. **Pini English content consistency:** replace test label, fully translate project title and all meaningful project/action labels. Keep proper addresses geographically accurate. Explicit price currency and whether total/per-m². Audit ka/ru too. Acceptance: zero test/placeholder labels in published catalogues; English browser flow remains English; same real project URL after locale switch.
2. **Pini cover-rich catalogue and map alternatives:** preserve existing map; add a clear named city entry + All projects route; cover photo on the real catalogue card; functional text/list alternative to building polygons. Scope approval needed before code. Acceptance: a new visitor can open Boulevard and explain how to choose a building without a tutorial; keyboard and touch path verified.
3. **Aura agency clarity and truthful launch content:** finalize localized factual subline, actual project cards, team contact permissions and contact/privacy copy. Keep approved design. Production blockers documented separately; local pretty screenshots do not constitute ready-to-launch.
4. **Measurement plan:** event chain page_view → project_open → building_select → apartment_open → inquiry_start → accepted_new_lead / verified_repeat_lead → contacted → viewing → won. Separate brand, locale, channel, creative and project. No names/phones/messages in analytics. A tap on WhatsApp is an outbound click, not a verified lead.
5. **Performance baseline:** mobile field measurement before animation additions. If no sufficient field data, controlled lab tests are diagnostics, not proof of real-user CWV. Compare like-for-like devices/networks and record dates.

### Days 8–30: controlled experiments

Pini map gateway: current map homepage versus P1 clearer city shortcuts and synchronized project cards. Primary metric qualified inquiries per landing session, supporting project-open rate, guardrail no increase in mistaken/unserviceable-city requests. Run separately for existing brand/direct and paid cold traffic.

Aura factual agency hero: existing abstract subline versus factual localized proposition; keep visual treatment constant. Primary metric qualified project inquiries per session; secondary project-opening rate. Guardrail no lower lead quality or mistaken belief Aura is the developer.

Mobile Pini map usability: compare two map-first project-card drawer designs after cards and inventory accuracy are ready. Primary qualified project inquiry rate; project discovery completion time and map interaction supporting. A text/list fallback supports accessibility but no list-first homepage is proposed.

Aura trust strip: actual advisor language/contact + source-updated availability context versus current sparse context. Measure qualified form completion, contacted and viewing rates; not just button clicks. Avoid false scarcity and invented testimonials.

Low traffic: start moderated task tests and aggregate observation before splitting tiny traffic. Proposed 5 users per main language/funnel is a practical qualitative first pass, not a statistical conversion estimate. Ask: find a suitable unit, explain price and status, identify who receives request, submit only to test/local fixtures.

## Quantified evidence and its limits

**Performance:** Google-published Vodafone A/B case reports 31% better LCP with 8% more sales and 15% higher lead/visit rate. It is an external telecommunications case from 2021, not a forecast for Georgian property. It supports measuring performance as a commercial input; it does not justify promising Pini +8% revenue. Source: https://web.dev/case-studies/vodafone

**Operational acceptance thresholds:** Core Web Vitals good thresholds LCP≤2.5s, INP≤200ms, CLS≤0.1, assessed at the 75th percentile. Use them as engineering targets, not business uplift figures. Source: https://web.dev/articles/vitals

**Touch accessibility:** WCAG2.2 target-size minimum is 24×24 CSS pixels with specified exceptions/spacing. Recommended design target44×44 for main actions is more generous and useful for mobile, but do not misstate it as the WCAG2.2 AA minimum. Visible focus, keyboard equivalents and avoiding color-only inventory states also need testing. Source: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html

**RTL:** Hebrew structure needs document direction, logical layouts and appropriate isolation of mixed-direction strings. Do not simply reverse arrays or flip digits/phone numbers. Source: https://www.w3.org/International/questions/qa-html-dir

**Localization SEO:** Google advises explicitly indicating locale alternatives; reciprocal hreflang connections matter and main text language is determined algorithmically. Template-only translation is not full content localization. Source: https://developers.google.com/search/docs/specialty/international/localized-versions

**Planning arithmetic (hypothetical):** at 1,000 qualified landing sessions/month, a 2.0% inquiry rate gives20 inquiries;2.5% gives25. Five extra inquiries are a 25% relative increase, not evidence any design will achieve it. With two-sided5% significance/80%power and independent visitors, detecting2.0%→2.5% needs roughly13,800visitors per arm using normal approximation; at500visitors/week total this is over55weeks. Therefore first establish traffic/baseline and use qualitative tests for early-stage design decisions. Detecting a large task-completion improvement can take less traffic, but cannot substitute for lead-quality measurement.

## Competitor and content references

https://korter.ge/en/ currently exposes map entry, city/project sections, development cards with explicit total/per-m² price cues and Georgian/Russian/English options. This is evidence of its presentation, not its conversion or market-share superiority. Do not copy its broad catalogue taxonomy into Aura: Aura's confirmed small curated catalogue and no project filters are intentional.

https://themodernhouse.com/ is an editorial agency reference already recorded by Aura. Architecture, concise agency identity and an editorial property collection are relevant; its UK market and inventory depth differ. No traffic/performance superiority established here.

https://tbilisiboulevard.com/ offers project story, amenities, choose-an-apartment and viewing/contact. It currently shows conflicting completion dates2028/2030 and apartment totals236/1100 in fetched page content. Never resolve this silently in ads or Aura/Pini copy. Obtain a dated project source before claims; do not equate an architectural render with built amenity availability.

## Brand cooperation without conflation

Shared licensed photo/renders, verified project fact sheets, native-reviewed pronunciation glossary and common filming/editing QA can reduce production duplication. Brand identity, landing proposition, marketing attribution and CRM consent remain distinct. Any cross-referral CTA must explain the agency relationship and require the user's conscious action. No automatic lead transfer or shared private customer audience is recommended.

Content-to-site loop: a Pini video demonstrates finding the actual pin/apartment; an Aura video answers a buyer question with an advisor and links to that represented project. Landing pages should match that promise directly. Neither should dump a project-specific viewer onto an unexplained national map unless the creative's promise is discovery itself.

## Morning decisions

Choose one of the three complete map-first growth/design plans: P1 project discovery utility, P2 editorial map or P3 concierge map; keep A1 as Aura baseline. Confirm who owns verified inventory/price/content updates and whether Aura has permission to represent each promoted project. Approve factual localized copy and measurement definitions before implementation. No overnight design proposal should supersede approved business rules or current visual direction without owner choice.

## Owner steering: free project listing and optional Premium

Superseding owner correction: Pini remains map-first and supports new-building projects, houses and land. Only independent individual-flat listings are excluded. The earlier statement excluding houses/land or limiting Pini to projects only is superseded. Apartment selection is acceptable only within a selected project's building/floor explorer. Houses and land remain separate map categories with their own detail structures. Free project listing and optional Premium services remain; exact Premium deliverables are unconfirmed. Aura stays residential complexes only and does not inherit Pini's house/land scope.

### Free project onboarding

Add a clearly visible developer entry beside buyer navigation: `List your project — free`. Give developers a concise explanation of what a free listing includes, the information required, review/publication process and a clear submission entry. Do not promise instant publication, verified status, unrestricted units or specific turnaround until those policies are confirmed. Developer onboarding and buyer `Help me find a home` must be visually separate to prevent wrong-funnel inquiries.

Proposed free listing presentation: consistent project cover, location, verified factual fields when supplied, building/floor-plan access when available and contact/inquiry. Missing assets should be clearly shown, never replaced with fictitious plans or quantities. Basic buyer information and project discovery should remain available regardless of whether the developer buys Premium. The site should not imply that a paid badge certifies developer reliability.

### Optional Premium visibility

Expose `Premium services` as a distinct developer destination with a transparent offer table once the owner confirms deliverables and prices. Potential services such as licensed media production or sponsored placement are proposals, not approved package contents. Avoid using `Premium` as an unexplained trust label on cards.

If paid placement is offered, distinguish it visibly as `Sponsored` / a reviewed localized equivalent at card and pin level. Keep the same price/status definitions and essential buyer facts for paid and free listings. Proposed public explanation: organic ordering follows selected filters and relevance/location; clearly marked sponsored placements may appear separately. Exact ranking factors and placement limits require owner choice before implementation. Neither payment nor free listing alone should produce a `verified` mark; any verification badge requires a separate published evidence/process policy.

Measure developer acquisition separately: developer-entry click → onboarding start → complete submission → accepted published listing → active listing → optional Premium inquiry/purchase. Buyer conversion is a separate funnel. A free submission count is not a published-project count, and a published-project count is not proof of inventory quality.

### Design and experiment changes from this steering

All three Pini options preserve the primary map with Projects / Houses / Land category chips. Each includes separate free project/developer onboarding and transparent optional Premium presentation; the exact free-versus-paid house/land offer is not inferred from free project listing. None permits individual-flat posts or offers a choice between map-first and search/list-first. P1 emphasizes discovery utility across category-appropriate map pins, P2 editorial attention attached to genuine map listings and P3 assisted category-aware selection. The owner can choose a complete growth plan without reopening the fixed map-first and no-individual-flat boundary.

First experiment: visible free-listing CTA versus buried developer navigation. Primary outcome accepted published projects per eligible developer visit; guardrails duplicate/incomplete submissions, moderation effort and factual completeness. Test Premium presentation only after package confirmation; primary outcome qualified Premium inquiries among eligible developers, not accidental buyer clicks. Maintain public sponsored labeling and equivalent essential listing facts in every variant.

### Category detail acceptance — superseding clarification

- **Projects:** masterplan/project context → building → floor → available apartment. Units remain nested; no independent flat-posting action, flat-feed landing or cross-project individual-flat catalogue.
- **Houses:** property detail with actual house imagery, location, total plot/building area when supplied, rooms/features, price/currency and inquiry. Do not force a standalone house through a complex tower/floor inventory explorer.
- **Land:** parcel detail with actual boundary/location, area, price/currency, supplied documentation/context and inquiry. Buildability, ownership and permissions are factual claims requiring authoritative review; none is inferred from a paid badge or map pin.
- **Shared map:** category chips preserve map state and show appropriate filters/pins. Empty category results are honest; absent fields remain absent. Mobile uses map-first drawers and accessible text alternatives.
- **Aura:** residential-complex catalogue and approved explorer only; no house/land navigation, content campaign or lead routing expansion.

Before implementation, check which house/land capabilities already exist and which are only business intent. Their inclusion in the brand scope is not evidence that every detail field, submission workflow or production integration is implemented.
