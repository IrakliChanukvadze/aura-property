# Decision ledger
Last updated: 2026-10-06
Source for confirmed entries: owner conversation in this Codex chat.

| ID | Status | Decision |
|---|---|---|
| D-001 | Confirmed | Standalone Aura Property project; no Pini data/runtime relationship in MVP. |
| D-002 | Confirmed | Copy/adapt Pini complex-upload, interactive explorer, and project/apartment inquiry logic; separate Aura UI. |
| D-003 | Confirmed | Complexes only, located in Georgia; target buyers in Georgia, Russia, Israel. |
| D-004 | Confirmed | Georgian, Russian, Hebrew, English public languages. |
| D-005 | Confirmed | Include blogs. |
| D-006 | Confirmed | Phone/WhatsApp contact and inquiry forms. |
| D-007 | Confirmed | Admin lead Kanban and comments; SuperAdmin, team leads, agents, editors. |
| D-008 | Confirmed | Extra content permissions granted per user; never grant to an entire role implicitly. |
| D-009 | Confirmed | Automatic team routing balances not-yet-contacted lead counts; team lead assigns agents. |
| D-010 | Confirmed | Save lead first; optional OTP afterward. |
| D-011 | Confirmed | Existing Pini form inputs/logic are baseline, including name/phone/email and project/unit context. |
| D-012 | Confirmed direction | Cloudflare deployment; architecture not selected. |
| P-001 | Resolved by D-030 | Count team leads in New + Not answered regardless of agent assignment; excluded stages do not contribute. |
| P-002 | Rotation resolved by D-035 | Owner approved rotating equal-count ties; atomic assignment remains a correctness requirement for implementation. |
| P-003 | Proposed, not agreed | SuperAdmin inbox fallback when no team can receive inquiries. |
| P-004 | Proposed, not agreed | Dedicated contacted action/timestamp, independent from comments or assignment. |
| P-005 | Proposed, not agreed | Warm editorial design inspired by Modern House; no approved visual direction yet. |

| D-013 | Confirmed | Active-lead Kanban starts with New and Not answered; further active columns under discussion. |
| D-014 | Confirmed | Maximum two unanswered calls, then Lost outside active board with comments; counting semantics still open. |
| D-015 | Confirmed | Separate Lost table and Won table; Won records customers who bought something. |
| D-016 | Confirmed | Automatic follow-up notifications plus comment-associated reminders scheduled at an exact time. |
| D-017 | Confirmed future-only | Calling providers and AI call listening/transcription/notes are excluded from MVP. |

| D-018 | Confirmed | One Contacted column for MVP; needs and apartment interest recorded in comments. Revisit based on actual team feedback. |

| D-019 | Confirmed | SuperAdmin creates users across roles and controls per-user permissions; sole-owner SuperAdmin restriction remains. |
| D-020 | Confirmed | Team leads create agents only, automatically assigned to their own team. |
| D-021 | Confirmed | SuperAdmin can change an agent's team; lead/reminder transfer policy not yet agreed. |

| D-022 | Confirmed | Viewing scheduled is a separate active Kanban column. |
| D-023 | Confirmed | Users see admin notifications in the header. |

| D-024 | Confirmed | Negotiation is a separate active Kanban column for specific apartment price/purchase-term discussions. |

| D-025 | Confirmed | Won requires a signed purchase contract; agent manually moves their lead to Won in MVP. |
| D-026 | Confirmed | Won uses ordinary lead visibility: all for SuperAdmin, own team for team leads, own leads for agents. |
| P-006 | Resolved by D-027 | Earlier scoped Lost-access proposal superseded by equal permissions across Active, Lost, and Won. Team-lead-only reopening was not accepted. |

| D-027 | Confirmed | Lost has the same permissions as Active and Won: SuperAdmin all, team leads own team, agents own records. No Lost-only permission restrictions. |

| D-028 | Confirmed | Two unanswered calls total: initial New call counts; first -> Not answered, second -> Lost with required explanation. |
| D-029 | Confirmed | Lost supports unanswered and other agent-recorded reasons; every Lost transition requires an explanatory comment. |

| D-030 | Confirmed | Automatic team routing balances counts of New + Not answered; other stages and Lost/Won excluded. |

