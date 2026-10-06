# Open questions
Last updated: 2026-10-06
Ask consequential questions in sequence; answers update the rules and decision ledger.

## Next: lead lifecycle
OQ-001 New, Not answered, Contacted, Viewing scheduled, and Negotiation are confirmed. Decide remaining active columns and entry/exit criteria. Two unanswered calls total are confirmed, including the initial call. Team balancing count confirmed as New + Not answered (D-030).
OQ-002 Can agents move stages themselves? Who closes, reopens, or reassigns leads?
OQ-003 Team membership: one/multiple leads per team, one/multiple teams per agent; active/inactive eligibility and absence handling.
OQ-004 Routing tie-breaks, no eligible teams, repeated inquiries/duplicates, manual leads, and later reassignment.
OQ-005 Comment visibility, editing/deletion, activity history; exact meaning of team-work reporting.

## Inquiry and verification
OQ-006 OTP delivery channel/provider and target-number coverage; retries, expiry, cost controls, phone changes, verification badges and privacy.
OQ-007 Manual phone/WhatsApp inquiry entry; notification channels and responsible recipient; confirm direct contact destinations.

## Complex inventory and content
OQ-008 Launch complexes, cities, buildings, assets, developer relationships, inventory-maintenance owner, upload format, pricing visibility/currency, sold/reserved visibility.
OQ-009 Content permission granularity, drafts/publishing, blog categories/authorship, article languages, translation workflow and missing-translation policy.
OQ-010 Default language, locale switching, admin language, locale-specific typography and Hebrew layouts.
OQ-011 Brand assets, services/story/team, real imagery, credibility material and approved visual reference.

## Operations
OQ-012 Admin authentication/invitations, owner account recovery, operational retention/export needs.
OQ-013 Domain, Cloudflare deployment topology, preview/staging/production, media/database/backup choice, analytics, deadline and ongoing maintenance.

Do not add booking, payment, customer accounts, saved searches, individual houses, or Pini integrations without an explicit decision.

## Follow-up and closed-lead details
OQ-014 How does an agent record a call/result in MVP? Default follow-up interval, notification channel, timezone display, overdue handling, reminder ownership on reassignment, cancellation, and completion.
OQ-015 Second unanswered attempt leads to Lost; every Lost transition requires explanation. Decide whether a logged call outcome includes that comment or opens a required loss-confirmation action. Can Lost/Won be reopened and under which transition rules? Visibility/permissions are confirmed equal across Active, Lost, and Won.
OQ-016 Won criterion confirmed: signed purchase contract, with manual move by agent. Decide linked apartment/complex and required closure details/evidence. Scope of deal tracking is not yet agreed.

All five active columns are confirmed: New, Not answered, Contacted, Viewing scheduled, Negotiation. Transition, skipping, reopening, and closure criteria remain open. A reminder/follow-up time may belong to any stage and need not be a separate column.

OQ-017 User creation: invitation/account activation versus administrator-set credentials; required user fields. Does a team have one team lead or several?
OQ-018 On agent team transfer, do existing leads remain in their original team and require reassignment, or transfer with the agent? Resolve reminder ownership and historical access without leaking other teams' leads.

Viewing scheduled is now confirmed. Decide appointment/reminder fields and post-viewing behavior.

OQ-019 Negotiation is confirmed. Appointment date/time requirements, rescheduling, cancellation/no-show behavior, notification recipient/read state, and default reminder timing remain open. Header notifications are confirmed; other channels are not.

OQ-020 Resolved visibility/permission scope: Lost equals Active and Won (D-027). Remaining: general reopening/transition behavior and impact on team routing. No team-lead-only reopening restriction was approved.

OQ-021 Resolved by D-030: New + Not answered. Remaining routing details: eligibility, equal-count tie-break, no eligible team fallback, and repeated inquiries.
OQ-022 Optional structured Lost reason list beyond confirmed Unanswered and Other; a free-text explanation is mandatory in every case.

