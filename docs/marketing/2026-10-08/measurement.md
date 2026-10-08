# Measurement and decision rules

Planning specification; no analytics SDK, cookie setting, CRM schema or ad account changed.

## Three scorecards

**Pini discovery:** category/area visits, map selections, detail opens, meaningful exploration, accepted inquiry, qualified connection, response, repeat exploration. Project, house and land results are separate. For new buildings, units are nested explorer events—not standalone listing acquisition.

**Pini supply/Premium:** researched prospects, approved contacts, submitted records, published complete records, refresh compliance, paid pilot, delivered scope, contribution and renewal. Free listing count is not revenue or legal verification.

**Aura agency:** localized project visit, inquiry start, accepted new inquiry or verified repeat inquiry, contacted, qualified conversation, viewing scheduled/completed, negotiation and signed sale. Respect existing CRM stages; “qualified” and “viewing completed” may initially be reporting definitions rather than new workflow states.

## Definitions to agree

Agree listing-count identity through the [category launch tracks](category-launch-plan.md): project units, community group markers and plot-development overviews must not inflate unique house/parcel totals. Report researched prospects, authorized records and published inventory separately. Freshness is fact-specific; a photo/title edit does not refresh price or availability confirmation.

| Event | Definition | Does not prove |
|---|---|---|
| contact_click | Tap on phone/WhatsApp or other contact exit | A message was sent, a call connected or a lead accepted |
| inquiry_accepted | Server accepted a first inquiry or verified repeat under actual intake rules | Buying fit or a completed conversation |
| qualified_conversation | Human confirmed legitimate interest, category/project fit and an agreed next step; budget/timing may be volunteered or remain Unknown | Affordability approval or a sale |
| viewing_scheduled | Actual appointment recorded | Attendance |
| viewing_completed | Human records that the appointment occurred | Purchase |
| won | Actual signed sale and existing required deposit fields satisfied | Recognition of the total transaction value as agency revenue |

Track serviceability without inferring nationality from phone/browser. Preferred language and current campaign geography are distinct.

## Campaign tags

Use consistent lowercase `utm_source`, `utm_medium`, `utm_campaign` and `utm_content`; Google documents these parameters for campaign attribution. Example naming: campaign `pini-tbilisi-projects-ka-pilot`; content `map-to-place-hook-question-v1`. Never put buyer names, phone numbers, email or messages in URLs/events. [Google campaign attribution](https://support.google.com/analytics/answer/10917952?hl=en).

Keep each brand's events and reports separate. Record attribution window and model; preserve original source and subsequent touch history where implemented. Do not sum first-touch and assisted sales as separate transactions. Shared production does not imply shared private customer audiences.

In checked Aura source, `source` records intake methods such as WEBSITE/MANUAL/EXCEL; campaign/UTM persistence was not found in the searched web/API/schema files. This is a concrete implementation question for a later reviewed slice—not proof that every possible analytics surface is absent. Do not overwrite intake method with advertising campaign.

## Proposed thresholds

- Before media: known recipient for every promoted record; no public test label; price basis clear; correct destination locale; appropriate voice/rights approval; tested actual inquiry route.
- Supply readiness hypothesis: 80% of records complete and 90% refreshed within 30 days in the selected wedge. Adjust to actual data-update cadence; not a universal property benchmark.
- Creative: compare the first three seconds, completion, saves/shares and qualified actions to our own baseline. No minimum viral-view promise.
- Acquisition: proposed review/pause after twice the allowable qualified-conversation cost is spent with no qualified conversation. Diagnose site/response failure before blaming creative. This is a cash-risk rule, not statistical proof.
- Scale: proposed 20% weekly budget increase only after outcome quality and capacity hold. Small pilots do not establish a precise optimal rate.

## Allowable cost and scenario arithmetic

Agency maximum cost per qualified conversation = contribution per sale × observed qualified-to-sale probability × chosen acquisition share. Use actual revenue and variable costs, not apartment price or default employee commission alone.

For $1,000 media spend, illustrative scenarios:

| Assumption | Conservative | Working hypothesis | Strong hypothetical |
|---|---:|---:|---:|
| CPM | $12 | $8 | $5 |
| Click rate | 0.7% | 1.0% | 1.4% |
| Inquiry rate per click | 2% | 3% | 5% |
| Qualified share | 30% | 40% | 50% |
| Expected qualified conversations | 3.5 | 15 | 70 |
| Media cost per qualified conversation | $285.71 | $66.67 | $14.29 |

These are sensitivity examples, not local channel benchmarks or forecasts. Paid clicks may not become landing sessions; track that loss rather than silently assuming it away. Creative, labor and software costs are additional.

At low traffic, use moderated task tests and buyer/agent feedback first. A 2.0% to 2.5% inquiry-rate experiment needs roughly 13,800 independent visitors per arm at 5% two-sided significance and 80% power under a normal approximation. At 500 visitors/week total, that is about 55 weeks; weekly winner claims would be misleading. Native-language cohorts make sampling even thinner.

## Weekly review

Use the [pilot decision protocol](pilot-decision-protocol.md) to separate paid demand, delivery quality, contribution and attention. Small cohorts are operating tests; “insufficient evidence” remains a valid review outcome.

Monday: supply/current facts and sales response. Tuesday: source-backed research brief. Wednesday: select two meaningful tests. Thursday: native/factual/rights QA and release decision. Friday: cohort metrics, costs and rejected hypotheses. Every change needs a reason, expected effect, source or explicit assumption, owner, measurement, stop rule and rollback.