| D-031 | Superseded by D-032 | Initially selected 90-minute default within owner-offered range; later confirmed exact automatic timing regardless of working hours. |

| D-032 | Confirmed | Automatic unanswered-call follow-up fires exactly 90 minutes later, regardless of working hours, and appears as an unread header notification. No next-morning deferral. |

| D-033 | Confirmed | Agent can reopen their own Lost lead into Contacted when customer returns; preserve assignment and history. |

| D-034 | Confirmed | Move to Contacted/answered cancels pending automatic unanswered-call reminder; manual reminders remain separate. |

| D-035 | Confirmed | Rotate between teams tied for the lowest New + Not answered backlog. |

| D-036 | Confirmed | One permanent team lead per team and one team per agent; teams separate. |
| D-037 | Confirmed MVP | Vacation requests/scheduling, annual balance and team-lead approval; owner requested 24 days annually. Working-day/legal and organization details recorded separately. |
| D-038 | Confirmed MVP | Vacationing team lead can designate an agent as temporary team lead; delegated authority and dates need agreement. |
| D-039 | Confirmed MVP | Commission tracking; SuperAdmin alone sets rates; requested defaults agent 1%, team lead 0.5% of team earnings. Calculation bases unresolved. |
| D-040 | Confirmed post-MVP | Automatic sales-based commission progression deferred; 2 sales/month -> 1.1% is an illustrative idea, not a binding rule. |

| D-041 | Confirmed | Agent percentage applies to apartment sale price: 1% of $100,000 = $1,000. Team-lead base remains unresolved. |

| D-042 | Confirmed | Team lead percentage also applies to apartment sale price: 0.5% of $100,000 = $500, separately from agent commission. |

| D-043 | Confirmed | Won sales retain closing commission rates and amounts; later percentage changes affect future sales only. |

| D-044 | Confirmed default; generalization open | During temporary cover, default 0.5% team-lead commission splits 0.25% permanent lead / 0.25% acting agent. Custom-rate split and qualifying sale dates still need agreement. |

| D-045 | Confirmed | Contract signing date within the temporary-cover period determines the split; delayed Won entry does not change eligibility. |

| D-046 | Confirmed | Acting share automatically equals half of the default team-lead rate (currently 0.25%); adjustable by SuperAdmin under existing authority. Not half of permanent lead personal rate. Permanent share rule for custom rates open. |

| D-047 | Confirmed | Permanent lead share = personal lead rate minus acting share; 0.8% personal and 0.25% acting -> 0.55% permanent. |

| D-048 | Confirmed MVP | SuperAdmin approves team-lead vacation and nominated acting replacement; team leads approve agent vacations. |
| D-049 | Confirmed post-MVP | Additional approval/management roles deferred beyond MVP. |

| D-050 | Confirmed | Acting lead has temporary own-team active-lead visibility, assignment, agent creation, and other-agent leave approval; automatically expires; no self-approval or commission-rate changes. |
| D-051 | Confirmed | Acting lead cannot see team-wide Lost/Won. Ordinary access to their own Lost/Won remains. No content permission inheritance. |

| D-052 | Requested; scope/rules pending | Team/agent leaderboards and potential company-income/team and individual rewards. MVP boundary, metric, period, formulas and distribution not decided. |
| P-007 | Partially resolved by D-054 | Past Won agent/team credit fixed; SuperAdmin selects active leads for transfer. Exact mid-sale signing attribution and Lost transfer details remain open. |
| P-008 | Proposed, not agreed | Monthly confirmed Won counts with agency-earnings supporting metric; automatic rewards not yet specified. |

| D-053 | Confirmed planning boundary | No team-size normalization/fairness analysis now; owner expects similar team sizes and relies on lead balancing. Leaderboard metrics and transfer policy remain open. |

| D-054 | Confirmed | Past Won sales keep original agent/team credit; SuperAdmin chooses active leads that move with transferred agent. |

| D-055 | Confirmed | Team leaderboard ranks primarily by sold-property count; team earnings is rejected as primary metric. |

| D-056 | Confirmed | Agent leaderboard also ranks primarily by sold-property count. |

