# Recommended Repository Structure

## Root Structure

```text
flavor-os/
│
├── apps/
│   ├── client/
│   ├── admin/
│   └── mobile_shell/
│
├── services/
│   ├── api/
│   ├── auth/
│   ├── tenant_manager/
│   ├── orchestrator/
│   ├── scheduler/
│   ├── worker/
│   ├── briefing_engine/
│   ├── meeting_engine/
│   ├── artifact_engine/
│   ├── notification_engine/
│   └── voice_gateway/
│
├── agents/
│   ├── khadijah.conductor/
│   ├── sinclair.communications/
│   └── regine.research_logistics/
│
├── personas/
│   ├── khadijah.orchestration/
│   ├── maxine.project_management/
│   ├── maxine.finance_oversight/
│   ├── sinclair.executive_assistant/
│   ├── sinclair.preference_guardian/
│   ├── sinclair.wellness_guru/
│   ├── overton.secrets_butler/
│   ├── overton.household_management/
│   ├── scooter.travel_logistics/
│   ├── scooter.researcher/
│   ├── regine.relationships/
│   ├── kyle.crm_relationships/
│   ├── regine.lifestyle/
│   └── regine.social_media/
│
├── workflows/
│   ├── onboarding/
│   ├── morning_standup/
│   ├── cob_workday/
│   ├── goodnight/
│   ├── meetings/
│   ├── communication/
│   ├── scheduling/
│   ├── travel/
│   ├── logistics/
│   ├── finance/
│   ├── preparation/
│   ├── project_management/
│   ├── work_product/
│   └── approval_review/
│
├── skills/
│   ├── orchestration/
│   ├── email_sms/
│   ├── scheduling/
│   ├── travel/
│   ├── logistics/
│   ├── finance/
│   ├── preparation/
│   ├── project_management/
│   ├── relationship_management/
│   ├── household_management/
│   ├── social_media_coordination/
│   ├── research/
│   └── artifact_generation/
│
├── client_universe/
│   ├── schemas/
│   └── clients/
│       └── <client_id>/
│           ├── profile.yaml
│           ├── preferences.yaml
│           ├── account_aliases.yaml
│           ├── hitl_policy.yaml
│           ├── onboarding_status.yaml
│           ├── artifacts/
│           ├── sigma/
│           ├── knowledge_base/
│           └── memory/
│
├── subsystems/
│   └── gbrain/
│       ├── ingest/
│       ├── classify/
│       ├── index/
│       ├── retrieve/
│       ├── summarize/
│       ├── memory_update/
│       ├── context_builder/
│       ├── adapters/
│       ├── schemas/
│       └── api/
│
├── integrations/
│   ├── composio/
│   ├── gmail/
│   ├── google_calendar/
│   ├── google_drive/
│   ├── project_management/
│   ├── contacts/
│   ├── finance/
│   ├── twilio/
│   └── social_media/
│
├── runtime/
│   ├── local/
│   ├── cloud/
│   ├── hermes_local/
│   ├── hermes_cloud/
│   └── openwebui_cloud/
│
├── governance/
│   ├── constitution.md
│   ├── tenant_isolation.md
│   ├── permissions.yaml
│   ├── approval_rules.yaml
│   ├── escalation_rules.yaml
│   └── audit_policy.md
│
├── configs/
│   ├── app.yaml
│   ├── tenants.yaml
│   ├── roles.yaml
│   ├── agents.yaml
│   ├── personas.yaml
│   ├── skills.yaml
│   ├── workflows.yaml
│   ├── composio.yaml
│   ├── gbrain.yaml
│   ├── runtimes.yaml
│   └── environments/
│       ├── local.yaml
│       ├── staging.yaml
│       └── production.yaml
│
└── docs/
    ├── README.md
    ├── architecture/
    ├── agents/
    ├── workflows/
    ├── runtime/
    ├── governance/
    ├── ui/
    └── planning/
```

## Folder Meanings

| Folder | Meaning |
|---|---|
| `apps/` | User-facing applications |
| `services/` | Running backend/frontend service components |
| `agents/` | Operational agent definitions |
| `personas/` | Persona definitions and behavior modes |
| `workflows/` | Repeatable procedures |
| `skills/` | Reusable agent capabilities |
| `client_universe/` | Client-scoped data model and schemas |
| `subsystems/gbrain/` | Memory/context ingestion and retrieval engine |
| `integrations/composio/` | External provider access layer |
| `runtime/` | Deployment/runtime targets |
| `governance/` | Permissions, approvals, audit, isolation |
| `configs/` | Declarative system settings |
| `docs/` | Human/developer documentation |

## MVP UI Note

FlavorOS 1.5 MVP is a visual-first, command-and-control WebApp. Voice, live call surfaces, persistent chat, right rail, transcript, and command palette concepts are future-state unless explicitly promoted later.

The `voice_gateway` service shown in the structure is a future-state service placeholder, not an MVP requirement.
