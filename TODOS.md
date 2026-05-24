# FlavorOS TODOS

**Last updated:** 2026-05-24 — TODO-2b done (Lane T orchestration wired + step 4 UI); TODO-7/X/Y/Z done; outbound cron shipped.

---

## P1 — Blocks first real client demo

### TODO-1: Deploy services/api to a real cloud host — done

**What:** Move `services/api` from localhost-only to a deployed host (Railway, Fly.io, or Hostinger VPS already in use for agent bundles).

**Status:** VPS deploy complete — API live at `https://api.flavoros.cc` (Hostinger VPS, Cloudflare tunnel, systemd `flavoros-api`). Re-deploy when shipping API changes; Lane R adds GitHub Actions auto-deploy on push to `main`.

**Where to start:** `docs/planning/vps_deploy_runbook.md`, `scripts/deploy-vps.sh`, `docs/planning/parallel_lanes_tracker.md` (VPS deploy row in completed archive).

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

### TODO-2b: Full client_onboarding orchestration — ✅ DONE (2026-05-24)

**What:** Full multi-step onboarding orchestration: provider expectations, Khadijah LLM orientation summary, HITL approval gate, seed workflow fan-out, readiness KV.

**Done:**
- Lane T (2026-05-22): `skills/client_onboarding.py` — provider expectations, LLM summary, HITL gate, seed fan-out, readiness KV. 4 tests pass.
- 2026-05-24: Fixed wrong `task_type` in `save_onboarding` (`"onboarding_readiness_review"` → `"client_onboarding"`); removed dead seed `_queue_agent_task` calls (skill handles fan-out). Added `getArtifact`/`getApproval` to `lib/api.ts`. Rewired step 4 of `apps/flavoros/src/app/onboarding/page.tsx` to launch the workflow on entry, poll to completion, show Khadijah summary + HITL approval card.

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

### TODO-5: Per-message ProviderEvent deduplication for re-sync — ✅ DONE (2026-05-22)

**What:** When re-sync is implemented, move from storing all email items in a single `NormalizedItem.data["items"]` array to creating one `ProviderEvent` + `NormalizedItem` row per email message, with a unique idempotency key per message.

**Done:** `sync_provider` in `services/api/app/routers/providers.py` creates per-message rows with idempotency `"{provider_connection_id}:{provider}:{message_id}"`; batch sync event uses separate key; tests in `tests/test_provider_first_sync.py`.

**Why:** The current First Real User implementation stores the sync result in one `NormalizedItem.data["items"]` — which gets overwritten on every sync. A re-sync path needs per-message deduplication so the same email isn't shown twice after a second "Sync" click.

**Where to start:** `services/api/app/routers/providers.py` (the `sync_provider` handler's NormalizedItem creation block) and `services/api/app/workflows/provider_first_sync.py` (the processor's item query). The idempotency key format should be `"{provider_connection_id}:gmail:{message_id}"`.

**Pros:** Proper per-message tracking; enables incremental sync (only show new messages); enables safe re-sync.
**Cons:** Requires a loop in `sync_provider`, a collection query in the processor, and updating the existing tests.

**Effort:** human ~1 day / CC ~1h
**Priority:** P2
**Depends on:** First Real User milestone complete; re-sync feature planned

---

### TODO-6: Move sync LLM call off the request thread — ✅ DONE (2026-05-22)

**What:** Run provider sync review asynchronously instead of blocking the FastAPI event loop on the LLM path.

**Done:** HTTP sync no longer calls inline `process_provider_first_sync`; schedules `provider_first_sync_review` / `communication_sweep_review` via `asyncio.create_task(dispatch_task)`. Client polls workflow run for artifact. `record_provider_sync_completion` + GBrain ingest still run synchronously on HTTP thread after dispatch is scheduled.

**Why:** The current sync handler blocks the event loop for 3-7s (Composio HTTP fetch + Anthropic LLM call). At one concurrent user this is fine; at 10+ concurrent syncs the server throughput degrades. This was a deliberate tradeoff for the First Real User milestone.