| D-057 | Confirmed annual; monthly clarification pending | Calendar-year overall leaderboard requested. Determine whether monthly rankings also remain, given ambiguous reply to monthly proposal. |

| D-058 | Confirmed; clarifies D-057 | Monthly teams, monthly individuals, yearly individuals. Calendar periods; no yearly team leaderboard in current scope. |

| D-059 | Confirmed | Equal sold-property counts share ranking; no earnings tie-break. Reward handling for ties remains separate. |

| D-060 | Confirmed | Leaderboard month/year uses contract signing date; delayed Won entry does not shift the sales period. |

| D-061 | Confirmed planning boundary | Keep agreed rankings; rewards manual for now, no automatic reward formula. Move to other business topics; detailed reward administration not defined. |

| D-062 | Confirmed | Display public total and per-m² prices, with hiding available for a particular complex or apartment. |
| D-063 | Confirmed | Actual signed sale price remains separate in admin from public advertised pricing. |

| D-064 | Confirmed | Public visitors see available, reserved and sold inventory; clear labels, Available only filter, browsable sold-out floor plans. |

| D-065 | Confirmed | Public USD/GEL currency switcher for apartment pricing; base currency and conversion policy still open. |

| D-066 | Confirmed | Editor enters one price amount with USD/GEL source currency, default USD; other display currency derived rather than manually maintained. |

| D-067 | Confirmed | Editor selects total/per-m² entry; system calculates the other from apartment area. USD/GEL selection and USD default retained. |

| D-068 | Confirmed | Pricing uses total apartment area including balconies. |

| D-069 | Confirmed | Sold apartments are red, non-interactive floor-plan regions; no details/inquiry or similar-apartment action. Reserved behavior still open. |

| D-070 | Confirmed | Reserved apartments also non-interactive and visually distinct from sold red; only available inventory interactive. |

| D-071 | Confirmed | Content-authorized users publish blog articles directly; no SuperAdmin approval gate. |

| D-072 | Confirmed | Blogs need all four language versions; writer can trigger automatic translation and must verify translations before direct publication. |

| D-073 | Confirmed | Complex descriptions also require all four languages with automatic translation and editor review before publication. |

| D-074 | Confirmed | Detect supported browser language initially; save manual language choice and prefer it on subsequent visits. |

| D-075 | Confirmed | English default/fallback for unsupported browser language; saved choice and supported browser matching remain in effect. |

| D-076 | Confirmed | Manual move to Won with exact purchased apartment selected automatically marks that apartment Sold on the website. |

| D-077 | Confirmed | Explicit reservations: agent own lead, team lead own team, SuperAdmin all. Negotiation alone does not reserve inventory. |

| D-078 | Confirmed | Reserved apartments trigger agent + team-lead review notification every 24 hours, with Keep/Remove actions; no automatic expiry simply at 24 hours. |

| D-079 | Confirmed | Reservation stays Reserved on no response; after both miss two reviews (48h example), notify SuperAdmin. |

| D-080 | Confirmed scope boundary | After missed-review escalation, notify SuperAdmin and stop; owner follows up manually. No extra escalation workflow. |

| D-081 | Confirmed launch expectation | 2-3 complexes at launch; Tbilisi and Batumi confirmed, Kutaisi possible. |

| D-082 | Confirmed | Replace Aura Property as final brand due to owner-reported naming collision; premium naming and new visual identity required. Existing workspace label temporary. |

| D-083 | Confirmed | Keep Aura Property as mock name for MVP; final naming later, configurable brand. |
| D-084 | Confirmed | Compact landing with brief About/services, project count and projects; About introduces teams. Avoid huge scroll. |
| D-085 | Confirmed scope boundary | Detailed services added after MVP; only brief landing summary/list now, without invented service claims. |

| D-086 | Confirmed | Public individual-agent presentation on About; SuperAdmin curates which people are shown from admin, separate from account creation. |
| D-087 | Confirmed direction | Compact hero/projects/About-Services/contact landing; detailed About/team, projects and Blog separate. Services detailed scope still deferred. |

| D-088 | Confirmed | Public agent contact numbers are chosen/configured from admin; not forced to shared central numbers or copied automatically from account data. |

