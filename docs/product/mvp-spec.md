# Aura Property — current MVP specification
Updated 2026-10-06. Source: owner conversation and decision ledger. This current specification resolves older superseded statements; the ledger remains historical evidence. Confirmed owner requirements take precedence over implementation defaults below.

## Product and architecture
Standalone agency for residential building complexes in Georgia, targeting Georgia, Russia and Israel. Launch 2–3 complexes in Tbilisi/Batumi, possibly Kutaisi; catalogue expectation up to five is not a creation cap. Brand Aura Property is approved and configurable. No public accounts or registration.

Approved stack: TypeScript throughout; Next.js/React public website, React/Vite admin, Node.js/Fastify API, PostgreSQL/Prisma, Tailwind and custom components in a shared-schema monorepo. Cloudflare participates in DNS/security and R2 media storage; final application/database/job hosting requires configuration. Pini is a read-only reuse source for upload/annotation tools, 2D explorer and inquiries only. Copy code, never its credentials, live inventory or runtime connections.

## Public experience
Compact landing: agency-focused hero, project cards, brief About/services, recent journal articles and contact. Dedicated About/team, projects/explorer, Blog listing/article pages. No long services workflow in MVP. Curated agent profiles and their public phone/WhatsApp numbers are selected/configured by SuperAdmin, not derived automatically from accounts.

Approved design direction: warm ivory/charcoal light mode and warm charcoal/ivory dark mode with restrained champagne/olive accents, architectural photography and premium motion. Hero 02 (Georgian city/lifestyle, agency identity) is default; hero 01 (two-project collage) is retained as a configurable alternative; hero 03 is rejected. Images/copy from concepts are illustrative. Gentle entrance/scroll reveals, image hover zoom, polygon highlights and panel transitions must support reduced motion, touch and keyboard.

Languages ka, ru, he, en; Hebrew RTL across public/admin. Match supported browser language initially; saved explicit selection wins subsequently; English fallback. Staff choose persistent admin language during setup/settings. SEO includes crawlable server-rendered localized pages, translated metadata, canonical/hreflang, sitemap, robots, appropriate structured data and optimized image loading. Private drafts, admin and CRM data never index.

## Projects, explorer and pricing
Construction Ongoing/Completed is editorial and independent of inventory Sold out. Project cards show cover, city, construction status and starting price. Sold out is automatic only for nonempty inventory where all apartments are Sold. Starting price is cheapest publicly priced Available apartment total; Reserved/Sold excluded. If remaining unsold apartments are all Reserved, show that localized message instead, still allow general project inquiries. Sold-out projects remain visible; project inquiry becomes Explore other projects, agency contact remains.

Explorer: complex → building/tower → floor-cover polygons → floor plan → apartment detail/inquiry. Preserve normalized 0–100 SVG polygons and source-image aspect ratios. All inventory visible; Sold red and Reserved distinct, both inert (no detail/inquiry); only Available selectable. Floors remain browsable when sold out. No project catalogue filters. Inside explorer: price range, total area, bedrooms, Available-only; matching regions highlighted, nonmatching muted; no matching counts on floor selectors.

Editors enter one source amount, USD default or GEL, total/per-m² mode. Derive counterpart using total area including balconies. Public USD/GEL switcher, both total/per-m² figures; price hiding per complex/unit. Signed price separate. Private minimum prices set only by SuperAdmin; staff discount down to minimum, fallback advertised price when absent. Minimum and sale must use same currency; reject mismatches instead of automatically converting discount floors. Never expose private floors in public responses.

Projects and articles support private Draft/Published and unpublish to draft. Authorized per-user content editor publishes directly, no approval gate. Four complete reviewed translations required for articles and complex descriptions. Explicit automatic-translation action followed by human review; no auto-publishing. Blog fields title/body/publication date, optional image; no public comments. Unpublish does not delete CRM/history.

