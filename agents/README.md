# Agents2

`agents2/` is a framework-aligned reorganization of the current `agents/` content using the attached FlavorOS model:

- three primary agents,
- personas as modes inside those agents,
- the Client Universe as shared context,
- GBrain as memory and retrieval infrastructure.

## Primary Agents

### Khadijah

- runtime: `cloud`
- role: conductor and orchestration
- absorbs source material from `agents/khadijah/` and `agents/maxine/`

### Sinclair

- runtime: `local`
- role: communications, preferences, wellness, and household-sensitive support
- absorbs source material from `agents/sinclair/`

### Regine

- runtime: `cloud`
- role: research, logistics, relationships, lifestyle, and social coordination
- absorbs source material from `agents/kyle/` and `agents/scooter/`

## Source Mapping

| `agents/` source | `agents2/` target | Why |
| --- | --- | --- |
| `khadijah` | `khadijah` | already matches conductor role |
| `maxine` | `khadijah` | framework places PM/finance support under conductor-facing orchestration |
| `sinclair` | `sinclair` | already matches local communications/wellness role |
| `kyle` | `regine` | current source content is relationships/brand-social, which fits Regine in the framework |
| `scooter` | `regine` | travel, logistics, and research fit Regine in the framework |

## Important Note

The attached framework describes a finance persona named `kyle.finances` under Khadijah. The current source repo does not contain finance-oriented `kyle` content; finance workflows live under `agents/maxine/`.

This reorganization stays faithful to the actual source material by:

- keeping relationship and social work with `regine`,
- keeping finance and project execution work with `maxine` material under `khadijah`.

## Shared System Assumptions

- agents query the Client Universe; they do not own client memory
- GBrain remains a subsystem, not an agent
- external side effects still require approval for money, commitments, and sensitive outbound actions