| D-089 | Confirmed | Team-lead-created agents receive email invitation and must set/change password before admin access. |
| D-090 | Confirmed feature; authority pending | Password-update field/action for every agent; reset permissions/workflow still to agree. |

| D-091 | Confirmed; clarifies D-090 | Password update is self-service; no SuperAdmin/team-lead password editing or resets for others. Administrators create/block/hide profiles. Block login effect still requires clarification. |

| D-092 | Confirmed correction | Blocking/hiding are one action/state; separate hide/block controls rejected. Only-SuperAdmin visibility statement needs clarification of "reactivated" versus "deactivated". |

| D-093 | Owner wording reiterated; operational scope pending | Owner repeated "only SuperAdmin sees reactivated users" after a question contrasting inactive records and restored visibility. Preserve wording; clarify restored-agent team visibility/assignment with an operational example before implementation. |

| D-094 | Confirmed options; details pending | Reactivation can restore previous team/setup or configure from scratch. Historical-data deletion/new identity not authorized. |

| D-095 | Confirmed | Fresh reactivation reuses account/history; SuperAdmin selects team/role/permissions anew. No history deletion. |

| D-096 | Confirmed | Agent deactivation active-lead reassignment offers team-lead inbox or automatic distribution within team. |
| D-097 | Confirmed | Team lead can trigger automatic lead assignment in their team. |
| D-098 | Confirmed | Team lead can manually create leads and import leads from Excel. |

| D-099 | Confirmed brand choice; supersedes D-082/D-083 mock-only direction | Use Aura Property for Georgian launch; owner reports prior name matches in India/UK. Registry/domain/trademark availability not assessed. |

| D-100 | Confirmed | Agent auto-assignment balances New + Not answered with rotation on ties; inactive/on-approved-vacation agents excluded. |
| D-101 | Confirmed | Assign selected/unassigned leads, no automatic reshuffling; explicit deactivation redistribution retained. No eligible agent -> team lead/manual assignment. |

| D-102 | Confirmed | Manual/Excel leads: phone required, email optional. Public form requirements unchanged. |

| D-103 | Confirmed | Excel import reports/skips duplicate phone rows without overwriting lead history. Matching scope still open. |

| D-104 | Confirmed | Excel duplicate detection across the company; privacy-safe duplicate report, no other-team details. |

| D-105 | Confirmed | Manual and Excel-imported leads initially enter New. |

| D-106 | Confirmed | Team lead chooses auto-distribution or manual assignment for newly created/imported leads. |

| D-107 | Confirmed | Website repeat inquiry becomes a lead assigned to same agent with existing-contact/duplicate system comment; not ordinary redistribution. |
| D-108 | Confirmed exception | Duplicate-phone website inquiries require OTP and existing-inquiry verification message; first-time-number optional OTP unchanged. |

| D-109 | Confirmed | Duplicate public inquiry enters agent board only after successful OTP; pending beforehand, existing lead/workload unchanged. |

| D-110 | Confirmed | Verified repeat inquiry with deactivated/on-vacation previous agent goes to their team lead for reassignment. |

| D-111 | Partially confirmed | Five working days/week, rest days flexible and schedule undecided. Annual leave target 24 days; gradual accrual desired, exact cadence/counting pending. |

| D-112 | Confirmed | Vacation accrues two days/month, 24/year; deduct scheduled working days only, excluding regular rest days. |

| D-113 | Confirmed | Approved vacation may use advance allowance, with a hard minimum balance of -2 days. |

| D-114 | Confirmed | Unused vacation carries forward indefinitely without expiry, annual reset or carryover cap. |

| D-115 | Confirmed | Add two vacation days after each completed month of employment, starting from the joining date. |

| D-116 | Confirmed | Team lead fills their agents’ weekly work/rest schedules; scheduled working days determine vacation deductions. |

| D-117 | Confirmed; broader scope pending | Team leads fill their own schedules; SuperAdmin approves their schedules and vacations. Whether owner also approves every agent schedule/vacation needs clarification. |

| D-118 | Confirmed | SuperAdmin approves team leads’ own schedules/vacations. Team leads fill agent schedules and approve agent vacations; no company-wide owner approval gate. |

| D-119 | Confirmed | Recurring weekly work/rest schedules with exceptions for specific dates. Existing scoped schedule authority and approval rules apply. |