OQ-023 Resolved by D-032: automatic reminder fires exactly 90 minutes later regardless of working hours and is available unread. Manual reminders fire at their selected time. Exact-time display timezone remains open.

OQ-024 Resolved by D-033: agents reopen their own Lost leads into Contacted, retaining assignment and history. Won reopening/correction remains separate and undecided.

OQ-025 Contacted cancels pending automatic unanswered-call reminders (D-034), while manual reminders remain. Still open: automatic-reminder cancellation on Lost/Won and handling already-delivered unread notifications; do not infer deletion of delivered notifications.

OQ-026 Rotation for equal minimum counts is confirmed (D-035). Stable tie-break/cursor is an implementation detail; eligible-team membership and no-team fallback remain open.

## New MVP: leave and commissions
OQ-027 Resolved by D-041/D-042: agent and team-lead commissions both use apartment sale price. Default $100,000 sale -> agent $1,000 and team lead $500.
OQ-028 Rate settings per user/defaults; historical rates at closing, effective date, refund/cancellation, sale allocation, commission recognized versus received, currency and payout tracking.
OQ-029 Leave: employee schedules/working days and holidays, leave year, balance allocation/accrual/eligibility/carryover, overlap, request cancellation and rejection. SuperAdmin approves team-lead leave (D-048); editor/non-team staff approver remains open.
OQ-030 Temporary team lead: same-team agent only? duration/start/end, temporary assignment/user-creation/leave-approval powers, no self-approval, lead's retained access, absence routing and commission implications. End delegation automatically without changing permanent role.

OQ-031 Historical rate policy resolved by D-043: rates/amounts preserved at Won closing, future changes do not recalculate past deals. Remaining: commission recipient during transfers/acting-lead periods, corrections/refunds and earned versus paid recognition.

OQ-032 Default split resolved by D-044: 0.25% each from the default 0.5%. Signing-date eligibility resolved by D-045. Acting automatic share resolved by D-046: half the default lead rate, adjustable. Define permanent lead share, override scope, period boundaries and effective rate date separately from Won entry date.

OQ-033 Permanent remainder resolved by D-047: personal lead rate minus acting share. Remaining: caps/validation if automatic or overridden acting share exceeds personal-rate pool; override scope/default changes.

OQ-034 Resolved by D-048: SuperAdmin approves team-lead vacation and nominated replacement. Editors/non-team staff approval still open; additional approval roles post-MVP.

OQ-035 Powers/self-approval/expiry resolved by D-050/D-051: team active visibility, assignment, agent creation, other-agent leave approval; no team-wide Lost/Won, no self-approval or rate changes. Exact date boundaries, choice of own-team replacement, and premature cancellation still need explicit agreement.

OQ-036 Leaderboards/rewards: MVP or later? Team and agent primary metric confirmed sold-property count (D-055/D-056). Period/timezone, cancellations, ties, delayed entry, and participant visibility. No team-size normalization now (D-053).
OQ-037 Past Won credit and explicit active lead selection resolved by D-054. Remaining: who receives credit when a lead/agent transfers before signing, and Lost transfer/reopening details.
OQ-038 Reward formula: meaning of company income (earned revenue, received revenue or profit), pool and split, individual prize, approval and record-only versus actual payment. No automatic formula or money movement agreed.

OQ-039 Leaderboard MVP boundary: monthly agent/team ranking tables and manually recorded/approved rewards in MVP? Ranking metrics, company income base and reward formulas remain unconfirmed.

OQ-040 Periods resolved by D-058: monthly teams, monthly individuals, yearly individuals. Date attribution, timezone, delayed Won entry, archived periods and rewards remain open.

OQ-041 Shared ranks confirmed by D-059; prize division/selection and rank numbering remain open.

OQ-042 Resolved by D-060: signing date determines leaderboard calendar month/year. Still open: delayed-entry impact on finalized rewards, corrections/cancellations and date boundaries.

OQ-043 Direction settled by D-061: no automatic rewards formula; manual for now. Amounts/fields/payout tracking remain undefined and can be revisited after other topics.

