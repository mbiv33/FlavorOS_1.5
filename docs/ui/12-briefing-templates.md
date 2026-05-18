# 12 · Briefing Templates

This document defines the three MVP Briefings as concrete screen templates: agenda sections, expected cards per section, data each section binds to, and completion behavior.

Briefings are both UI surfaces and workflow/storage frameworks. They share the Structured Interaction Surface (`05-structured-interaction-surface.md`) and use the command components from `06-command-components.md`.

Controlling docs: `docs/planning/current_build_plan.md`, `docs/workflows/workflow_runtime_model.md`, `docs/agents/agent_runtime_contracts.md`.

## Briefing Screen Anatomy

All three briefings share the same screen shell:

```text
Header
  Title · Status chip · Date · Owning agent (persona signature, optional)
Prepared Context
  One-paragraph summary of what the system has staged for this briefing
Agenda Rail
  Step list with state per step (pending / active / completed / deferred / skipped / needs revision)
Active Section
  Section title
  Dialog Step Block(s)
  Approval Card(s) if present
  Artifact Card(s) if present
  Link Card(s) if present
  Command Button row (continue / approve / defer / revise / skip / open source / finish)
Footer
  Save & resume later · Open completion summary (after finish)
```

Notes:

- The agenda rail is always visible; the active section scrolls within it.
- Voice/narration is **not** required. Each section MAY include a `narration_script` field for future presenter-note rendering; the MVP renders the visible `summary` only.
- No persistent chat composer. Questions for the agent are captured as a `notes` block tied to the section, not a live thread.

## Briefing 1 · Morning Standup

Purpose: start the day with priorities locked, approvals cleared, schedule clear, dependencies surfaced.

Owning agent attribution: Khadijah (conductor) leads; Sinclair and Regine contribute prepared items in their lanes.

Direction of flow: Agent → Client download (the client receives prepared work and makes decisions).

### Sections

| # | Section | Purpose | Typical contents |
|---|---|---|---|
| 1 | Greeting / opening | Calm orientation | Date, greeting, persona signature, optional small-talk line |
| 2 | Wellness check-in | Soft client survey | One or two short prompts, optional skip; stored to wellness state |
| 3 | Today's priorities | Lock the day | 3–5 priority cards derived from goals, projects, calendar |
| 4 | Calendar and schedule risks | Surface conflicts | Conflict cards, next-event card, calendar Link Cards |
| 5 | Communications needing review | Decisions on prepared comms | Approval Cards for draft responses; Link Cards to provider source |
| 6 | Client approvals | Other governed actions | Approval Cards for finance, travel/logistics, relationships |
| 7 | Projects and dependencies | Status + blockers | Project cards with next-step and blocker fields |
| 8 | Reports / artifacts ready | Generated work to review | Artifact Cards (compact) |
| 9 | Announcements and reminders | Calm awareness | Plain-English bullets; no counters |
| 10 | Action items and next steps | Confirm accountability | Completion Summary preview + finish command |

### Data binding

| Section | Reads |
|---|---|
| 1 | `clients`, `client_universe`, `briefing_runs.morning_standup.today` |
| 2 | `wellness_checkins` (last entry + prompts from briefing definition) |
| 3 | `priorities`, `goals`, `projects`, top `calendar_items` |
| 4 | `calendar_items` (next 12h), conflict-detector output |
| 5 | `artifacts` of type `communication_draft` where state in (`ready_for_approval`, `needs_revision`) |
| 6 | `approvals` where `state = needs_approval` and category in (finance, travel, relationships, other governed) |
| 7 | `projects` + `project_tasks` blocker rows |
| 8 | `artifacts` where `state = ready_for_review` and visibility = client |
| 9 | `announcements`, `reminders` |
| 10 | `completion_summaries` row created on finish |

### Completion behavior

On finish, the run produces a Completion Summary listing decisions, approvals, deferrals, artifacts opened, queued outbound actions, and the next expected prepared work (typically COB Work Day).

## Briefing 2 · COB Work Day

Purpose: close the workday with wins acknowledged, approvals cleared, unfinished items routed, evening prepared.

Owning agent: Khadijah leads; Sinclair handles comms/calendar wrap; Regine handles research/relationships wrap.

Direction of flow: Agent → Client download.

### Sections