| D-120 | Confirmed | Approved leave deductions stay fixed; schedule changes affecting approved leave require review/reapproval rather than silent balance recalculation. |

| D-121 | Confirmed | Pending vacation can be withdrawn directly. Approved vacation requires a cancellation request and approval by the existing authorized approver before restoring its deducted days. |

| D-122 | Confirmed | Early return from started vacation requires approval; restore only unused vacation days, retaining consumed days. |

| D-123 | Confirmed | Approved team-lead early return ends acting authority and commission split on the approved return date; historical sale attribution remains preserved. |

| D-124 | Confirmed | Users can request Won-sale reversal with a required detailed explanation, within existing access scope; SuperAdmin approval is required. |

| D-125 | Confirmed exception | Sale-reversal request immediately removes the disputed sale from applicable leaderboard counts; sale reversal itself still needs SuperAdmin approval. |

| D-126 | Confirmed; supersedes D-124/125 approval flow | Move Won leads out immediately with detailed reason, notify SuperAdmin automatically, and adjust leaderboards automatically. No approval gate. |

| D-127 | Confirmed | Moving a lead out of Won allows selection of an active column or Lost, with required detailed explanation and automatic owner notification/ranking adjustment. |

| D-128 | Partially confirmed | Won-to-active reversal requires Available/Reserved apartment choice. Lost lead destination is confirmed; automatic apartment result for Lost requires clarification. |

| D-129 | Confirmed | Won-to-Lost reversal automatically releases the linked apartment to Available; Won-to-active requires Available/Reserved selection. |

| D-130 | Confirmed | Sale reversal automatically removes all associated agent/team-lead/acting-lead commissions from calculated earnings, preserving original amounts and reversal history. |

| D-131 | Confirmed | Agents see own commissions; permanent team leads see own and team commissions; SuperAdmin sees everything. |

| D-132 | Confirmed | Acting leads see only their own commissions, including acting-lead share; no team-wide commission or Won visibility. |

| D-133 | Confirmed MVP boundary | Commission MVP shows calculated earnings only. Financial administration and automation are post-MVP; no Paid tracking or payouts now. |

| D-134 | Confirmed | Move to Won before document upload; automatic board/earnings/ranking/inventory updates, then mandatory agreement/supporting-document upload. Calculation inputs and document follow-up details pending. |

| D-135 | Confirmed | Complete sale information when moving to Won, including actual final price and first client deposit; price prefilled from listing for confirmation. Documents follow afterward. |

| D-136 | Confirmed | Add active near-Won/final-details column after Negotiation. No-deposit sale cannot become Won; existing signed-sale and completed-details requirements remain. Final column label pending. |

| D-137 | Confirmed | Won accepts any positive first-deposit amount; no universal or project-specific minimum threshold enforced. Project deposit terms vary. |

| D-138 | Confirmed | Agreements/supporting files follow lead visibility: agent own, permanent lead team, SuperAdmin all; enforce server-side file access. |

| D-139 | Confirmed | Agreement upload due within 48 hours of Won transition; overdue unread reminder to agent and team lead remains outstanding until agreement upload. |

| D-140 | Confirmed approach | Reuse/adapt Pini upload approach for agreements/supporting files, with private lead-scoped access. Pini has distinct image and PDF flows, not a verified agreement module. |

| D-141 | Confirmed; supersedes mandatory-upload portions of D-134/139 | Keep agreement/supporting-file uploads optional in MVP. Remove mandatory deadline and overdue-document reminders; Won sale-data requirements remain. |

| D-142 | Confirmed | A single lead/customer may buy multiple apartments; track sale information and inventory per apartment, with sold-property counts and corresponding commissions. |

| D-143 | Confirmed | Reverse individual apartment sales independently; other completed purchases remain Won with unchanged commissions, inventory and ranking credit. |

| D-144 | Confirmed | Completed sales remain in Won; ongoing purchase can appear as an active card linked to the same customer. Customer, purchase opportunity and apartment sale need distinct records. |

| D-145 | Confirmed | Default sale/payment currency GEL, USD entry allowed. Leaderboard monetary amounts display GEL with USD conversion; ranking remains sold-property count. |