OQ-044 Public both total/per-m² and hide controls confirmed (D-062); signed sale price separate (D-063). Remaining: inheritance/override, currency, authoritative price field, area basis, rounding and missing-price behavior.

OQ-045 Visibility resolved by D-064: show all statuses with clear labels and Available only filter; sold-out floors browsable. Exact inquiry behavior for reserved/sold apartments remains open; do not imply they are purchasable.

OQ-046 USD/GEL switcher confirmed (D-065). Stored-price policy resolved by D-066: one amount in editor-selected USD/GEL, default USD, derived other display currency. Remaining: exchange source, refresh frequency, rounding and indicative versus contractual conversion.

OQ-047 Is the entered price the total apartment price or the per-square-metre price? Proposal: total price authoritative, per-m² derived using agreed apartment area; Pini upload compatibility and area basis need verification.

OQ-047 update: D-067 resolves entry mode as selectable total/per-m². Remaining: apartment area basis, rounding, missing/zero area and area edits.

OQ-047 area-basis resolved by D-068: total area including balconies. Remaining: precision, missing/zero area and area-change recomputation.

OQ-048 Sold behavior resolved by D-069: visible red, non-interactive, no inquiry/details. Reserved resolved by D-070: non-interactive, distinct color; only available units interactive. Define matching list/direct-link behavior and final status colors.

OQ-049 Resolved by D-071: users with relevant individual content permission publish directly without SuperAdmin approval. Exact permission granularity/draft features remain open.

OQ-050 Blog policy resolved by D-072: all four languages required, automatic translation button, writer review before publishing. Complex descriptions follow same policy under D-073. Provider, translated fields, review acknowledgement and edit/regeneration behavior remain open.

OQ-051 Complex description policy resolved by D-073. Other editable website content/fixed UI translation policy remains open; geometry/numeric fields are not translation content.

OQ-052 Initial browser matching and saved manual choice resolved by D-074. English fallback resolved by D-075. Remaining: explicit locale URL precedence, persistence duration and preservation of page/selection on switching.

OQ-053 Does blog writing or complex-content editing offer save-as-draft so partially written/unreviewed content stays out of the public site? Direct publication authority and four-language review requirement already confirmed.

OQ-054 Authority resolved by D-077: agent own lead, team lead own team, SuperAdmin all; explicit reservation, not automatic Negotiation transition. Remaining: temporary-cover powers, expiry/release, eligibility, conflict/cancellation rules and external inventory updates.

OQ-055 Resolved direction by D-078: review notification every 24 hours to agent and team lead, Keep/Remove; no time-only automatic expiry. Remaining: anchor, Keep reset, unresolved notification, duplicate responses and acting-lead recipient.

OQ-056 No-response behavior resolved by D-079: retain Reserved, repeat every 24h, notify SuperAdmin after two unanswered reviews (48h example). Remaining: exact response cutoff/escalation repeat/reset. Lost-lead linked reservation handling remains open.

OQ-057 Deferred: previous proposal for both-prompt resolution/missed-count reset was not accepted as a new requirement. Owner limited escalation to notifying SuperAdmin and manual follow-up (D-080); stop expanding this workflow during current discussion.

OQ-058 Scale/cities resolved by D-081: 2-3 complexes, Tbilisi/Batumi, possibly Kutaisi. Still needed: exact complex names, supplied renders/plans and inventory, developer details and authorized publication content.

OQ-059 No existing logo/brand colors; Aura name rejected due to collision (D-082). Choose premium name and brand direction; candidates in docs/design/naming.md are unapproved and uncleared.

OQ-060 Final public navigation/routes: short landing intros linking to separate About/team and projects; blog confirmed. Services detailed page deferred or placeholder? Contact standalone versus landing/modal. Avoid duplicating long full sections.
OQ-061 Public agent space and SuperAdmin-curated visibility confirmed (D-086). Remaining: exact profile fields, display order/team grouping, team-lead inclusion and public contact details. Never derive public roster automatically from all admin users.

