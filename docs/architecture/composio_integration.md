# Composio Integration

## Definition

Composio is the external provider access layer for FlavorOS.

It allows FlavorOS to connect to context providers and tools such as email, calendar, files, project management, communications, and other apps.

## Role

Composio provides authorized access.

FlavorOS should still normalize important records into its own database as part of the Client Universe.

```text
Composio = access layer
FlavorOS DB = normalized client operating state
GBrain = ingestion, indexing, memory, and retrieval
Agents = work execution
```

## Provider Flow

```text
Client connects provider through Composio
        ↓
Composio manages authorization/access
        ↓
GBrain or sync workers read data through Composio
        ↓
Data is normalized and written to Client Universe
        ↓
Agents use normalized data and retrieval context
```

## Integration Folder

```text
integrations/
└── composio/
    ├── provider_registry.ts
    ├── auth_flows.ts
    ├── sync_jobs.ts
    ├── action_adapters.ts
    ├── webhook_handlers.ts
    ├── normalization/
    ├── schemas/
    └── README.md
```

## Provider Categories

MVP provider categories may include:

- email,
- calendar,
- files/docs,
- contacts,
- project management,
- messaging,
- finance/accounting,
- travel,
- social media.

## Design Rule

Agents should not directly create fragmented provider-specific state.

The preferred flow is:

```text
Provider data → Composio → GBrain/sync worker → Client Universe → Agent retrieval/use
```

## Action Rule

When an agent wants to perform an external action, it should route through governed services and Composio action adapters.

Examples:

- send email,
- create calendar event,
- update task,
- retrieve file,
- create draft,
- post content,
- sync contacts.

Actions should respect:

- tenant scoping,
- user approvals,
- provider permissions,
- audit logs,
- client preferences,
- role permissions.