| D-146 | Confirmed | Lock USD-sale GEL conversion to contract-signing-date rate; preserve original amount and rate snapshot, with no later exchange-driven historical recalculation. |

| D-147 | Confirmed | Display commission earnings in GEL; USD sales use the same fixed signing-date conversion snapshot as leaderboard monetary figures. |

| D-148 | Confirmed | First deposit has independent USD/GEL selector, default GEL; deposit and sale currencies may differ. |

| D-149 | Confirmed | First deposit received date is required at Won transition, alongside positive received deposit amount and currency. |

| D-150 | Confirmed | Agents can manually create one lead per submission and import Excel leads for themselves, with existing scoped validation/duplicate rules. |

| D-151 | Name confirmed; origin field definition pending | Manual/Excel leads require customer name and phone. Add requested customer-origin field after clarifying country/nationality versus ethnicity and requiredness. |

| D-152 | Confirmed | Customer-origin field means country/nationality, separate from preferred language; not ethnicity. Requiredness/public-form scope pending. |

| D-153 | Confirmed | Country/nationality required for manual/Excel leads; Unknown is an accepted value. Public-form scope pending. |

| D-154 | Confirmed | Public inquiry forms include optional country/nationality; omitted value is Unknown, never inferred. |

| D-155 | Confirmed | Public inquiry phone required, email optional; adapt Pini required-email validation. Existing first-time/duplicate phone OTP rules remain. |

| D-156 | Confirmed | Agents may edit contact details on their own leads; changes are recorded in history. |

| D-157 | Confirmed | Block edited phone that conflicts with another company customer; report duplicate without merging or exposing inaccessible records. |

| D-158 | Confirmed | Agents can edit own comments with version history preserved; cannot delete comments. |

| D-159 | Confirmed | Team leads follow own-comment editing/no-deletion rule. SuperAdmin can delete user comments; deletion is recorded in audit history. |

| D-160 | Confirmed | Only SuperAdmin can export CRM lead/customer data; server-side restriction, no other role export access. Imports remain allowed as agreed. |
| D-161 | Post-MVP direction | Hide customer phone numbers when direct CRM calling is introduced; masking scope/provider details deferred. |

| D-162 | Confirmed | MVP operational notifications are admin-header only; no reminder/approval emails, SMS or push. Account invitation and verification flows remain separate. |

| D-163 | Confirmed | Per-user saved admin language: Georgian, Russian, Hebrew or English; selectable at setup/settings, Hebrew RTL supported. |

| D-164 | Confirmed | All MVP admin functionality supports mobile and desktop, with touch-friendly responsive layouts and Hebrew RTL. |

| D-165 | Confirmed MVP boundary | Intake only website inquiries, single manual lead creation and Excel import; source labels do not add integrations. |
| D-166 | Post-MVP notes | Unified WhatsApp/Gmail/Facebook/Instagram/Telegram/social inbox, direct CRM replies and AI-generated leads deferred. |

| D-167 | Confirmed | Excel preview flags invalid/duplicate rows; after confirmation import valid rows only and report skipped rows. |

| D-168 | Confirmed | MVP imports use a downloadable fixed-column Excel template; arbitrary column mapping deferred. |

| D-169 | Confirmed | Only SuperAdmin can delete leads, only from Lost. Active/Won deletion forbidden for everyone; first follow the required Lost/reversal workflow. |

| D-170 | Confirmed | Lost-lead deletion requires SuperAdmin confirmation; permanent deletion with no recycle bin or application restore feature. |

| D-171 | Confirmed | Dashboard includes scoped New/active/Lost/sold-apartment counts and earnings, leaderboards, and compact latest-three accessible Won entries. |

| D-172 | Confirmed | Dashboard defaults to monthly view with month/year selection for historical figures. |

| D-173 | Confirmed | Selected month shows leads received, sales signed and earnings for that month; New/active/Lost counts are labelled current totals. |

| D-174 | Confirmed | Scoped CRM search/filters: name/phone, project, agent, stage, source and date range. |

| D-175 | Confirmed | Save preferred contact language on website inquiries, default from submission locale; authorized staff may update it later. |

