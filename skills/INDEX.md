# FlavorOS Skill Registry

This registry aligns canonical skills with the MVP agent model and [`docs/planning/current_build_plan.md`](../docs/planning/current_build_plan.md).

| Skill | Owning agent | Persona mode | Build-plan status |
|---|---|---|---|
| `chief-of-staff` | Khadijah | `khadijah.orchestration` | `proof_loop` |
| `morning-standup-briefing` | Khadijah | `khadijah.orchestration` | `proof_loop` |
| `cob-workday-briefing` | Khadijah | `khadijah.orchestration` | `proof_loop` |
| `workflow-approval-control` | Khadijah | `khadijah.orchestration` | `proof_loop` |
| `project-management-control` | Khadijah | `maxine.project_management` | `proof_loop` |
| `daily-task-manager` | Khadijah | `maxine.project_management` | `proof_loop` |
| `daily-task-prep` | Khadijah | `maxine.project_management` | `proof_loop` |
| `task-execution-status-monitoring` | Khadijah | `maxine.project_management` | `proof_loop` |
| `project-initiation-milestone-mapping` | Khadijah | `maxine.project_management` | `skill_protocol_only` |
| `ptq-resolution-engine` | Khadijah | `maxine.project_management` | `skill_protocol_only` |
| `pac-triage-and-logging` | Khadijah | `maxine.project_management` | `skill_protocol_only` |
| `ripple-synthesis` | Khadijah | `khadijah.orchestration` | `skill_protocol_only` |
| `obsidian-chief-of-staff` | Khadijah | `khadijah.orchestration` | `skill_protocol_only` |
| `obsidian-operations` | Khadijah | `maxine.project_management` | `skill_protocol_only` |
| `clickup-obsidian-project-management` | Khadijah | `maxine.project_management` | `skill_protocol_only` |
| `financial-management` | Khadijah | `maxine.finance_ops` | `skill_protocol_only` |
| `financial-ingestion-normalization` | Khadijah | `maxine.finance_ops` | `skill_protocol_only` |
| `receipt-capture-matching` | Khadijah | `maxine.finance_ops` | `skill_protocol_only` |
| `budget-dashboard-generation` | Khadijah | `maxine.finance_ops` | `skill_protocol_only` |
| `ledger-reconciliation` | Khadijah | `maxine.finance_ops` | `skill_protocol_only` |
| `accounts-receivable-invoicing-lifecycle` | Khadijah | `maxine.finance_ops` | `skill_protocol_only` |
| `accounts-payable-expense-routing` | Khadijah | `maxine.finance_ops` | `skill_protocol_only` |
| `monthly-financial-reporting-synthesis` | Khadijah | `maxine.finance_ops` | `skill_protocol_only` |
| `infrastructure-ops` | Khadijah | `maxine.finance_ops` | `skill_protocol_only` |
| `khadijah-voice` | Khadijah | `khadijah.orchestration` | `deferred` |
| `executive-assistant` | Sinclair | `sinclair.executive_assistant` | `proof_loop` |
| `goodnight-briefing` | Sinclair | `watson.wellness` | `proof_loop` |
| `inbound-communications-draft-response` | Sinclair | `sinclair.executive_assistant` | `proof_loop` |
| `meeting-lifecycle-time-guarding` | Sinclair | `sinclair.executive_assistant` | `proof_loop` |
| `information-diet-boundary-defense` | Sinclair | `sinclair.preference_guardian` | `proof_loop` |
| `wellness` | Sinclair | `watson.wellness` | `retained_surface` |
| `obsidian-executive-assistant` | Sinclair | `sinclair.executive_assistant` | `skill_protocol_only` |
| `sinclair-voice` | Sinclair | `sinclair.executive_assistant` | `deferred` |
| `briefing-coordination` | Regine | `regine.lifestyle` | `proof_loop` |
| `relationship-manager` | Regine | `regine.relationships` | `proof_loop` |
| `executive-prep-networking-brief` | Regine | `regine.relationships` | `skill_protocol_only` |
| `post-event-synthesis-crm-update` | Regine | `regine.relationships` | `skill_protocol_only` |
| `brand-social` | Regine | `regine.social_media` | `retained_surface` |
| `obsidian-relationships` | Regine | `regine.relationships` | `skill_protocol_only` |
| `revenue-ops` | Regine | `regine.relationships` | `skill_protocol_only` |
| `ripple-observation` | Regine | `regine.relationships` | `skill_protocol_only` |
| `web-research` | Regine | `scooter.researcher` | `skill_protocol_only` |
| `logistics-research` | Regine | `scooter.researcher` | `skill_protocol_only` |
| `tech-ops` | Regine | `overton.tech_readiness` | `skill_protocol_only` |
| `travel-logistics` | Regine | `scooter.travel_logistics` | `retained_surface` |
| `travel-planning` | Regine | `scooter.travel_logistics` | `retained_surface` |
| `travel-booking` | Regine | `scooter.travel_logistics` | `retained_surface` |
| `travel-prep` | Regine | `scooter.travel_logistics` | `retained_surface` |
| `travel-itinerary` | Regine | `scooter.travel_logistics` | `retained_surface` |
| `travel-return` | Regine | `scooter.travel_logistics` | `retained_surface` |
| `travel-debrief` | Regine | `scooter.travel_logistics` | `retained_surface` |
| `travel-receipts` | Regine | `scooter.travel_logistics` | `retained_surface` |
| `travel-universe-update` | Regine | `scooter.travel_logistics` | `retained_surface` |
| `obsidian-logistics` | Regine | `scooter.travel_logistics` | `skill_protocol_only` |

## Notes

- Maxine, Scooter, Kyle, Overton, and Watson are persona lineage or modes, not standalone MVP agent owners.
- Finance skills remain canonical as model, schema, boundary, skill, and approval posture. Connector-backed execution remains outside the first proof loop unless explicitly promoted.
- Travel skills remain visible and future-capable, but the first proof loop should not depend on travel execution unless explicitly needed for a demo.
- Voice skills are deferred future-state capabilities unless promoted by the build plan.
