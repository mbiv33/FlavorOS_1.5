# Multi-Tenant Model

## Core Requirement

FlavorOS should be multi-tenant from the start.

Every meaningful record, action, artifact, workflow run, memory entry, context object, integration credential, and agent activity should be scoped to a `client_id` or `tenant_id`.

## Roles

FlavorOS has two primary roles at MVP:

### 1. Client/User

The client uses FlavorOS to operate their personal, professional, household, and project universe.

Client capabilities include:

- connect accounts and context providers,
- complete onboarding,
- receive briefings,
- hold meetings with the agent system,
- review communications and calendar context,
- approve drafts and actions,
- receive reports and artifacts,
- manage travel/logistics,
- view projects and tasks,
- update preferences and profile information.

### 2. Developer/Admin

The developer/admin manages the platform.

Admin capabilities include:

- monitor tenants,
- test agents,
- configure agents, skills, workflows, and personas,
- review ingestion health,
- inspect failed jobs,
- manage provider connections,
- view logs and audit trails,
- monitor artifact production,
- tune prompts/configs,
- run diagnostics.

## UI Principle

The client and admin UI should share the same overall interface language.

The difference is not a totally different app. The difference is role-based access.

```text
Client UI = calm unified command center
Admin UI = same command center + diagnostics + configuration + monitoring widgets
```

## Tenant Isolation

Each client should have an isolated Client Universe.

Data belonging to one client must not be accessible to another client unless explicitly designed and authorized.

Each database table should include tenant scoping where applicable:

```text
client_id
user_id
role
source_provider
source_account_id
dimension
object_type
object_id
visibility
permissions
created_at
updated_at
```

## Tenant-Scoped Objects

Tenant scoping should apply to:

- profile records,
- preferences,
- provider connections,
- memory records,
- context records,
- knowledge entries,
- SIGMA Arts,
- Client Arts,
- projects,
- tasks,
- relationships,
- communications,
- calendar events,
- files,
- workflow runs,
- agent runs,
- approvals,
- audit logs.

## Avoid

Do not hard-code app structure around W2 Work, LLC Work, Career, and Personal as global folders.

Those are client-specific dimensions inside the Client Universe.

## Recommended Pattern

```text
Platform
└── Client/Tenant
    └── Client Universe
        ├── Profile
        ├── Dimensions
        ├── Memory
        ├── Context
        ├── Knowledge
        ├── Projects
        ├── Relationships
        ├── Artifacts
        ├── SIGMA
        └── Connected Providers
```