| D-176 | Confirmed | Agent-vacation approval includes an option for the team lead to reassign active leads; detailed selection/timing/return behavior pending. |

| D-177 | Confirmed | Vacation approval supports selecting some/all active leads, then manual recipient choice or automatic within-team distribution. |

| D-178 | Confirmed | Vacation lead reassignment is optional and executes at vacation start; unselected leads stay assigned to original agent. |

| D-179 | Confirmed | Vacation-reassigned leads stay with new agents after return; moving them back requires manual team-lead reassignment. |

| D-180 | Confirmed | Reassignment transfers pending follow-ups and future reservation notifications to new agent, preserving original timing. |

| D-181 | Confirmed | Agents can reschedule/cancel/complete manual follow-ups on own leads, with action history. Automatic unanswered reminders retain existing rules. |

| D-182 | Confirmed | Manual Log call action with Answered/No answer and comment, enforcing existing attempt, stage and reminder rules. |

| D-183 | Confirmed | Every logged call requires a comment, for both Answered and No answer outcomes. |

| D-184 | Confirmed | After an answered call, Lost is an agent decision requiring team-lead approval and explanation. Later missed follow-ups do not auto-close; initial two-unanswered rule remains. |

| D-185 | Confirmed; supersedes D-184 pending placement | Answered lead moves immediately to Lost with review flag; team lead confirms Lost or returns it to agent. Detailed explanation and history required. |

| D-186 | Confirmed | Returning a flagged Lost lead restores its previous active column and agent assignment, preserving review history. |

| D-187 | Confirmed | SuperAdmin can perform all other-role actions globally, including Lost reviews; cannot change others’ passwords. Existing explicit workflow rules remain. |

| D-188 | Confirmed | Flagged Lost entries trigger a header notification to the permanent team lead for review. |

| D-189 | Confirmed | Automatic Lost after two initial unanswered calls is also flagged for team-lead review and header notification. |

| D-190 | Confirmed | SuperAdmin can delete Lost leads before or after review, with deletion confirmation; Lost-only restriction remains. |

| D-191 | Confirmed | Reserved lead moving to Lost immediately releases its apartment to Available, without waiting for Lost review. |

| D-192 | Confirmed | Reopened Lost leads require an explicit new reservation and fresh availability check; former reservation is not restored automatically. |

| D-193 | Confirmed | Permanent team-lead-authored Lost moves are reviewed immediately; explanation/history required, no pending self-review. |

| D-194 | Confirmed MVP reduction | Remove Won-to-Lost reversal from MVP. Scope of Won-to-active and SuperAdmin correction still requires clarification. |

| D-195 | Confirmed MVP reduction | Won is terminal for agents/team leads: no return to active or Lost and no per-apartment reversal. New linked purchases remain supported. SuperAdmin exception pending. |

| D-196 | Confirmed | SuperAdmin alone retains exceptional Won correction/reversal, using existing detailed-reason, per-apartment inventory/commission/ranking correction rules. |

| D-197 | Confirmed | Won transition requires a confirmation summary of apartment, actual price, deposit and signing date before saving. |

| D-198 | Confirmed | SuperAdmin sets apartment minimum prices/discount limits; agents may discount within those limits. |

| D-199 | Confirmed | Minimum apartment sale prices remain private in admin; public website shows advertised prices only. |

| D-200 | Confirmed | Without a configured apartment minimum, advertised price is the discount floor; no lower agent price allowed. |

| D-201 | Confirmed | Owner sets minimum and sale price in the same currency; MVP discount checks use direct comparison without FX conversion. |

| D-202 | Confirmed | No project catalogue filters for MVP; anticipated maximum roughly five projects, no enforced creation cap. |
| D-203 | Confirmed | Apartment explorer filters: price range, area, bedroom count and Available only; matching plan regions highlighted, others muted; floor navigation separate. |

| D-204 | Confirmed MVP boundary | No matching-apartment counts on floors; retain apartment explorer filters and plan highlighting. |

| D-205 | Confirmed | No public customer registration/login; anonymous browsing and inquiry submission. Staff admin authentication and inquiry OTP remain separate. |

| D-206 | Confirmed | Blog title/body/publication date, optional cover image; no public comments. Existing translation/publishing rules remain. |

