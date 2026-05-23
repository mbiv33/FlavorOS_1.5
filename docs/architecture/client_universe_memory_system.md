# Client Universe Memory System

**Last updated:** 2026-05-23  
**Status:** Canonical architecture — locked by Marcus Bivines.  
**Related:** [`client_universe_model.md`](./client_universe_model.md), [`gbrain_integration.md`](./gbrain_integration.md), [`client_dna_adoption_build_plan.md`](../planning/client_dna_adoption_build_plan.md)

---

## Core principle: preparation over retrieval

Agents do not search at work time. They work from a pre-shaped memory built before the task runs.

The system exists to eliminate live database search during agent execution and to prevent hallucination from missing or stale context. If an agent needs data to complete Tuesday's task, that data is assembled on Monday — not fetched at the moment the agent wakes up.

---

## Two hemispheres

The Client Universe Brain operates with two primary hemispheres:

### 1. CU DB — Client Universe Database (Postgres)

The **authoritative, complete, owned** copy of everything FlavorOS knows about a client.

- Source of truth. Large, omniscient, always synced.
- Contains every data object from every integration: email, calendar, social channels, documents, financial records.
- Structured, queryable, tenant-scoped, auditable.
- Not a cache — this is data FlavorOS owns on the client's behalf, not pulled on demand.
- Kept current by chrons running continuous sync loops against integration providers (Composio).

```text
CU DB = the client's world, structured and owned
```

### 2. IPM — Instant Persistent Memory

The **pre-shaped working memory** agents use to execute daily tasks.

- Smaller, closer, purpose-built for the day's work.
- Built ahead of scheduled tasks by sweep agents reading from CU DB.
- Not a live query — a prepared context packet assembled before the agent needs it.
- Ephemeral relative to CU DB, but intentionally populated (not lazily filled).

```text
IPM = the agent's desk, set up the night before
```

---

## How they work together

```text
Integration providers (Gmail, Calendar, Social)
        ↓  [Chrons — continuous sync]
CU DB  ←────────────────────────────────── always current
        ↓  [Sweep agents — run before scheduled work]
IPM  ←─ pre-shaped context packet for today's tasks
        ↓  [Agent execution]
Work product (Artifacts, Approvals, Outbound actions)
        ↓
CU DB updated with outcomes
```

---

## The Monday/Tuesday pattern

The canonical example of preparation-over-retrieval:

1. **Chrons run continuously** → every email, calendar event, and document lands in CU DB as it arrives. CU DB is always synced.
2. **Monday night → sweep agents run** → read CU DB for everything relevant to Tuesday's scheduled task (e.g. monthly financial statement delivery). Shape it into an IPM work order.
3. **Tuesday → agent wakes up** → reads the IPM work order → produces the deliverable from pre-assembled context. No live DB search. No hallucination from missing data.

This pattern applies to any scheduled workflow: briefings, standup prep, communication sweeps, project reviews.

---

## GBrain's role

GBrain is the connective tissue between CU DB and IPM.

```text
CU DB  →  GBrain synthesis / correlations  →  IPM context packet
```

GBrain:
- Ingests CU DB objects and indexes them for semantic retrieval
- Runs correlations across objects (email → contact → project → decision)
- Synthesizes DNA candidates into SIGMA memory shapes
- Builds the context packets that populate IPM
- Maintains durable post-verification client memory (adopted DNA, relationship context)

GBrain does not replace CU DB. CU DB holds the structured facts. GBrain makes them navigable, connected, and memory-shaped.

---

## DNA and the hybrid storage rule

Client DNA adoption maps directly to this two-hemisphere model:

| Phase | Layer | Mechanism |
|---|---|---|
| Sweep + parse | CU DB | `client_dna_candidate` Postgres rows |
| Pre-HITL candidates | CU DB | Queryable, auditable, `verification_attempts` counter |
| Admin review queue | CU DB | SQL query → UI |
| 3× unverified → purge | CU DB | Delete row after counter threshold |
| Post-accept adoption | GBrain | `store_sigma(sigma_type="client_dna")` |
| Durable relationship memory | GBrain | Available to IPM for future context packets |

**Storage decision (locked 2026-05-23):** Hybrid. Candidates in Postgres pre-HITL; promotion to GBrain post-accept.

---

## Chron responsibilities

Chrons are the sync heartbeat of the system. They are not optional infrastructure.

| Chron | Frequency | Purpose |
|---|---|---|
| Provider sync | Continuous / N min | Pull new email, calendar, social data into CU DB |
| Outbound dispatch | Every minute | Fire queued outbound actions whose `scheduled_send_at` is due |
| Sweep prep | Nightly / pre-scheduled | Build IPM work orders ahead of next-day agent tasks |
| GBrain correlation | Periodic | Re-run correlations as CU DB grows |
| Checkpoint | Per sweep window | Record `SyncCheckpoint` cursor per `(client_id, provider, window)` |

---

## Agent SIGMAs

Agent SIGMAs are short-term memory shapes for a specific workflow or service run. They live in IPM, not CU DB. They are built from GBrain context packets and discarded after the workflow completes (or retained briefly for handoff).

```text
SIGMA = workflow-scoped working memory
IPM   = the active set of SIGMAs for the current day
CU DB = the permanent store from which SIGMAs are built
```

---

## System rules

```text
1. Agents work from IPM. They do not search CU DB at execution time.
2. CU DB is always synced. Chrons own this responsibility.
3. GBrain connects CU DB objects. Agents do not do their own correlation.
4. Preparation happens before the task. Sweep agents run ahead of schedule.
5. DNA candidates live in Postgres until verified. Post-accept memory lives in GBrain.
6. Agents query the Client Universe. Agents do not become the Client Universe.
```
