# AURA-016 — Actual browser logout request

Root cause: API helper set application/json even when body was absent; Fastify rejected the bodyless logout with 400 before the handler. Helper now sends JSON content type only with a JSON body. Logout is idempotent and clears missing/expired session cookies too; origin checks remain.

Browser verified header Sign out returns to login and reloading stays logged out. 27 regressions pass, including bodyless and repeated logout. Workspace type checks plus admin/API production builds pass. Earlier test sent an empty object, unlike the actual browser request; new regression covers that mismatch.