| D-207 | Confirmed | Save unfinished blogs as private drafts; publish directly when required fields and four reviewed translations are complete. |

| D-208 | Confirmed | Authorized editors can unpublish blogs back to private draft and later republish under existing validation rules. |

| D-209 | Confirmed | Complexes use private Draft / Published controls, with direct publication after explorer/content/translation completion. |

| D-210 | Confirmed | Keep completed complexes public with Ongoing/Completed labels. Exact status meaning and assignment pending. |

| D-211 | Confirmed | Ongoing/Completed is construction status; Aura Sold out is a separate sales status. |

| D-212 | Confirmed | Sold out is automatic when all listed apartments are Sold; Reserved is not Sold and construction status remains independent. |

| D-213 | Confirmed | Sold-out projects show Explore other projects instead of project inquiry; general agency contact remains. |

| D-214 | Confirmed | Public project cards show city, construction status, starting price, cover image and separate Sold out label. |
| D-215 | Post-MVP note | Possible richer project details and project-type filter (e.g. residential/hotel); no MVP scope expansion. |

| D-216 | Confirmed | Project starting price uses cheapest Available apartment’s advertised price; exclude Reserved/Sold and private minimum prices. |

| D-217 | Confirmed | All-reserved remaining inventory shows “All remaining apartments reserved” instead of starting price; not Sold out. |

| D-218 | Confirmed | All-reserved projects still accept general project inquiries; agents can offer alternatives. Reserved apartments stay noninteractive; no Pini integration added. |

| D-219 | Confirmed | Manual lead creation does not require a project; one can be selected later. |

| D-220 | Confirmed | Excel lead import project field is optional; blank project does not invalidate the row. |

| D-221 | Confirmed | Leads support multiple optional projects of interest; exact apartment/project linkage remains required per completed sale. |

| D-222 | Confirmed | Optional lead budget range with USD/GEL selector; no requirement to fill it. |

| D-223 | Confirmed | Viewing date/time, optional location and advance header reminder for assigned agent; reminder lead time pending. |

| D-224 | Confirmed | Viewing header reminder is due one hour before appointment. |

| D-225 | Confirmed | Viewing calendar scoped to agent own, permanent lead team and SuperAdmin all. |

| D-226 | Confirmed | Admin calendar includes viewings, approved vacations and scheduled follow-up calls under existing access scope. |

| D-227 | Confirmed | Unified lead timeline combines comments, calls, stages, assignments, reservations and sale events under existing access rules. |

| D-228 | Confirmed correction | Only SuperAdmin sees deactivated user profiles; reactivated users return to ordinary team/role visibility. Earlier “reactivated” wording was a mistake. |

| D-229 | Confirmed clarification | Deactivation immediately blocks login and invalidates existing sessions automatically; enforce server-side. |

| D-230 | Confirmed direction | Public light/dark modes, animations and restrained premium details. Initial editorial direction liked; agency-wide hero still under discussion. |

| D-231 | Confirmed design update, 2026-10-07 | Owner selected the first cinematic homepage concept and requested richer scroll animations and depth. A longer editorial homepage is approved, superseding the earlier preference for a short landing page. Retain separate project introduction, whole-complex overview and block/floor exploration URLs; keep both configurable hero approaches. Selected visual and implementation evidence are recorded in AURA-022. |

| D-232 | Confirmed explorer update, 2026-10-07 | Remove A/B tabs from the filter bar. Buildings sharing a cover image expose their floor hover/click regions simultaneously; clicking a region selects its building and floor together. Retain compact selection context beside floor controls and fallback access when images/annotations differ. |

| D-233 | Confirmed translation update, 2026-10-08 | Copy Pini’s working OpenRouter translation endpoint and structured-output/prompt approach into Aura, adding Hebrew. Owner confirmed reuse of the same OpenRouter account and exact key for combined billing and usage. Owner approved a $10/month combined provider spending cap on the shared key; dashboard configuration was applied and verified on 2026-10-08 (changed from weekly to monthly). The cap applies jointly to Pini and Aura. Supersedes the AURA-026 recommendation to require a new OpenAI account/key for launch; OpenAI remains an optional adapter. Pini source/config and credentials are not modified or copied. |