## Identity, roles and authorization
Exactly one owner SuperAdmin, one permanent lead/team, one team/agent. Server enforces object/action scope on every endpoint, totals, search, calendar, files and exports.

- SuperAdmin all roles/actions across teams, user creation, team transfers, per-user grants and rates. Cannot change/reset another password; cannot directly delete Active/Won.
- Permanent lead own-team Active/Lost/Won, assignment/distribution, agent creation into own team, schedules and agent-leave approvals; no grants of higher authority.
- Agent own assigned records only; single manual lead and Excel imports assigned to self.
- Editor granted content scope, no automatic CRM scope. Content permission attaches to user; granting it to one lead does not grant it to others or broaden lead visibility.
- Acting lead time-bounded own-team Active access, assignment, agent creation, other-agent leave approvals; no self-approval, no inherited content grant, no rate changes, no team Lost/Won or team earnings. Own Lost/Won/commissions remain.

Email invitation requires password setup before access. Password update/recovery user-owned. Deactivation immediately blocks login and invalidates sessions. Only SuperAdmin sees deactivated user-management profiles; historical business attribution remains readable within record scope. Reactivation restores prior setup or reconfigures same identity; never deletes history. Agent team transfer lets SuperAdmin select Active records to transfer; unselected old-team Active must be reassigned, historical Won attribution fixed.

## Intake, customers and opportunities
MVP intake only website inquiries, one manual lead/submission, Excel uploads. Record intake method; manual origin labels do not imply external integrations. Separate customer identity, purchase opportunity/card and apartment sale: customer can have multiple projects of interest, multiple purchased apartments and a linked ongoing card while prior sales remain Won. Never use shared customer linkage to leak inaccessible opportunities.

Public required name, phone, consent; email optional, country/nationality optional→Unknown, optional message, contact language defaults website locale. Pini general size/floor preferences and exact-apartment context preserved. Manual/Excel required name, phone, country/nationality (Unknown allowed), optional email/project(s). Optional budget min/max with USD/GEL. Nationality separate from language; no inference from phone/browser.

Company-wide normalized phone checks. Manual/import duplicate rows skipped/reported without overwrite or inaccessible details. Contact edits within scope audited; phone collision with different customer rejected. Public first-time number saves/routes immediately then offers optional OTP; skipping does not discard lead. Repeat number creates pending inquiry, requires phone OTP, no workload/board change until verified. Success creates New repeat opportunity for prior agent with duplicate system note; unavailable/vacation agent → that team lead for reassignment. No merging of histories.

Excel fixed downloadable template, preview flags rows and duplicates, confirmation imports valid rows only, skipped-row report. Recheck at commit and make retries idempotent. Team lead chooses manual assignment or auto distribution; agent imports to self. Only SuperAdmin exports datasets; imports never confer export.

Team routing counts New + Not answered including unassigned, smallest eligible team backlog, rotating ties. Within-team explicit auto assignment uses same per-agent stages and tie rotation; exclude inactive/current approved-vacation agents. No reshuffling existing assignments. No eligible agent → team-lead inbox. Deactivation allows team-lead inbox or automatic distribution of Active records.

## CRM lifecycle and communications
Active stages New, Not answered, Contacted, Viewing scheduled, Negotiation, Final details (working label). Lost and Won separate tables; normal own/team/all scope applies. Any active stage transitions respect required appointment/reservation/sale fields without mandatory sequential progression.

Log call requires Answered/No answer and nonempty comment, immutable outcome history, idempotent effects. Before initial answer, first No answer → Not answered plus exact 90-minute header reminder even outside hours; second total No answer → Lost with explanation/review flag. Answered → Contacted from initial stages, cancels pending automatic reminder; no regression of later stages. After answer missed calls do not auto-close. Manual follow-ups exact time, reschedule/cancel/complete audited independently.

