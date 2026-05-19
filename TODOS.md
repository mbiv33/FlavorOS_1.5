# FlavorOS TODOS

**Last updated:** 2026-05-19 — generated from /plan-ceo-review (First Real User milestone)

---

## P1 — Blocks first real client demo

### TODO-1: Deploy services/api to a real cloud host

**What:** Move `services/api` from localhost-only to a deployed host (Railway, Fly.io, or Hostinger VPS already in use for agent bundles).

**Why:** A local tunnel works for solo developer testing but breaks the moment a real client accesses the app from a different machine. NEXT_PUBLIC_FLAVOROS_API_URL must point somewhere always-on.

**Where to start:** `docs/planning/local_dev_runbook.md` for the current local setup. The CLAUDE.md VPS fallback section for the deployment pattern. The API is a standard FastAPI app with Postgres — Railway or Fly.io will auto-detect it from `pyproject.toml`.

**Pros:** Unlocks real client demos without tunnel setup; removes dependency on developer's laptop being on; enables Vercel front-end to hit a stable API URL.

**Cons:** Adds infrastructure cost and maintenance surface; Postgres must be provisioned separately or migrated.

**Effort:** human ~2h / CC ~30min
**Priority:** P1
**Depends on:** Nothing (can do before or after Composio wiring)

---

## P2 — Post-first-real-user

### TODO-2: Real orchestrator — replace StubOrchestratorAdapter

**What:** Replace `StubOrchestratorAdapter` in `services/api/app/adapters/orchestrator.py` with a durable multi-step agent runtime. Khadijah, Sinclair, and Regine should actually execute as LLM-backed agents, not return instant "completed" stubs.

**Why:** Every workflow currently "completes" in 0ms with placeholder output. The inline `process_provider_first_sync` trick (Phase 1 workaround) is not extensible. Real briefings, real project reviews, real morning standup workflows require an orchestrator that can handle multi-step execution, retries, and human-in-the-loop gates.

**Where to start:** `services/api/app/adapters/orchestrator.py` — the `OrchestratorAdapter` protocol is well-defined. `docs/architecture/agent_runtime_contracts.md`, `docs/workflows/`. `current_build_plan.md` Phase 6.

**Pros:** Unlocks the full MVP value proposition — actual AI agents doing real work for the client.
**Cons:** Large scope (~2-3 weeks human / ~3-4 days CC); risk of breaking the existing demo loop during migration; requires deciding on orchestration framework (custom, Temporal, LangGraph, etc.).

**Effort:** human ~2-3 weeks / CC ~3-4 days
**Priority:** P2
**Depends on:** First Real User milestone (Composio wired, real data flowing)

---

### TODO-3: User invite/registration flow

**What:** Admin creates a scoped invite link. New user follows link, sets password, and is registered as a new tenant or added to an existing tenant. No public registration — invite-only.

**Why:** Currently every real user must be manually seeded in the database by a developer. This doesn't scale beyond 1-2 pilot accounts and blocks any self-service onboarding for real clients.

**Where to start:** `services/api/app/routers/auth.py` for the login pattern. `services/api/app/models.py` for the User/Tenant model. Need an invite_tokens table or a time-limited signed token.

**Pros:** Removes developer friction to add new users; enables real client self-onboarding; more professional than manual seeding.
**Cons:** Adds auth complexity (token expiry, email delivery); slight security surface expansion (invite token must be single-use, time-limited).

**Effort:** human ~2 days / CC ~3h
**Priority:** P2
**Depends on:** TODO-1 (API deployed) or local tunnel for invite URL to be reachable

---

### TODO-4: Real Gmail send via Composio outbound

**What:** Replace `StubGmailOutboundAdapter` with a real implementation that calls `composio.execute_action("GMAIL_SEND_EMAIL", ...)`. Approved communication drafts actually land in the recipient's Gmail.

**Why:** Currently the approval flow records that a draft was approved and shows `queued` status, but nothing is actually sent. The write-back loop (MVP step 7) is proven structurally but not functionally.

**Where to start:** `services/api/app/adapters/gmail_outbound.py` — the `GmailOutboundAdapter` protocol is defined; add a `ComposioGmailOutboundAdapter` class. Depends on `COMPOSIO_API_KEY` being wired (CE2 from First Real User milestone).

**Pros:** Closes the full loop — client approves, email sends. This is the "it actually does something" moment.
**Cons:** Risk of sending real emails to real people; requires gmail.send OAuth scope (include during Composio OAuth app setup in First Real User milestone to avoid re-authorization later).

**Effort:** human ~2h / CC ~45min
**Priority:** P2
**Depends on:** First Real User milestone (Composio adapter wired, OAuth scope includes gmail.send)

---

### TODO-5: Per-message ProviderEvent deduplication for re-sync

**What:** When re-sync is implemented, move from storing all email items in a single `NormalizedItem.data["items"]` array to creating one `ProviderEvent` + `NormalizedItem` row per email message, with a unique idempotency key per message.

**Why:** The current First Real User implementation stores the sync result in one `NormalizedItem.data["items"]` — which gets overwritten on every sync. A re-sync path needs per-message deduplication so the same email isn't shown twice after a second "Sync" click.

**Where to start:** `services/api/app/routers/providers.py` (the `sync_provider` handler's NormalizedItem creation block) and `services/api/app/workflows/provider_first_sync.py` (the processor's item query). The idempotency key format should be `"{provider_connection_id}:gmail:{message_id}"`.

**Pros:** Proper per-message tracking; enables incremental sync (only show new messages); enables safe re-sync.
**Cons:** Requires a loop in `sync_provider`, a collection query in the processor, and updating the existing tests.

**Effort:** human ~1 day / CC ~1h
**Priority:** P2
**Depends on:** First Real User milestone complete; re-sync feature planned

---

### TODO-6: Move sync LLM call off the request thread

**What:** Run `process_provider_first_sync` asynchronously instead of blocking the FastAPI event loop. Use `asyncio.to_thread(process_provider_first_sync, db, workflow_run.id)` or move to a background task queue.

**Why:** The current sync handler blocks the event loop for 3-7s (Composio HTTP fetch + Anthropic LLM call). At one concurrent user this is fine; at 10+ concurrent syncs the server throughput degrades. This was a deliberate tradeoff for the First Real User milestone.

**Where to start:** `services/api/app/routers/providers.py:331` — the inline `process_provider_first_sync(db, workflow_run.id)` call. Wrap with `await asyncio.to_thread(...)` or dispatch to a Celery/ARQ background worker.

**Pros:** Sync endpoint returns immediately; client gets faster feedback; server stays responsive under concurrency.
**Cons:** Background execution means the artifact isn't guaranteed ready when the sync HTTP response arrives — the client would need a polling or websocket pattern to know when the artifact is ready.

**Effort:** human ~1 day / CC ~2h
**Priority:** P3
**Depends on:** First Real User milestone complete; real orchestrator (TODO-2) may make this moot
