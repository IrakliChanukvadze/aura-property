# MVP acceptance scenarios
Updated 2026-10-06. Test server behavior, not only hidden buttons. Real browser evidence required for desktop/mobile/keyboard/Hebrew RTL. External-provider scenarios use contract tests locally and live delivery verification before production readiness.

## Security and privacy
1. Agent A cannot fetch/search/count/export Agent B records by changing IDs/filters; team lead cannot access another team. Editor content grant changes no CRM visibility. Acting lead team Active accessible, team Lost/Won/earnings/files denied, own permitted.
2. Only SuperAdmin exports. Direct calls denied for other roles. Deactivation rejects existing sessions immediately and new login; inactive profile only SuperAdmin lists, historical attribution retained. No other-user password mutation route.
3. Draft/unpublished content and assets absent public routes/API/sitemap/cache. Private minimum sale floor and agreements absent all public responses. Agreement download checks current lead scope.
4. Lost-only delete enforced for SuperAdmin, confirmation required, pending review deletable; Active/Won cannot delete. Linked customer's other opportunities/sales remain.

## Intake and assignment
5. New public inquiry with required name/phone/consent and optional email creates New before optional OTP; skipped verification retains it. Country omitted→Unknown, language records website locale.
6. Duplicate inquiry does not create active board item/count before valid OTP. Failed/expired attempt cannot accept; success creates one repeat record and duplicate note assigned prior available agent, unavailable→team inbox. Retried acceptance not duplicate.
7. Simultaneous team assignments select smallest New+Not answered including unassigned and rotate ties atomically. Contacted/Lost/Won excluded; agent auto excludes inactive/on-leave; empty eligibility safely retains team inbox.
8. Manual agent submission/import assigns self; lead can choose manual/auto own team. Required name/phone/country-or-Unknown, optional projects/email/budget. Contact phone collision rejected without other team's details.
9. Excel preview no writes; invalid/company duplicate/within-file duplicate rows reported; confirm valid-only, recheck concurrency, repeat confirmation idempotent. No arbitrary column mapper.

## Lifecycle and jobs
10. Log No answer without comment changes nothing. First valid initial missed call→Not answered, exact due+90min unread offline; second→Lost pending review with explanation. Retried log counts once. Answer before due cancels automatic reminder but preserves manual follow-up. Answered lead later misses do not auto-close.
11. Agent Lost immediately flagged, prior stage saved, team notified; reviewer confirm or return same agent/prior stage. Lead-authored Lost confirmed immediately. Acting lead cannot team-review. Reservations release on Lost and do not restore on return.
12. Concurrent reserve same apartment permits one. Review24h agent+lead, no answer keeps reservation; two missed cycles notify SuperAdmin without release. Remove cancels jobs. Reassignment migrates future recipients without resetting time.
13. Follow-up reschedule/cancel/complete preserves history and suppresses old delivery. Viewing reminder1h, short-notice once, cancellation/reschedule coherent. Calendar scopes events correctly; all operational notification delivery header-only.
14. Own comment edit versions retained; foreign edit denied; only SuperAdmin deletes user comment with audit, immutable system events unmodifiable. Timeline sensitive payloads scoped.

## Sales and money
15. Missing signed confirmation, apartment, price/signing date or positive received deposit/currency/date blocks Won. Below minimum or mismatched floor currency denied. No minimum falls back advertised. Confirmation shows per-sale inputs, attachments optional.
16. Concurrent/retried Won cannot sell same apartment twice or duplicate commissions/count. Multiple apartments each unique sale, ongoing linked opportunity and old Won coexist. Staff reversal denied.
17. $100000 at FX2.7 and default1%/0.5% gives agent GEL2700 and lead GEL1350. Cover default splits lead GEL675 each; personalized0.8% gives acting0.25% and permanent0.55%. Signing-date cover/FX/rate snapshots survive late entry and later rate edits. Deposit not commission base.
18. SuperAdmin reason-required per-sale reversal updates apartment and removes only that sale earnings/count, preserves history/other sales. Active reversal chooses Available/Reserved, Lost→Available. Won cannot directly delete.
19. Monthly team/individual, annual individual rankings count apartments using signing date, equal count shared rank, value not tie-break, fixed old-team attribution. Monetary display GEL. Agents own earnings; acting only own shares; permanent own/team.

## Leave and personnel
20. Monthly employment anniversary accrues exactly2 once, no incomplete month, no annual expiry. Scheduled rest days excluded, approval below−2 denied, concurrent overlapping approvals cannot overspend.
21. Lead enters agents schedules; own schedule requires SuperAdmin approval. Recurrence/exceptions work; changed approved-leave schedule requires review, no silent deduction change. Pending request withdrawal immediate; approved cancellation/early return awaits approver and restores unused only.
22. Approved acting interval activates/expires automatically, no self-approval/content inheritance, early return ends interval. Reassignment optional, selected Active executes only start, stale ownership/status excluded, cancelled leave no execution, no return redistribution; reminders preserve due times.
23. Agent transfer preserves old Won credit; selected Active move, remaining old-team assignments resolved without cross-team leak. Reactivation same identity/history either prior setup or freshly configured.

## Public content and quality
24. Explorer renders preserved polygon geometry/alignment on responsive images, keyboard/tap alternatives. Sold red/Reserved distinct inert across overlays/details/direct inquiry API. Floor navigation works sold-out. Filters price/area/bedrooms/Available-only highlight matches, no floor counts/catalogue filters.
25. Starting price cheapest priced Available total, Reserved/Sold excluded. All-reserved message and general inquiry available; all-sold shows Sold out/explore others and rejects stale project inquiry. Construction status independent. Empty inventory never sold out.
26. Source total/per-m² derive correctly using balcony-inclusive total area; USD/GEL display, hidden prices respected. Source fields not independently contradictory. Optional image blog looks intentional.
27. Publish requires four complete reviewed translations; draft saves partial, explicit translation action never auto-publishes; unpublish removes public access. Content permission per-user enforced, no owner approval gate.
28. Light/dark, hero02 default/01 alternative, mobile public/admin, Hebrew RTL and reduced motion verified. Every drag/hover operation has accessible control. No customer registration.
29. Localized server HTML contains meaningful project/blog content/metadata; canonical/hreflang/sitemap valid, draft/admin/private blocked, structured data factual, image optimization and layout shifts inspected. No mock copy represented as production inventory.

## Release evidence
Record build/typecheck/test output and browser checks; separately list unverified provider delivery, production content, hosting/backup credentials and deploy status. Passing mocked tests is not a deployed/live-delivery claim.