**Pros:** Sync endpoint returns quickly; LLM review runs off-thread; server stays responsive under concurrency.
**Cons:** Artifact not ready in the HTTP response — client polls workflow run (implemented).

**Effort:** human ~1 day / CC ~2h
**Priority:** P3
**Depends on:** First Real User milestone complete; real orchestrator (TODO-2) may make this moot


---

## P3 — Client DNA adoption (post-MVP enrichment)

Parallel lanes **W–Z** — see [`docs/planning/parallel_lanes_tracker.md`](docs/planning/parallel_lanes_tracker.md) and [`docs/planning/client_dna_adoption_build_plan.md`](docs/planning/client_dna_adoption_build_plan.md). **Does not block** lanes R, S, T, V.

### TODO-7: DNA canon & storage design (Lane W) — ✅ DONE (2026-05-23)

**What:** Finalize workflow model + build plan; Phase 8 stub in `current_build_plan.md`; decide relational `client_dna_*` tables vs GBrain-only pre-verify.

**Done:** Canon docs updated; **Hybrid selected** — Postgres `client_dna_candidate` rows pre-HITL, `store_sigma` to GBrain post-accept. Promotion rule documented. See [`docs/planning/client_dna_adoption_build_plan.md`](docs/planning/client_dna_adoption_build_plan.md).

**Memory architecture canonized:** Two-hemisphere model (CU DB + IPM), preparation-over-retrieval principle, and chron-driven sync loop documented in [`docs/architecture/client_universe_memory_system.md`](docs/architecture/client_universe_memory_system.md).

**Unblocks:** Lane X (account sweep MVP, migrations).

**Allowed paths:** `docs/**` only.

**Effort:** human ~1 day / CC ~2h  
**Depends on:** Nothing

### Outbound scheduled send (working tree, 2026-05-22)

**What:** `scheduled_send_at` on `outbound_actions`; `scripts/dispatch_outbound_due.py`; Communications schedule UI; migration `20260522_0008` (`down_revision` = invite migration `0008`).

**Human:** Commit/merge, VPS `alembic upgrade head`, cron for due dispatch.

### TODO-8: Account sweep MVP (Lane X)

**What:** `account_sweep` workflow, per-window `SyncCheckpoint`, 180d Gmail + Calendar first.

**Depends on:** TODO-7. Coordinate with Lane V on `providers.py` — X owns sweep paths; V owns dedup/async first-sync.

**Where to start:** `services/api/app/workflows/`, `adapters/orchestrator.py`, `routers/providers.py`

### TODO-9: Parse & synthesize (Lane Y)

**What:** `client_dna_parse` skill; GBrain ingest `client_dna_candidate`; `store_sigma` with `sigma_type=client_dna`.

**Depends on:** TODO-8. Non-stub GBrain (`GBRAIN_ADAPTER=cli`) required for full synthesis in target envs.

**Where to start:** `services/api/app/skills/`, `adapters/gbrain.py`, `models.py`, `alembic/`

### TODO-10: HITL verify & adoption (Lane Z) — ✅ DONE (2026-05-23)

**What:** Admin DNA review queue; 3× unverified purge/cross-reference; `client_dna_adoption` workflow after acceptance.

**What landed:**
- `workflows/client_dna_adoption.py` — `adopt_candidate` (store_sigma + GBrain ingest, status=adopted) and `reject_candidate` (3× purge threshold, AuditEvent writes)
- `routers/dna.py` — GET /dna/candidates (domain/status filter), GET /dna/candidates/{id}, POST .../accept, POST .../reject — all tenant-scoped, 409 on non-pending
- `main.py` — wired `dna.router`
- `admin-api.ts` — `ClientDnaCandidateRead` type, `listDnaCandidates`, `acceptDnaCandidate`, `rejectDnaCandidate`
- `admin-surfaces.ts` — added `dna` tile + surface spec
- `DnaCandidatePanel.tsx` — domain-filter chips, per-row Accept/Reject buttons, optimistic removal after action
- `AdminSurfacePanel.tsx` — routes `surface==="dna"` to `DnaCandidatePanel`

**Depends on:** TODO-9
