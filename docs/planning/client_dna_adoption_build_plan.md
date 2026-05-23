# Client DNA Adoption — Build Plan

**Last updated:** 2026-05-22  
**Canonical workflow:** [`../workflows/client_dna_adoption_model.md`](../workflows/client_dna_adoption_model.md)  
**Slice status:** Vertical slice (steps 1–5) is **complete** — DNA work does not reopen slice freeze.

## Executive summary

The MVP substrate (Client Universe, provider sync, in-process orchestrator, approvals/HITL for governed actions) is in place. The Client DNA Adoption diagram is **not implemented**: no multi-window account sweeps, no four-domain parse tables, no DNA-specific HITL queue, no post-verify GBrain adoption sequence.

This plan phases DNA work across **lanes W–Z**, explicitly **parallel to and non-blocking** for merge/hardening lanes **R, S, T, V**.

## Does not block lanes R / S / T / V

| Lane | DNA plan interaction |
|---|---|
| **R** — Merge `deploy-api.yml` | Independent |
| **S** — Invite/registration | Independent |
| **T** — `client_onboarding` orchestration | **Complementary:** T finishes governed universe + seed fan-out; DNA sweeps run **after** onboarding readiness. See reconciliation in workflow doc. |
| **V** — Sync dedup + async | **Coordinate** on `providers.py`: V owns first-sync dedup/async; Lane X owns sweep-specific paths |

## Phased delivery

### Phase W — DNA canon & storage design (Lane W)

**Goal:** Lock schema and documentation before code. Extend [`current_build_plan.md`](./current_build_plan.md) with Phase 8 stub.

| Deliverable | Owner |
|---|---|
| `client_dna_adoption_model.md` (this repo) | W |
| `client_dna_adoption_build_plan.md` | W |
| Storage options doc (relational vs GBrain-only) — **human picks** | W |
| Alembic design note (no migration required in W) | W |
| Phase 8 section in `current_build_plan.md` | W (already present) |

**Allowed paths:** `docs/**` only.

### Storage decision: Hybrid — LOCKED (2026-05-23)

**Decision owner:** Marcus Bivines  
**Rationale:** The Client Universe is a full, owned copy of the client's world — not a pull-on-demand cache. CU DB (Postgres) is the authoritative structured store. GBrain is the synthesis and memory layer. DNA candidates must be queryable Postgres rows pre-HITL (to support the admin review queue, `verification_attempts` counter, and purge enforcement). Post-accept promotion writes to GBrain via `store_sigma` so the verified DNA becomes durable client memory. GBrain-only (Option B) was ruled out because the HITL queue still requires SQL-queryable rows regardless.

**Promotion rule:**
```
pre-HITL:  client_dna_candidate rows in Postgres
           (status=pending | rejected | accepted, verification_attempts counter)
post-accept: store_sigma(sigma_type=”client_dna”) → GBrain durable memory
             client_dna_candidate.status = “adopted”, row retained for audit trail
```

**Acceptance criteria:**

- [x] Every diagram box has `workflow_type`, agent owner, and storage layer in the workflow model doc.
- [x] Product rule documented: onboarding completes before historical sweeps; explicit launch of DNA track.
- [x] Collision matrix with lanes T and V signed off in tracker.
- [x] **Human:** Hybrid selected — Postgres pre-HITL, GBrain post-accept (2026-05-23).
- [x] Promotion rule written above: candidates live in Postgres until accepted; adoption writes to GBrain.

**Effort:** human ~1 day / CC ~2h  
**Depends on:** Nothing  
**Blocks:** Lane X (schema decision)

---

### Phase X — Account sweep MVP (Lane X)

**Goal:** `account_sweep` workflow with `SyncCheckpoint` per window; **180-day Gmail + Calendar first**, then 60/360/prior years.

| Deliverable | Path hint |
|---|---|
| `workflow_type=account_sweep` in orchestrator map | `adapters/orchestrator.py` |
| Workflow module | `services/api/app/workflows/account_sweep.py` (new) |
| Reuse Composio fetch patterns | `routers/providers.py`, `adapters/composio.py` |
| Checkpoint persistence | existing `SyncCheckpoint` model + alembic if new columns |
| Skill stub | `skills/sinclair_account_sweep.py` or inline processor |
| Launch surface (admin or post-onboarding CTA) | optional `apps/flavoros` admin or settings |

**Allowed paths:** `services/api/app/workflows/`, `services/api/app/skills/`, `orchestrator.py`, `routers/providers.py`, `alembic/`, `docs/workflows/` (implementation notes only)

**Acceptance criteria:**

- [ ] `POST /workflows/launch` accepts `workflow_type=account_sweep` with `window` ∈ {60d, 180d, 360d, prior_years}.
- [ ] Sweep writes `provider_events` / `normalized_items` with window-scoped idempotency keys.
- [ ] `SyncCheckpoint` records cursor per `(client_id, provider_connection_id, window)`.
- [ ] 180d Gmail + Calendar sweep completes end-to-end in dev with Composio + orchestrator polling.
- [ ] Does not regress existing `provider_first_sync` or `communication_sweep` paths.

