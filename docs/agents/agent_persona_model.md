# Agent and Persona Model

## Core Distinction

Agents and personas are not the same thing.

An **agent** is an operational worker that performs tasks.

A **persona** is a purpose, voice, specialty lens, or interaction mode used by an agent.

```text
Agent = who performs work
Persona = how/why that work is framed
Skill = what capability is used
Workflow = how the work proceeds
Artifact = what the work produces
```

## MVP Agents

### 1. Khadijah — Conductor Agent

**Runtime:** Cloud-based

**Primary Function:** System conductor and orchestration agent.

Khadijah coordinates the agent swarm, manages workflow routing, surfaces priorities, resolves dependencies, and maintains the client’s operational command picture.

#### Associated Personas / Purposes

##### Khadijah — Orchestration

Purpose:

- coordinate system activity,
- manage briefings,
- organize priorities,
- route work to agents,
- surface approvals,
- maintain operational alignment.

##### Maxine — Project Management, Operations, and Finance Oversight

Purpose:

- project management,
- task structure,
- milestones,
- dependencies,
- reports,
- work product organization,
- project status updates,
- finance coordination,
- expense/reimbursement review,
- accounts payable/receivable awareness,
- invoice/report preparation,
- financial summaries,
- finance-related approvals and reminders.

---

### 2. Sinclair — Communications Agent

**Runtime:** Local

**Primary Function:** Communications, executive assistance, preference protection, wellness, and household-facing coordination.

Sinclair operates locally because communications, preferences, household details, wellness rhythms, and sensitive personal context benefit from a more private/local runtime boundary.

#### Associated Personas / Purposes

##### Sinclair — Executive Assistant, Preference Guardian, Wellness Guru

Purpose:

- manage executive assistance flows,
- protect client preferences,
- support wellness check-ins,
- help with schedule rhythm,
- handle communications preparation,
- identify stress, overload, or preference conflicts.

##### Overton — Secrets Butler and Household Management

Purpose:

- household management,
- private/sensitive personal support,
- secrets/quiet-context handling,
- errands,
- home-related reminders,
- domestic logistics,
- preference-sensitive tasks.

---

### 3. Regine — Research & Logistics Agent

**Runtime:** Cloud-based

**Primary Function:** Research, logistics, relationships, travel, lifestyle, contacts, and social coordination.

Regine supports the client’s external world: research, contacts, lifestyle coordination, travel/logistics, relationship context, and social media coordination.

#### Associated Personas / Purposes

##### Scooter — Travel + Logistics, Researcher

Purpose:

- travel planning,
- itinerary research,
- logistics,
- vendor/location research,
- option comparison,
- reservations and coordination preparation.

##### Regine — Relationships, Lifestyle Coordinator, Social Media Coordinator

Purpose:

- relationship and contact management,
- social coordination,
- lifestyle planning,
- social media coordination,
- reminders tied to people,
- networking briefs,
- social/personal logistics.

## Consolidation From Earlier Agent Model

Earlier FlavorOS planning included standalone Maxine, Kyle, and Scooter runtime agents. FlavorOS 1.5 does not keep them as operational MVP agents.

Their useful responsibilities are absorbed into the three-agent model:

| Earlier entity | FlavorOS 1.5 treatment |
|---|---|
| Maxine | Khadijah skill/persona lineage for projects, operations, and finance |
| Kyle | Regine skill/persona lineage for relationships, CRM, networking, brand, and social context |
| Scooter | Regine skill/persona lineage for travel, logistics, research, and vendor/destination intelligence |
| Overton | Sinclair/Butler local-private boundary persona/protocol for secrets, household, and preference-sensitive support |

### Khadijah Absorbs Maxine Capabilities

Khadijah owns:

- workflow orchestration,
- approval routing,
- briefings,
- project oversight,
- operations and finance oversight,
- project status summaries,
- finance review and reporting,
- cross-domain impact/ripple synthesis.

### Sinclair Owns The Private/Provider Boundary

Sinclair owns:

- Communication Sweep,
- inbox and calendar preparation,
- sensitive communications,
- meeting prep,
- preference protection,
- wellness/rhythm support,
- Butler/local-private boundary behavior.

### Regine Absorbs Kyle And Scooter Capabilities

Regine owns:

- research,
- travel/logistics,
- relationship context,
- CRM/networking context,
- public profile/brand/social context,
- vendor/destination intelligence,
- travel option artifacts.

## HITL Rule

All agents must route governed actions through approval.

HITL is required for:

- money,
- invoices/payments,
- calendar commitments,
- public-facing communications,
- sensitive relationships,
- travel bookings,
- irreversible external actions.

## Runtime Summary

| Agent | Runtime | Core Function |
|---|---|---|
| Khadijah | Cloud | Conductor/orchestration |
| Sinclair | Local | Communications, preferences, wellness, household-sensitive context |
| Regine | Cloud | Research, logistics, relationships, lifestyle |

## Persona Assignment Principle

A persona does not need to be a separately running agent.

Personas can be:

- prompt modes,
- behavior profiles,
- context lenses,
- UI modes,
- workflow-specific operating voices.

## Example Agent Config

```yaml
id: khadijah.conductor
runtime: cloud
type: primary_agent
personas:
  - khadijah.orchestration
  - maxine.project_management
  - maxine.finance_oversight
skills:
  - orchestration
  - project_management
  - finance_review
  - briefing_generation
  - approval_routing
```

```yaml
id: sinclair.communications
runtime: local
type: primary_agent
personas:
  - sinclair.executive_assistant
  - sinclair.preference_guardian
  - sinclair.wellness_guru
  - overton.secrets_butler
  - overton.household_management
skills:
  - communications
  - inbox_triage
  - calendar_awareness
  - preference_management
  - wellness_checkin
  - household_coordination
```

```yaml
id: regine.research_logistics
runtime: cloud
type: primary_agent
personas:
  - scooter.travel_logistics
  - scooter.researcher
  - regine.relationships
  - regine.lifestyle
  - regine.social_media
skills:
  - research
  - travel_planning
  - logistics
  - relationship_management
  - social_media_coordination
```