Agent Lost moves immediately to Lost with review flag and explanation; permanent lead notified, confirms or returns to prior active stage/agent. Automatic second-unanswered Lost also flagged. Permanent lead/SuperAdmin authored Lost confirmed immediately. Acting lead no team Lost review. Ordinary customer-return reopening own Lost→Contacted preserves history. Lost releases linked reservations immediately; reopening does not restore them, fresh availability check required. Only SuperAdmin can permanently delete Lost, pending or confirmed, after explicit confirmation; no recycle bin; no cascading deletion into linked Won/Active.

Comments own-author edits only with versions; agents/leads cannot delete. SuperAdmin can delete user comments with audit retained, not immutable system events. One timeline combines actor/time/comments/calls/stages/assignments/reservations/sales with sensitive fields scoped.

Header-only operational notifications, persist unread while offline. Invitation/recovery email and OTP are separate. Pending reminders/future reservation recipients transfer on reassignment with original times. Viewing date/time, optional location, reminder one hour before; reschedule/cancel update jobs. Calendar shows own/team/all viewings, approved leave and follow-ups, acting scope respected.

## Reservations
Explicit reserve accessible lead/apartment, not automatically on Negotiation. Atomic availability check prevents double booking. Agent own, permanent/acting lead accessible team Active, SuperAdmin all. Agent and permanent team lead notified every24h Keep/Remove; no response leaves Reserved. After two missed review cycles (48h) notify SuperAdmin for manual action, no auto-release/penalties. Remove/Lost releases and cancels reservation jobs. Reassignment retains original timing.

## Won, commissions and leaderboards
Won requires signed-purchase confirmation, exact apartment per sale, positive actual sale price/currency, signing date, positive received first deposit, independent deposit USD/GEL default GEL and receipt date. Any positive deposit sufficient; no project threshold. Confirmation summary precedes commit. Optional private agreements/supporting uploads can follow; no mandatory file/deadline/reminders. Use Pini-inspired image/PDF upload pattern, never public agreement URLs.

Mark Won transactionally sells apartment and records immutable rate/FX/recipient snapshots, commissions and ranking credit. Staff cannot reverse Won; only SuperAdmin exceptional correction/reversal with detailed reason/history. Reverse only chosen sale; Lost destination makes apartment Available, Active destination chooses Available/Reserved; remove that sale earnings/count, keep unrelated Won sales. No direct Won delete.

Sale entry GEL default, USD allowed. Earnings and monetary leaderboard figures GEL; USD converted using fixed signing-date USD/GEL snapshot, preserve original. Agent default1% actual full sale price; permanent lead default0.5% of team apartment sales, not Aura income. Rates user-specific/default controlled solely by SuperAdmin, future changes do not alter past snapshots. Acting share half configured default lead rate (0.25%), adjustable only SuperAdmin; permanent remainder personal rate minus acting share. Signing date within approved cover determines split, delayed entry does not change it. Acting ordinary agent commission separate. Earnings-only MVP: no Paid state, financial automation or payroll.

Agents own earnings, permanent leads own/team, acting own including cover share, SuperAdmin all. Team monthly and individual monthly/yearly rankings by sold-apartment count, shared ties, signing calendar period, fixed historical team/agent attribution. Monetary GEL does not determine rank. Ranking summaries never expose underlying private sales. Rewards manual, no automatic formula.

## Schedules and leave
Five-day working week, flexible rest days. Permanent lead fills agent recurring weekly schedules plus dated exceptions; lead fills own schedule approved by SuperAdmin. Agent vacations approved by permanent/authorized acting lead, lead own vacation by SuperAdmin. No self-approval.

Two leave days accrue after each completed employment month from joining date (24/year), no partial month, carry forever no expiry/cap. Deduct only scheduled working days; approved balance never below−2. Approved deductions fixed; changes affecting approved leave require reapproval. Pending withdrawal free; approved cancellation/early return request approved by original authority, restore only unused days. Approved early lead return ends cover authority/split on return date, old earnings preserved.

