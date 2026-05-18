# Skills

This directory is the canonical home for FlavorOS reusable agent capabilities.

The current build direction is controlled by [`docs/planning/current_build_plan.md`](../docs/planning/current_build_plan.md). Skills are part of the MVP proof loop where they support workflow routing, artifact generation, approval packets, completion summaries, and approval-gated outbound actions.

## Canonical Model

- `skills/<skill-name>/SKILL.md` is the single source of truth for skill instructions.
- `agents/*/agent.yaml` mounts skills by name.
- `agents/*/protocols/` keeps protocol details that skills execute.
- `agents/*/skills/` is retained only for compatibility pointers during the consolidation period.

## Registry

Use [`INDEX.md`](INDEX.md) to see the owning agent, persona mode, and build-plan status for each skill.

Build-plan status values:

- `proof_loop`: required for the MVP proof loop.
- `skill_protocol_only`: canonical capability retained as a skill/protocol foundation, but not complete runtime implementation.
- `retained_surface`: visible or planned surface retained, but not a first proof-loop dependency.
- `deferred`: future-state capability unless explicitly promoted.