OQ-062 Contact-number choice resolved by D-088: admin-configured per public profile. Remaining: separate phone/WhatsApp fields, optional display, edit authority beyond owner. No new form/routing exception implied.

OQ-063 Email invitation plus mandatory password setup/change confirmed by D-089. Password-update feature confirmed by D-090; who may reset/update which users, reset behavior, self-service and session invalidation remain open.

OQ-064 Resolved by D-091: no administrator/team-lead password editing/resets; users manage passwords themselves. Invitation/initial setup retained. Self-service recovery implementation remains open.

OQ-065 Visibility wording resolved by D-228: deactivated user profiles visible only to SuperAdmin; restored users return to normal visibility. Login/session behavior resolved by D-229: automatic immediate access revocation.

OQ-066 Resolved by D-228: reactivated agents return to normal configured-team visibility, including team-lead assignment choices.

OQ-067 Same identity/history retained confirmed by D-095; fresh setup selects team/role/permissions. Remaining: which fields restore and how prior active leads/public profile visibility are handled.

OQ-068 Reassignment confirmed by D-096: choose team-lead inbox or auto-distribute within team. Remaining: eligible agents, metric, empty team fallback, recipient reassignment for reminders/reservations and deactivation sessions.

OQ-069 Resolved by D-100/D-101: New + Not answered, rotate ties, exclude inactive/on-approved-leave, selected/unassigned only, no automatic reshuffle; team-lead fallback. Implementation selection UX and reminder recipient migration remain open.
OQ-070 Manual/Excel lead creation: required contact fields and initial stage, duplicate policy, template/mapping, preview/validation, atomic versus partial import, language/source/project linkage, and assignment choice.

OQ-071 Resolved by D-102: manual/Excel phone required, email optional. Name requirements and duplicate/import handling remain open. Public form unchanged.

OQ-072 Handling resolved by D-103: skip/report duplicate, no overwrite. Company-wide scope resolved by D-104. Remaining: within-file duplicate ordering, normalized phone matching and report fields within existing visibility scope.

OQ-073 Resolved by D-105: manual/import leads start in New. Assignment choice remains open; no historical sale import implied.

OQ-074 Resolved by D-106: offer team lead automatic split versus manual assignment, using existing scoped assignment rules.

OQ-075 Repeat flow resolved by D-107/D-108: new lead same agent + duplicate note + mandatory OTP. Remaining: save/pending/acceptance sequence, multiple prior assignments, unavailable agent, closed leads and starting stage.

OQ-076 Resolved by D-109: pending before verification, accepted/routed onto board only after OTP success. First-time save-first optional flow remains separate.

OQ-077 Deactivated/on-approved-vacation fallback resolved by D-110: team lead for reassignment after OTP. Transfer/multiple-history team choice and absent-lead cover still open.

OQ-078 Accrual/counting resolved by D-112: two days/month, 24/year, scheduled working days deducted only. Five-day workweek with flexible rest days. Remaining: monthly credit date, partial months, first-year eligibility, holiday calendar, leave-year boundaries and unused-day carryover.

OQ-079 Advance leave limit resolved by D-113: minimum balance -2 days. Unused-day carryover resolved by D-114: indefinite, no expiry/reset/cap. Accrual timing resolved by D-115: two days after each completed employment month from joining date; no incomplete-month credit. Remaining: month-end anniversary handling and inactive employment periods.

OQ-080 Schedule ownership resolved by D-116/D-118; weekly recurrence plus dated exceptions confirmed by D-119. Approved-leave treatment resolved by D-120: fixed deduction with reapproval for affected leave. Schedule effective dates/history remain implementation details.

OQ-081 Resolved by D-118: owner approval applies only to team leads’ own vacations/schedules; team leads manage agents’ schedules and approve agent vacations.

OQ-082 Early return resolved by D-122: same approval process, only unused scheduled vacation days restored. Acting-lead early-return behavior resolved by D-123: coverage/commission split end on approved return date. Remaining: precise return-date boundary and coverage handling for full cancellation before leave starts.