| # | Section | Purpose | Typical contents |
|---|---|---|---|
| 1 | Quick check-in / wins | Brief acknowledgement | 1–3 cards highlighting completions |
| 2 | Key outcomes from today | Recap | Completion Summary excerpts, milestone hits |
| 3 | Pending approvals | Clear the queue before EOD | Approval Cards |
| 4 | Updates and responses | Communications wrap | Artifact Cards (sent/queued/draft) |
| 5 | Open requests / research | Status on in-flight asks | Research artifact cards with state |
| 6 | Evening schedule and reminders | Soft transition | Calendar cards, reminder bullets |
| 7 | Obstacles and support needed | Bottlenecks | Blocked-project cards, escalation prompts |
| 8 | Wellness / recreation note | Encouragement | Plain-text suggestion, optional skip |
| 9 | Query action items and next steps | Capture client needs | Notes block + Completion Summary preview |

### Data binding

| Section | Reads |
|---|---|
| 1 | `completion_summaries` for today, `projects.progress` deltas |
| 2 | Aggregated `workflow_runs.state = completed` today |
| 3 | `approvals` still `needs_approval` |
| 4 | `artifacts` of type `communication_draft` + recent `outbound_actions` |
| 5 | `artifacts` of type `research_*`, `recommendation_*` |
| 6 | `calendar_items` next 12h |
| 7 | `workflow_runs.state = blocked`, project blockers |
| 8 | wellness preferences |
| 9 | new `notes` written into the run |

### Completion behavior

Run produces a Completion Summary and seeds Goodnight's prepared context.

## Briefing 3 · Goodnight

Purpose: reflect on the day, update goals/preferences, capture soft personal/professional context, prepare early-morning awareness.

Owning agent: Sinclair leads (wellness/calm posture); Khadijah remains conductor of the run.

Direction of flow: Client → Agent download (the client provides context that updates Client Universe and GBrain).

### Sections

| # | Section | Purpose | Typical contents |
|---|---|---|---|
| 1 | Day review | How was your day | Single open prompt, free text or quick chips |
| 2 | Wellness meter | Single read | 1-tap scale + optional note |
| 3 | Goals / milestones / priorities update | Maintain Client Universe | Editable goal cards |
| 4 | Client journal protocol (optional) | Highlights, insights, gratitude | Prompt list, all skippable |
| 5 | Worries / concerns | Surface for handling tomorrow | Free-text capture |
| 6 | Announcements and reminders | Light awareness | Brief bullets |
| 7 | Early-morning schedule and tasks | Tomorrow preview | Next-day calendar + priority preview |

### Data binding

| Section | Reads | Writes |
|---|---|---|
| 1 | — | `journal_entries.day_review` |
| 2 | last wellness reading | `wellness_checkins` |
| 3 | `goals`, `priorities` | updates to same |
| 4 | journal preferences | `journal_entries.highlights/insights/gratitude/worries` |
| 5 | — | `journal_entries.worries`, may create `agent_tasks` for next-day handling |
| 6 | `reminders` | — |
| 7 | tomorrow's `calendar_items`, tomorrow's `priorities` | — |

### Completion behavior

Run produces a soft Completion Summary, updates Client Universe / GBrain context, and may create agent tasks for next-morning Standup preparation.

## State Machine (shared across briefings)

| State | Meaning |
|---|---|
| `not_prepared` | Workflow hasn't generated agenda items yet |
| `ready` | Agenda staged and waiting for client to start |
| `in_progress` | Client opened the briefing; agenda rail active |
| `paused` | Client used "Save & resume later" |
| `completed` | Final section confirmed, Completion Summary created |
| `expired` | Time-of-day window passed without start (still reviewable as a summary) |

The Briefing Launcher cards on Command Center read this state to set the primary command label (`Start`, `Resume`, `Open summary`, `Defer`).

## Backend Dependencies (per Briefing run)

- `briefing_definitions` (sections, default prompts, allowed commands, narration scripts)
- `briefing_runs` (state, started_at, completed_at, paused_at, client_id)
- `agenda_items` (per section, with linked artifact/approval IDs and per-step state)
- `approvals`, `artifacts`, `link_cards` referenced by sections
- `completion_summaries` (created on finish)
- `journal_entries`, `wellness_checkins`, `goals`, `priorities` for Goodnight writes
- `agent_tasks` for follow-up work created during the run

A Briefing should never render an agenda section that does not bind to data; empty optional sections collapse, required sections render in their empty state with a calm one-line explanation.

## What Briefings Are Not

- not a live transcript
- not a voice call
- not a chat thread
- not a static script (every section binds to durable state)
- not the only way to approve work (Approval Cards live wherever the work lives)
