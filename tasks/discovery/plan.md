# Discovery plan
Last updated: 2026-10-06
Status: in progress

## Objective
Agree Aura Property business rules and create a Codex-native workspace that preserves decisions and supports orchestrated implementation.

## Completed
- DealerTrades orchestration reviewed; keep durable decisions/contracts/review, reduce duplicated rules and manual-only acceptance.
- Pini explorer/upload/inquiry sources inspected read-only.
- Global UI references researched.
- Business scope, geography, languages, code reuse, lead roles/visibility, per-user content permission, team routing goal, optional post-save OTP, and Cloudflare direction recorded.
- Initial documentation workspace created; no app scaffold, database, deployment or Git initialization performed.

## Next
Define remaining active lead stages, two-call counting, reminder behavior and Lost/Won criteria before finalizing routing. Then resolve teams/access, inquiry operation, project inventory/publishing, multilingual content, design, and deployment needs. Each confirmed answer updates docs/product.

## Proposed implementation sequence (not approved)
1. Complete business brief and acceptance scenarios.
2. Select architecture and prepare environment/scripts.
3. Approve representative home/project/explorer/admin designs, including Hebrew/mobile.
4. Implement admin identity/content permissions and independent inventory upload.
5. Adapt explorer/public complex routes and multilingual content/blogs.
6. Implement inquiry persistence, team routing, lead board/comments, optional OTP.
7. Review, verify complete journeys, then release through agreed Cloudflare architecture.

Agents get bounded ownership; dependent contracts must be established before parallel feature work. Work is complete only with verification evidence and owner-approved release scope.

2026-10-06 update: recorded New/Not answered, two-unanswered-call loss rule, Lost/Won tables, exact-time reminders, and future-only calling/AI integration. Next discussion: active stages after a customer answers.

2026-10-06 update: confirmed a single Contacted column with comments for needs/interest. Next: determine whether scheduled viewings need a separate column and how appointments/reminders behave.

2026-10-06 update: recorded user creation authority, automatic own-team membership for team-lead-created agents, and SuperAdmin agent transfers. Viewing scheduled question remains pending.

2026-10-06 update: confirmed separate Viewing scheduled column and admin-header notifications. Next: decide Negotiation as the remaining proposed active column.

2026-10-06 update: confirmed Negotiation, completing the initial five active columns. Next: define the event that qualifies a lead as Won.

2026-10-06 update: confirmed signed-contract/manual Won transition and scoped Won visibility. Next: owner decision on agents viewing their own Lost leads.

2026-10-06 update: confirmed identical permissions/ownership scope for Active, Lost, Won. Next: clarify whether the two-unanswered-call limit includes the initial call from New.

2026-10-06 update: confirmed two unanswered calls total and mandatory explanation for any Lost transition, with unanswered and other reasons. Next: define whether New only or New + Not answered counts toward team routing.

2026-10-06 update: confirmed team-routing count = New + Not answered. Next: agree follow-up interval after first unanswered call; exact-time manual reminders already required.

2026-10-06 update: selected/disclosed 90-minute unanswered-call follow-up default within owner's offered range; exact-time override supported. Next: clarify working-hours handling.

2026-10-06 update: confirmed exact 90-minute automatic follow-up at all hours, retained as unread header notification. No working-hours deferral. Next: decide Lost reopening behavior.

2026-10-06 update: confirmed own-Lost reopening by agent into Contacted, preserving assignment/history. Next: cancellation of pending automatic reminders after lead status changes.

2026-10-06 update: Contacted/answered cancels pending automatic unanswered-call reminder; manual reminders retained. Next: equal-workload team-routing tie-break.

2026-10-06 update: confirmed rotating equal minimum-workload teams. Next: team-lead/team membership model.

2026-10-06 update: confirmed one permanent team lead/team and one team/agent. Added leave requests/balance/approval, temporary team-lead cover and SuperAdmin-configured commission calculations to MVP. Sales-based rate progression post-MVP only. Next: clarify percentage bases before any compensation implementation. New scope requires dedicated acceptance scenarios and permission review; difficulty is not yet estimated.

2026-10-06 update: agent commission confirmed as percentage of apartment sale price (default 1%; $100,000 -> $1,000). Next: team-lead percentage base.

2026-10-06 update: team-lead commission also based on apartment sale price (default 0.5%; $100,000 -> $500), separate from agent amount. Next: historical commission snapshot policy on Won.

