# AURA-028 — Reuse Pini’s translation provider

## Brief and decision
On 2026-10-08 the owner requested Aura use Pini’s working AI translation endpoints and logic, with one provider/billing account and the same key supplied by the owner (explicitly confirmed). The owner also requested a monthly spending limit; the owner subsequently selected $10/month combined for Pini and Aura. Pini remains read-only; copy code patterns, never existing credentials.

## Evidence
Pini server/services/projectTranslation.ts uses OpenRouter’s https://openrouter.ai/api/v1/chat/completions endpoint, configurable CHAT_MODEL (local config google/gemini-2.5-flash), forced structured function output, temperature 0, max_tokens 12000, 60-second timeout and no automatic retries. It preserves source text, rejects malformed/truncated output, and permits 20 requests per user per hour with one in-flight request. Claude is used separately by map search. This evidence establishes local source/config, not the live production model.

## Plan and ownership
- Backend specialist: translation.ts, content.ts translation routes and targeted API/unit tests. Add OpenRouter with Hebrew, maintain existing single-target API and provider fallbacks, and batch an editor action into one provider call.
- Admin specialist: SiteContent.tsx and Content.tsx. Switch translation actions to batch requests, preserve review-before-publish and source text, prevent double submission.
- Root: environment examples/private placeholder configuration, deployment/API documentation and decision ledger; integration tests and review.
- Independent reviewer: inspect final changes and test evidence; no production changes.

## Batch contract
POST /api/translate/batch: {sourceLanguage: en|ka|ru|he, fields: [{id, text, kind?: description|title|feature}]} -> {data:{fields:[{id, translations:{en,ka,ru,he}}]}}. Authenticated content editors only. Enforce unique bounded field ids, at most 20 fields, 5000 source characters per field and 10000 total, with errors before calling the provider. One OpenRouter tool call must return exactly the requested field ids and all four languages. Preserve original source bytes.

## Acceptance
- Same OpenRouter endpoint/model configuration/prompt principles as Pini; server-only OPENROUTER_API_KEY and CHAT_MODEL.
- Source and drafts survive provider/validation errors. No auto-publication. Status never returns secrets.
- Valid and invalid structured output, Hebrew, user quotas/concurrency, provider precedence, and authorization tested without live charges.
- Root production env remains ignored and mode 600; existing R2 credentials preserved. No purchases, live provider requests or changes to Pini.

## Evidence and limitations
- Implemented OpenRouter in Aura’s own backend, with four-language forced structured output and all section/project fields batched into one provider request. Compatibility providers and the legacy route remain supported; no Pini runtime API dependency.
- Admin project/blog action translates the current unsaved form text, preserves exact source bytes and saves private unreviewed translations. Website sections retain the existing explicit review/apply/save workflow. Duplicate translation requests and conflicting edits are disabled while pending.
- 65 API tests passed against isolated local aura_endpoint_audit, zero failed/skipped; includes 8 DB-free provider tests and 3 batch endpoint integration cases. Real provider variables removed; requests stubbed. Log: /tmp/aura-028-api-tests.log.
- All workspace typechecks passed. API and admin production builds passed. git diff --check passed.
- Independent static review found no actionable issues in provider validation, authorization, source preservation, async saves or documentation.
- Browser: /api/translation/status correctly shows unconfigured state; typed an unsaved project title and triggered translation without a configured local provider. Safe error displayed, unsaved input remained unchanged, Published state remained. Restored original input and closed editor without saving. Screenshot: /tmp/aura-028-translation-draft-check.png. Live successful translation/quality remains unverified until user supplies the key.
- Private .env.production.local has OPENROUTER_API_KEY placeholder and CHAT_MODEL set; R2 secrets preserved, mode600 and Git ignore verified. R2 bucket access was previously verified read-only with HTTP200. No secret was copied from Pini or committed.
- Owner approved $10/month combined for the shared key. On 2026-10-08, inspected the existing pini OpenRouter key: enabled, last used one day earlier, recent activity lists Gemini 2.5 Flash. Changed Reset limit from Weekly to Monthly while keeping Credit limit at $10, saved and verified the Monthly budget. Screenshot: /tmp/aura-openrouter-monthly-limit.png. No new key/account/purchase was made. Runtime host configuration was not inspected; observed OpenRouter usage supports the local source/config model evidence.
- Quotas intentionally follow Pini’s process-local 20/hour + one pending guard; restarts/multiple replicas require a shared persistent quota before scaling. Provider monetary cap is separate.
- No production deployment or live provider inference performed.

## Live key verification — 2026-10-08
After the owner supplied the shared key and requested verification, confirmed that the private production environment file contains an OpenRouter-format key, remains Git-ignored/mode600, and retains the R2 key fields. GET /api/v1/key authenticated successfully and reported limit=10 with monthly reset. Ran one synthetic apartment-description batch through Aura’s built translation adapter, using google/gemini-2.5-flash: HTTP200, original English preserved and nonempty Georgian/Russian/Hebrew output accepted by the production schema. Reported usage302 tokens, cost$0.0002754. This verifies connectivity and the adapter contract; human translation review remains required, especially units/formatting in Hebrew. No website/database changes, production deployment, local API environment switch, or key output occurred.