OQ-083 Reversal approval/pending flow superseded by D-126: immediate move out of Won with required detailed reason, automatic SuperAdmin notification and leaderboard adjustment. Destination resolved by D-127: user chooses active column or Lost. Apartment handling resolved by D-128/129; commission reversal resolved by D-130.

OQ-084 Resolved by D-129: Won-to-Lost automatically makes apartment Available; Won-to-active requires Available/Reserved selection. No apartment Lost status.

OQ-085 Resolved by D-132: acting leads see only own commissions, including acting share; no team-wide commission/Won visibility.

OQ-086 Won-before-documents flow confirmed by D-134. Sale information required at transition confirmed by D-135, including actual price and first deposit; listed price is prefill only. Finalize field schema, deposit date/currency/zero handling and document deadline/types/access.

OQ-087 Final wording for added near-Won column: working label Almost won / Final details. No first deposit means no Won; finalize detailed sale-field schema without changing agreed Won criteria.

OQ-088 Deposit amount validation resolved by D-137: positive amount, no minimum threshold. Decide deposit currency/date fields and whether project-specific payment terms are public content or internal only.

OQ-089 Superseded by D-141: document uploads optional in MVP; no 48-hour deadline or overdue reminder. Pini-inspired upload approach retained under D-140; finalize attachment formats/limits during implementation.

OQ-090 Partial reversal resolved by D-143: reverse only selected apartment sale, retain other Won purchases. Placement resolved by D-144: completed sales stay Won while ongoing purchase appears as an active card linked to same customer.

OQ-091 Signing-date fixed conversion confirmed by D-146. Commission earnings display resolved by D-147: GEL with same fixed rate. Deposit currency resolved by D-148: independent USD/GEL, default GEL. Remaining: rate source, non-publication-day fallback and rounding.

OQ-092 Country/nationality terminology resolved by D-152. Manual/Excel requiredness resolved by D-153, with Unknown allowed. Public scope resolved by D-154: optional on project/apartment inquiry forms. Separate from preferred language; do not infer from phone/browser.

OQ-093 Phone conflict resolved by D-157: company-wide normalized matching, reject change/report duplicate, no merge or inaccessible details. Shared-customer propagation remains to specify.

OQ-094 Excel preview/partial success confirmed by D-167. Template resolved by D-168: downloadable fixed columns, no arbitrary mapping. Remaining: supported workbook formats, row/file limits and within-file duplicate ordering.

OQ-095 Vacation-approval lead reassignment option confirmed by D-176. Selection/distribution resolved by D-177: some/all, manual or automatic within team. Timing/optionality resolved by D-178: optional, execute at vacation start. Return behavior resolved by D-179: retain new assignments unless manually changed. Recipient migration resolved by D-180: transfer pending reminders/future reservation notifications with original timing; preserve historical completed sales.

OQ-096 Placement revised by D-185: immediate Lost with review flag; lead confirms or returns to agent. Return stage resolved by D-186: prior active column. Team-lead-authored closure resolved by D-193: confirmed immediately. Reservation outcome resolved by D-191/192. Acting-lead team-wide Lost access remains disallowed; earlier Won-to-Lost review exception still to clarify.

OQ-097 Resolved by D-196: Won terminal for ordinary roles; SuperAdmin-only exceptional correction/reversal retains existing per-apartment correction rules.

OQ-098 Apartment discount limits (D-198): Privacy resolved by D-199: admin-only. Missing-minimum default resolved by D-200: advertised price is floor. Currency comparison resolved by D-201: owner configures same currency; no discount-floor FX logic. Missing advertised price handling remains an implementation edge case. No independent discount approval workflow agreed.

OQ-099 Meaning resolved by D-211: Ongoing/Completed describes construction; Sold out is separate Aura sales availability. Sales calculation resolved by D-212: all listed apartments Sold, excluding Reserved. Sold-out inquiry behavior resolved by D-213. Construction-status management remains a content-admin detail.
