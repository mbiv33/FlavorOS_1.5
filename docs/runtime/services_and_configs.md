# Services and Configurations

## Services

Services are the running software components that execute the system.

```text
services/ = executable runtime components
```

Examples:

- API service,
- authentication service,
- tenant manager,
- orchestrator,
- scheduler,
- worker,
- briefing engine,
- meeting engine,
- artifact engine,
- notification engine.

Services make the system operate. They run workflows, route requests, execute jobs, manage provider sync, create artifacts, and expose APIs.

## Recommended MVP Services

### API

Main backend interface for the app.

### Auth

Manages login, roles, sessions, provider authentication, and access control.

### Tenant Manager

Maintains client/tenant scoping and isolation.

### Orchestrator

Routes work between agents, workflows, skills, GBrain, Composio, and approval systems.

### Scheduler

Runs recurring jobs such as briefings, syncs, checks, and reminders.

### Worker

Processes background jobs.

### Briefing Engine

Generates and manages Morning Standup, COB Work Day, Goodnight, and future briefing types.

### Meeting Engine

Handles client-led, impromptu, or structured meeting sessions.

### Artifact Engine

Creates, stores, versions, and routes Client Artifacts and SIGMA Artifacts.

### Notification Engine

Handles alerts, reminders, approval prompts, and status updates.

## Future-State Services

### Voice Gateway

Supports voice interface and local/cloud voice routing in a future-state layer. It is not required for the visual-first MVP.

## Configurations

Configurations are declarative settings that tell services, agents, workflows, integrations, and runtimes how to behave.

```text
configs/ = knobs, settings, environment rules, and behavior declarations
```

Examples:

- which agents are enabled,
- which runtime an agent uses,
- which personas are assigned to agents,
- which workflows are active,
- which skills are available,
- which tools require approval,
- which provider connections are enabled,
- which GBrain mode is active,
- what tenant isolation rules apply,
- what environment is running.

## Example Configs

```text
configs/
├── app.yaml
├── tenants.yaml
├── roles.yaml
├── agents.yaml
├── personas.yaml
├── skills.yaml
├── workflows.yaml
├── composio.yaml
├── gbrain.yaml
├── runtimes.yaml
└── environments/
    ├── local.yaml
    ├── staging.yaml
    └── production.yaml
```

## Core Distinction

```text
Services are executable.
Configurations are declarative.
```

Services run the system.

Configurations tell the system what is enabled, permitted, routed, scoped, and governed.
