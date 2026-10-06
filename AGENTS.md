# Aura Property — Codex working agreement

## Scope and source of truth
This is Aura Property, independent from DealerTrades and Pini. Read README.md and the relevant product documents before work. Product decisions live in docs/product; implementation facts and evidence live with task plans. Do not invent requirements from typical real-estate website patterns.

Confirmed decisions outrank proposals. Explicit owner instructions outrank this file. Keep this file short; put business detail in the product documents. Record changed decisions with a superseding entry rather than silently erasing history.

## Reference boundary
Pini at /Users/iraklismac/code/pini is a read-only source reference. The owner authorized copying its complex-upload tools, building/floor/apartment explorer logic, and complex/apartment inquiry behavior into Aura. Do not copy unrelated functionality, credentials, personal data, production configuration, or live inventory. No Pini runtime connection is authorized or required. Aura UI and layout may differ.

## Orchestration
The owner authorizes this agent to orchestrate specialist subagents for the Aura project. Delegate bounded tasks with explicit file ownership, inputs, acceptance criteria, and expected evidence. Keep dependent integration steps sequential. Coordinate agents that need shared files. Integrate and review their work before reporting completion; an agent self-report alone is not verification.

## Process
1. Discuss consequential business choices and record decisions immediately.
2. Write a self-contained brief and execution plan for the agreed slice, including non-goals and acceptance scenarios.
3. Agree design direction before broad UI implementation.
4. Implement only the agreed scope; use independent review for meaningful changes.
5. Verify behavior with appropriate tests plus real browser checks, mobile, keyboard access, and Hebrew RTL where relevant.
6. Distinguish implemented, verified, merged, and deployed. Persist evidence and outstanding limitations.

Small reversible fixes do not require a full interview. Do not reopen settled decisions. Keep user communication concise; ask one consequential business question at a time unless the owner requests a batch.

## Technical boundaries
Approved implementation stack: TypeScript npm monorepo; Next.js/React public website, React/Vite admin, Node/Fastify backend, PostgreSQL/Prisma. Deployment topology and external providers remain to verify. Cloudflare is the owner's deployment direction, not an approval of a specific service configuration. Proceed with approved architecture; isolate provider-dependent adapters. Enforce lead visibility and per-user permissions on the server. Never rely on hidden UI controls for authorization. Never expose secrets in documentation or reports.

## State
MVP implementation authorized. Latest confirmed business decisions supersede earlier entries. Existing documents include proposals explicitly marked as such. Local MVP implementation is verified; production launch remains pending the documented content and provider prerequisites.
