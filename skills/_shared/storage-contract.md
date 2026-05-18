# FlavorOS 1.5 Storage Contract

Skills operate inside the current build plan's durable state model:

- Scope every meaningful object to `client_id`.
- Treat Client Universe records, workflow runs, artifacts, approvals, outbound actions, and audit events as durable operating truth.
- Treat provider payloads, vault files, and workspace files as source material or implementation mirrors, not canonical truth.
- Use Composio or provider adapters for access only; do not make provider systems the memory layer.
- Use GBrain for memory and context retrieval; agents and skills do not own memory.
- Generate Client Artifacts or SIGMA Artifacts for work product, then link them to source identifiers and approval records.
- Stage external side effects as approval-gated outbound actions. Do not write back directly from a skill.