2026-10-06 update: confirmed historical commission rates/amounts preserved on Won; subsequent rate changes affect future sales. Next: commission recipient during acting-team-lead cover.

2026-10-06 update: default acting-cover team-lead commission split 0.25% permanent / 0.25% acting; existing lead pool split, ordinary agent commission separate. Next: qualifying date for split and generalization to custom lead rates.

2026-10-06 update: acting-cover commission eligibility uses purchase-contract signing date, independent of delayed Won entry. Next: generalize equal split to customized team-lead rate.

2026-10-06 update: acting share auto = half default team-lead rate, adjustable, not half personal rate. Next: permanent lead remainder when rate customized.

2026-10-06 update: permanent lead keeps personal-rate remainder after acting share, without enlarging commission pool. Next: vacation approval for team lead and designation approval.

2026-10-06 update: SuperAdmin approves team-lead vacation/nominated cover in MVP; additional approval roles post-MVP. Next: exact acting-lead operational powers and self-approval boundaries.

2026-10-06 update: acting-lead operational powers confirmed, expiring automatically; team-wide Lost/Won excluded while own records remain visible. Next: treatment of existing leads when SuperAdmin transfers an agent between teams.

2026-10-06 update: owner requested team/agent leaderboards and rewards; policy/MVP boundary undecided. Proposed separating historical signing-date sales credit from current assignments before resolving transfers. Next: agreement on stable historical attribution and active lead transfer choice.

2026-10-06 update: skip team-size normalization/comparison concerns for now; scoring/reward rules and prior proposed transfer attribution still undecided. Next: owner decision on preserving past team sales credit and selecting active leads on transfer.

2026-10-06 update: confirmed historical Won credit retained and SuperAdmin-selected active lead transfers. Next: confirm leaderboard/rewards MVP boundary before score and reward formulas.

2026-10-06 update: team ranking primary = sold-property count; rejected earnings as team primary score. Next: confirm same property-count metric for agent ranking.

2026-10-06 update: agent and team leaderboard primary metric both sold-property count. Next: leaderboard reporting period.

2026-10-06 update: calendar-year overall leaderboard confirmed; monthly+annual versus annual-only requires clarification before implementation.

2026-10-06 update: leaderboard periods finalized: monthly teams, monthly individual agents, yearly individual agents; no annual team board. Next: ties in sold-property count.

2026-10-06 update: shared leaderboard ranks confirmed for equal sold-property counts. Next: contract-signing-date attribution for leaderboard periods.

2026-10-06 update: leaderboard period uses contract signing date, including late Won entry. Next: manual versus automatic MVP rewards and bonus recording.

2026-10-06 update: leaderboard discussion paused with agreed ranking rules; manual reward direction, no automatic formula. Next discovery area: public complex/apartment pricing and inventory presentation. Leave-policy and reminder edge cases remain tracked for later completion.

2026-10-06 update: public total + per-m² prices confirmed, hide control at complex/apartment, actual signed price private/admin separately. Next: visibility of reserved/sold inventory and sold-out floors.

2026-10-06 update: all statuses public, Available only filter and sold-out floor browsing accepted. Next: public price currency.

2026-10-06 update: confirmed USD/GEL price switcher. Next: automatically converted GEL from a stored base price versus independent manual prices.

2026-10-06 update: one editor-entered advertised amount plus source currency (USD/GEL, default USD), converted display currency. Next: total versus per-m² authoritative price entry.

2026-10-06: selectable total/per-m² price input confirmed; next discuss applicable apartment area.

2026-10-06: total apartment area including balconies confirmed for pricing. Next: reserved/sold apartment inquiry behavior.

2026-10-06: sold apartments visible red and non-interactive; similar-apartment inquiry proposal rejected. Next: reserved apartment interaction.

2026-10-06: reserved apartments non-interactive with distinct status color; only available units interactive. Next discovery topic: blog publication authority.

2026-10-06: direct blog publication by content-authorized users confirmed, no approval gate. Next: multilingual publication/translation completeness policy.

2026-10-06: blogs require all four languages; automatic translation is generated on writer action and reviewed by writer before direct publication. Next: whether complex descriptions follow same translation policy.

2026-10-06: complex descriptions require four languages and reviewed automatic translation like blogs. Next: default public language and language-switching behavior.

2026-10-06: initial browser-language detection and saved manual language choice confirmed. Next: unsupported-browser-language fallback.

