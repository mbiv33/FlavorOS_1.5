# Agent Consolidation

Status: prepared migration candidate.

This document normalizes old five-agent config intake into the approved three-agent FlavorOS 1.5 MVP.

## Source Material

- `_migration/decisions.md`
- `_migration/intake/old_agents/agents/khadijah/agent.yaml`
- `_migration/intake/old_agents/agents/khadijah/SOUL.md`
- `_migration/intake/old_agents/agents/sinclair/agent.yaml`
- `_migration/intake/old_agents/agents/sinclair/SOUL.md`
- `_migration/intake/old_agents/agents/maxine/agent.yaml`
- `_migration/intake/old_agents/agents/kyle/agent.yaml`
- `_migration/intake/old_agents/agents/scooter/agent.yaml`
- `_migration/intake/old_workflows/cron/schedules.yaml`

## Core Decision

The MVP has three operational agents:

- Khadijah
- Sinclair
- Regine

Maxine, Kyle, and Scooter should not remain standalone MVP runtime agents. Their useful skills, workflow responsibilities, and personas should be absorbed into Khadijah, Sinclair, or Regine.

## Khadijah

Role:

- conductor
- workflow orchestrator
- approval routing owner
- briefing owner
- project/ops/finance oversight
- final synthesis
- cross-domain impact/ripple synthesis

Absorbs from Maxine:

- project management
- milestone risk
- daily task prep
- finance pulse
- budget/report synthesis
- invoicing/payables oversight
- PAC/PTQ-style evaluation as internal workflow logic
- operations and infrastructure oversight where product-relevant

Owns MVP workflows:

- Morning Standup
- COB Work Day
- project summaries
- approval review
- Completion Summary synthesis
- SIGMA/GBrain ripple synthesis

Should not:

- expose raw agent logs to client
- become a chat-first interface
- bypass HITL on governed actions

## Sinclair

Role:

- communications boundary owner
- calendar and scheduling owner
- private/local data boundary
- Butler protocol owner
- provider-sensitive workflow owner
- wellness/rhythm support

Keeps from old Sinclair:

- inbox triage
- scheduling and meeting prep
- communication drafting
- time guarding
- wellness signal awareness
- preference guarding

Owns MVP workflows:

- Communication Sweep
- Comms & Calendar Meeting prep
- meeting prep artifacts
- calendar hold approvals
- sensitive communication draft approvals
- Goodnight support where wellness/rhythm is relevant

Should not:

- send public-facing or sensitive communications without approval
- expose private provider details unnecessarily
- make the MVP chat-forward

## Regine

Role:

- research
- travel/logistics
- relationship context
- social/brand context
- external options and recommendations

Absorbs from Scooter:

- travel planning
- travel logistics
- travel prep/debrief
- vendor/destination intelligence
- web research
- logistics research
- travel receipts only where not finance-owned

Absorbs from Kyle:

- relationship management
- CRM context
- networking prep
- public profile/brand/social context
- relationship-sensitive recommendations

Owns MVP workflows:

- Travel Meeting prep
- travel option artifacts
- relationship/research artifacts
- reports/recommendations where research-heavy
- vendor/destination SIGMA updates

Should not:

- book or send externally without governed approval
- own private communications boundary when Sinclair is more appropriate

## Persona Treatment

Old agents may survive as personas or skill lineages, not runtime agents.

| Old entity | New treatment |
|---|---|
| Maxine | Khadijah skill/persona lineage for ops, projects, finance |
| Kyle | Regine skill/persona lineage for relationships, CRM, brand |
| Scooter | Regine skill/persona lineage for travel, logistics, research |
| Overton | Sinclair/Butler local-private boundary persona/protocol |

## Workflow Ownership Map

| Workflow area | Owner |
|---|---|
| Briefings | Khadijah |
| Approval orchestration | Khadijah |
| Projects | Khadijah |
| Finance oversight | Khadijah |
| Communication Sweep | Sinclair |
| Calendar/meeting prep | Sinclair |
| Wellness/rhythm | Sinclair |
| Travel/logistics | Regine |
| Research | Regine |
| Relationships/CRM/brand | Regine |
| SIGMA/GBrain state updates | Owner by domain, coordinated by Khadijah |

## Runtime Notes

Do not carry forward old runtime assumptions blindly:

- old Hermes/OpenClaw details are reference only
- old Obsidian plugin requirements are reference only
- old Telegram/voice human interface settings are future-state/reference
- old five-agent NATS topics should be remapped to three-agent or workflow-centric topics

## HITL Rule

All three agents must route governed actions through approval:

- money
- invoices/payments
- calendar commitments
- public-facing communications
- sensitive relationships
- travel bookings
- irreversible external actions

## Migration Output

Future real repo candidates should include:

- three agent manifests
- skill maps
- workflow ownership map
- provider permissions matrix
- HITL policy map
- agent-facing SIGMA/GBrain permissions