**Effort:** human ~3–5 days / CC ~1–2 days  
**Depends on:** Phase W complete  
**Blocks:** Phase Y

---

### Phase Y — Parse & synthesize (Lane Y)

**Goal:** `client_dna_parse` skill; GBrain ingest category `client_dna_candidate`; `store_sigma` with `sigma_type=client_dna`.

| Deliverable | Path hint |
|---|---|
| Parse skill (four domains or one skill with domain param) | `services/api/app/skills/` |
| Synthesize workflow step | `workflows/client_dna_synthesize.py` (new) |
| GBrain adapter categories | `adapters/gbrain.py`, config docs |
| Candidate tables | `models.py`, `alembic/` |
| Tests | `tests/test_client_dna_*.py` |

**Allowed paths:** `services/api/app/skills/`, `adapters/gbrain.py`, `models.py`, `alembic/`, `workflows/`

**Acceptance criteria:**

- [ ] Parsed rows land in `client_dna_candidates` (or equivalent) with `domain` ∈ {contacts, locations, entities, projects}.
- [ ] Each candidate has provenance (`source_item_id`, sweep window, confidence).
- [ ] `gbrain.ingest(..., category="client_dna_candidate")` called when `GBRAIN_ADAPTER=cli`.
- [ ] SIGMA draft created via `store_sigma(..., sigma_type="client_dna")` without exposing raw SIGMA to client UI.
- [ ] Stub mode degrades gracefully (candidates stored relationally only).

**Effort:** human ~4–6 days / CC ~1–2 days  
**Depends on:** Phase X (sweep data exists)  
**Blocks:** Phase Z

---

### Phase Z — HITL verify & adoption (Lane Z)

**Goal:** Admin DNA review queue; **3× unverified** purge/cross-reference rule; `client_dna_adoption` workflow after acceptance.

| Deliverable | Path hint |
|---|---|
| Admin DNA review API | `services/api/app/routers/` (new or extend admin) |
| Admin UI queue | `apps/flavoros/src/app/admin/**`, `admin-api.ts` |
| Approval kinds for DNA verify | `approvals.py`, schemas |
| Purge / merge batch job | workflow or cron-style skill |
| Adoption workflow | `workflows/client_dna_adoption.py` |
| Readiness KV `dna_adoption` | `universe_registry.py` |

**Allowed paths:** `services/api/app/routers/`, `apps/flavoros/src/app/admin/**`, `admin-api.ts`, workflows

**Acceptance criteria:**

- [ ] Operator can list pending DNA candidates, accept/reject/merge with audit trail.
- [ ] Candidates failing verification 3 times without corroboration are purged or cross-referenced (documented algorithm).
- [ ] `client_dna_adoption` runs only for `status=accepted` candidates.
- [ ] Post-adoption: GBrain ingest `client_dna_adopted` + Client Universe reflects relationship context for retrieval (with CLI adapter).
- [ ] Client-facing UI shows plain-English summaries only, not SIGMA internals.

**Effort:** human ~5–7 days / CC ~2–3 days  
**Depends on:** Phase Y  
**Blocks:** None (enrichment complete)

---

## Lane table (coordinator)

| Lane | Goal | Allowed paths | Depends on |
|------|------|---------------|------------|
| **W** | DNA canon & storage design | `docs/**` | — |
| **X** | Account sweep MVP | `workflows/`, `skills/`, `orchestrator.py`, `routers/providers.py`, `alembic/` | W |
| **Y** | Parse & synthesize | `skills/`, `adapters/gbrain.py`, `models.py`, `alembic/`, `workflows/` | X |
| **Z** | HITL verify & adoption | `routers/`, `apps/flavoros/.../admin/**`, `admin-api.ts`, `workflows/` | Y |

## Total effort (order of magnitude)

| Track | Human | CC-assisted |
|---|---|---|
| W | 1 day | 2h |
| X | 3–5 days | 1–2 days |
| Y | 4–6 days | 1–2 days |
| Z | 5–7 days | 2–3 days |
| **Total DNA track** | **~2–3 weeks** | **~4–6 days** |

## Verification (all phases)

```bash
cd services/api && .venv/bin/python -m pytest -q
cd apps/flavoros && pnpm exec tsc --noEmit
./scripts/smoke-vertical-slice.sh   # must not regress comms-first loop
```

## Promotion checklist (when DNA track ships)

1. Update [`planned_feature_catalog.md`](../workflows/planned_feature_catalog.md) row to `partial` or `implemented` per capability.
2. Set `GBRAIN_ADAPTER=cli` on VPS for environments running adoption.
3. Update [`build_roadmap_assessment.md`](./build_roadmap_assessment.md) proof loop if DNA becomes demo-critical.