Vacation approval may optionally plan selected/all Active reassignment, manual agents or auto within team. Execute when vacation starts; do not overwrite intervening ownership/status changes. Unselected leads stay. Cancelled vacation cancels plan. No auto-return after vacation; pending reminders/future reservation notifications migrate unchanged.

## Dashboard
Month default current, selectable month/year in Asia/Tbilisi. Period metrics leads received, sales signed, corresponding earnings; current New/Active/Lost labelled current. Leaderboards plus latest three accessible Won entries. Search/filter name/phone, project, agent, stage, source, date range within scope. Responsive mobile all features, accessible controls alternative to drag/hover.

## Explicit implementation defaults (not newly agreed business rules)
- URL locale wins for link determinism; saved preference used on unlocalized entry. Theme follows system on first visit, explicit switch persists. Use CSS logical properties and reduced-motion media query.
- Team eligibility active team/permanent lead; no eligible team retains inquiry in SuperAdmin inbox. Most-recent accepted matching opportunity selects repeat owner; preserve privacy-safe generic verification wording.
- Agency timezone Asia/Tbilisi, half-open coverage intervals; day-based leave end excludes first return day. Month-end employment anniversaries clamp to month last day; exactly-once accrual ledger. Editor/non-team leave SuperAdmin approved. No implicit public-holiday deduction exceptions until configured.
- Snapshot rates effective at signing date with versioned configuration; forbid acting share exceeding permanent pool. Money decimal2, rates decimal precision, no binary floating-point accounting. National Bank rate preferred historical business-day fallback only when provider verified; configurable source/rate metadata and fail closed if needed rate unavailable.
- Reservation review cycles anchored to last Keep; either recipient response resolves current cycle; missed-cycle escalation sent once per unresolved streak, no extra policy.
- Cancel obsolete pending automatic jobs on Lost/Won; delivered notifications retained but redacted/unlinked if access lost. Short-notice viewing reminder delivered immediately once. Latest Won sorted entry time, selected month applies sale signing date.
- Private attachments PDF/JPEG/PNG/WebP, 30MiB cap and authorized short-lived retrieval. Excel .xlsx fixed schema, first valid within-file phone wins, 1000-row/10MiB caps. Rich text sanitized and draft cache invalidation required.
- Missing advertised/minimum price blocks ordinary sale pending SuperAdmin setup. Empty/zero area cannot derive per-m² or publish priced unit; single entered mode retained through area edits.

## External dependencies and release limits
Production project images/plans/polygons/inventory, reviewed ka/ru/he/en copy, agent profiles and authorized branding/content must be supplied. OTP provider, email delivery, automatic-translation provider, historical/current FX source, Cloudflare/domain/storage credentials, database/application hosting and backup configuration require integration. Development mocks must be visibly labelled and cannot be represented as verified production messaging/payments. Do not import Pini production data. Company policy/leave counter is not legal/payroll certification.

Post-MVP: direct calling/phone masking, AI transcription/comments, messaging ingestion/replies/AI lead creation (WhatsApp/Gmail/Facebook/Instagram/Telegram), financial administration/automation, commission progression, additional approval roles, detailed services, richer project/category/hotel filtering. No implied runtime Pini relationship.

## Owner browser review — 2026-10-07

Teams may initially have no permanent lead. SuperAdmin can create such a team and attach an eligible unassigned lead later. Leaderless teams are excluded from website auto-routing. Active Kanban supports desktop drag and drop with required call/viewing workflows preserved, and SuperAdmin has a team filter. Project authoring uses focused steps with visual annotation canvases. Ordinary agents cannot review or approve vacations; eligible permanent/acting leads review team staff, and SuperAdmin reviews team leads. Review controls do not offer self-approval.

### Public exploration navigation — 2026-10-07

Project introduction, whole-project block selection and selected-block floor/apartment exploration use separate routes. Filters appear only in the selected-block explorer. Keep old shared selection links compatible through redirects; general inquiry uses a compact dialog.
