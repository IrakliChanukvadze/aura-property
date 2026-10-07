# AURA-012 — Leaderless teams and approval boundaries

Owner review allows teams to be created without a permanent lead, then assigned an active unassigned lead later. Nullable schema migration applied. Duplicate lead assignment has a specific explanatory conflict; lead dropdown excludes already-assigned leads. Leaderless teams are excluded from automatic routing and missing lead recipients never produce phantom commissions. Admin adds a Teams list with editing. Existing permanent-lead replacement remains protected pending an explicit transfer workflow.

Vacation review controls exclude the requester and restrict team managers to eligible same-team staff. Ordinary agents have request/withdraw/cancellation actions, never approval controls; server checks use actual permanent or acting team authority. A SuperAdmin-only team query filter is enforced server-side. Navigation no longer freezes a translated English label at module initialization.

Verified all workspace type checks, API/admin production builds and 25 passing tests including leaderless create/attach/conflict, unauthorized team changes, team-filter permission and ordinary-agent vacation denial. Browser confirmed optional No team lead yet and owner pending vacation shows Withdraw without Review.