2026-10-06: English fallback confirmed; saved choice > supported browser detection > English fallback (explicit URL behavior still open). Next: drafts for blogs/complexes.

2026-10-06: Won entry linked to exact apartment automatically marks inventory Sold. Next: reservation authority and trigger; draft/editor edge cases remain tracked.

2026-10-06: reservation authority confirmed for agents/team leads/SuperAdmin with scoped access; explicit action separate from Negotiation. Next: reservation expiry versus manual release.

2026-10-06: reservation review notification every 24h to agent/team lead with Keep/Remove actions instead of automatic expiry. Next: unanswered review notification behavior.

2026-10-06: unanswered reservation review repeats, preserves Reserved and escalates to SuperAdmin after two missed notifications/48h example. Next: one-response resolution and reset behavior.

2026-10-06: owner limited reservation escalation to SuperAdmin notification and manual contact; do not extend workflow. Move to launch complex inventory/cities.

2026-10-06: launch 2-3 complexes, Tbilisi/Batumi, Kutaisi possible. Next: existing Aura brand identity before UI direction.

2026-10-06: owner rejects Aura final name, no existing identity; premium naming research/candidates recorded. Workspace label retained temporarily. Next: select naming direction/shortlist, then check finalists before identity design.

2026-10-06: retain Aura mock name; compact landing summaries/project overview; About introduces teams; detailed services post-MVP. Next: public team presentation and exact route/navigation shape before UI prototype.

2026-10-06: compact landing direction accepted; About has individual agents with SuperAdmin-curated visibility. Next: central versus direct public agent contact.

2026-10-06: public profile contact numbers admin-configurable; central-only proposal not adopted. Next: admin account onboarding/invitations.

2026-10-06: team-lead agent creation sends email invitation with mandatory password setup/change; per-agent password update action required. Next: scoped password-reset authority.

2026-10-06: corrected password-update feature to self-service; no admin/team-lead password reset. Admin profile create/block/hide requested. Next: clarify blocked access versus hidden public visibility.

2026-10-06: owner rejects separate hide/block states; single deactivation/reactivation concept. Next: clarify only-SuperAdmin visibility applies to inactive or restored users; avoid implementation from ambiguous wording.

2026-10-06: owner reiterated only-SuperAdmin visibility for "reactivated users"; clarify restored agent visibility/assignment by concrete scenario before implementing.

2026-10-06: reactivation has restore-previous-team/setup versus configure-fresh options. Next: confirm same identity/history retained in fresh setup before specifying restored visibility/assignments.

2026-10-06: fresh reactivation keeps account/history, selects team/role/individual permissions anew. Next: deactivation of an agent with active leads.

2026-10-06: deactivation active-lead handling (team lead or auto split), explicit team auto-assignment, manual lead creation and Excel lead import confirmed. Next: within-team agent balancing metric.

2026-10-06: owner selects Aura Property as Georgian launch brand, superseding mock-only naming. Resume pending per-agent auto-assignment metric question.

2026-10-06: accepted within-team auto-assignment rules: minimal New+Not answered, tie rotation, leave/inactive exclusions, selected/unassigned scope, no reshuffle, team-lead fallback. Next: manual/Excel required lead contact fields.

2026-10-06: manual/Excel phone required, email optional; public form unchanged. Next: duplicate phone handling in Excel import.

2026-10-06: Excel duplicates skipped/reported, not overwritten. Next: duplicate detection scope across teams versus within importing team.

2026-10-06: company-wide Excel duplicate matching confirmed; report does not reveal other-team records. Next: initial manual/import stage.

2026-10-06: manual/Excel leads start New. Next: initial assignment after creation/import; existing team manual/auto actions remain.

2026-10-06: manual/import assignment choice confirmed: auto split or manual. Next: repeated website inquiry for existing active customer.

2026-10-06: repeat website inquiries get same agent/new lead + duplicate note, mandatory OTP for duplicates; first-time optional OTP retained. Next: duplicate acceptance/routing after OTP sequence.

2026-10-06: duplicate inquiry remains pending until OTP succeeds, then enters board; no prior-lead/workload mutation during pending. Next: fallback when matching agent unavailable.

2026-10-06: unavailable matched agent repeat-inquiry fallback confirmed to team lead. Next discovery area: leave calendar/workweek; unresolved availability edge cases retained.
