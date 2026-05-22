# FlavorOS TODOS

**Last updated:** 2026-05-22 — TODO-2 (Real orchestrator) done; TODO-4 (Real Gmail send) done.

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

### TODO-2: Real orchestrator — replace StubOrchestratorAdapter — ✅ SUBSTANTIALLY DONE (2026-05-22)

**What:** Replace `StubOrchestratorAdapter` in `services/api/app/adapters/orchestrator.py` with a durable multi-step agent runtime. Khadijah, Sinclair, and Regine should actually execute as LLM-backed agents, not return instant "completed" stubs.

**Why:** Every workflow currently "completes" in 0ms with placeholder output. The inline `process_provider_first_sync` trick (Phase 1 workaround) is not extensible. Real briefings, real project reviews, real morning standup workflows require an orchestrator that can handle multi-step execution, retries, and human-in-the-loop gates.

**What landed:** Chose a custom in-process async executor (no Temporal/LangGraph) — `InProcessOrchestratorAdapter` is now the active default (`ORCHESTRATOR_ADAPTER=in_process`). `dispatch_task` runs LLM-backed skills via `asyncio.create_task`, writing AgentTaskEvent / AgentReport / Artifact / Approval rows.

- **All 9 workflow types** are mapped in `_WORKFLOW_TASK_MAP` and have registered skills:
  - `morning_standup`, `cob_workday` (pre-existing, Khadijah)
  - `provider_first_sync_review`, `communication_sweep_review` (Sinclair) — `skills/sinclair_provider_review.py`, `skills/sinclair_comms_sweep.py`
  - `morning_standup_seed` (Khadijah), `travel_research_seed` (Regine) — onboarding seed skills
  - `comms_calendar` (Sinclair), `projects_review` (Khadijah) — meeting workflows
  - `client_onboarding` (Khadijah) — initial implementation (see remaining work below)
- **Front-end launch + polling wired:** `lib/api.ts` (`launchWorkflow`, `getWorkflowRun`), `lib/hooks/useWorkflowLaunch.ts` (2s polling to terminal state), `components/WorkflowLaunchButton.tsx`. "Prepare Briefing" / "Prepare Meeting" buttons live on `/briefings/[type]` and meeting topic surfaces.
- Verified: all 9 skills registered, task-map→skill coverage 100%, TypeScript clean, Next.js build passing.

**Remaining (tracked as TODO-2b below):** full `client_onboarding` multi-step orchestration (context creation, provider expectation seeding, chaining the seed workflows). Current onboarding skill writes a summary + HITL confirm only. Retries/backoff and a non-asyncio durable queue are also still open.

**Where to start (for follow-ups):** `services/api/app/adapters/orchestrator.py`, `services/api/app/executor.py`, `services/api/app/skills/`.

**Effort:** human ~2-3 weeks / CC ~3-4 days → **core delivered in 1 CC session**
**Priority:** P2 → core done
**Depends on:** First Real User milestone (Composio wired, real data flowing)

---

### TODO-2b: Full client_onboarding orchestration

**What:** Expand `skills/client_onboarding.py` from the current summary-only implementation into a real multi-step onboarding workflow: create governed Client Universe contexts, set provider expectations, and chain the `morning_standup_seed` + `travel_research_seed` workflows.

**Why:** Onboarding is the entry-point workflow and the most complex. The initial skill only reads existing contexts/providers and writes a confirmation artifact — it does not yet *create* the governed universe or fan out to seed workflows.

**Where to start:** `services/api/app/skills/client_onboarding.py`, `docs/workflows/client_onboarding_model.md`, the seed skills as fan-out targets.

**Effort:** human ~3-4 days / CC ~4-6h
**Priority:** P2
**Depends on:** TODO-2 (done)

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

### TODO-4: Real Gmail send via Composio outbound — ✅ DONE (2026-05-22)

**What:** `ComposioGmailOutboundAdapter` added to `services/api/app/adapters/gmail_outbound.py`. Wired at startup in `main.py` lifespan when `COMPOSIO_API_KEY` is set. `composio_user_id` stored in `OutboundAction.payload_json` at enqueue time.

**Calls:** `Action.GMAIL_SEND_EMAIL` with `recipient_email`, `subject`, `message_body` params via `composio_user_id` entity routing.

**Note:** Requires `gmail.send` OAuth scope in the Composio app. If the connected account was authorized without that scope, re-authorization will be needed. Param names (`recipient_email`, `message_body`) should be verified against the running SDK version if sends fail — check Composio action schema with `python -c "from composio import Action; help(Action.GMAIL_SEND_EMAIL)"`.

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

**Status note (2026-05-22):** Orchestrator-launched workflows now run off-thread via `asyncio.create_task(dispatch_task(...))` in `InProcessOrchestratorAdapter.launch`, and the front-end polls for completion. The remaining blocking path is the **inline** `process_provider_first_sync(db, workflow_run.id)` call in `routers/providers.py` — that one still blocks the request. Migrating provider sync to launch via the orchestrator (workflow_type `provider_first_sync`) instead of the inline processor would close this.
