# 08 · Decisions & Rationale

This is the UI decision log. If this file conflicts with the current build plan, `docs/planning/current_build_plan.md` wins and this file should be updated.

## Canonical Decisions

### D-01 · Visualization And Surfaces Come First

**Decision:** The UI is the first build priority.

**Rationale:** FlavorOS must be legible as software before deeper automation matters. The user and operator need to see state, prepared work, approvals, provider posture, and workflow progress.

### D-02 · Command Center Is The Default Landing Surface

**Decision:** The app opens to Command Center, not chat, not an inbox, not a calendar clone.

**Rationale:** The product is a client command center. It should show ready work, approvals, briefings, meetings, artifacts, and quiet status without becoming noisy.

### D-03 · Briefings Are Workflow Surfaces

**Decision:** Morning Standup, COB Work Day, and Goodnight are Briefing workflows backed by durable state, not just UI launch cards.

**Rationale:** Briefings are where prepared state, approvals, artifacts, context, and completion summaries come together. The UI must display the data correctly.

### D-04 · Meetings Are Work Lanes

**Decision:** Comms & Calendar, Travel / Logistics, Projects, and Reports & Artifacts are focused Meeting surfaces.

**Rationale:** The client should enter a prepared workspace for a lane of work, review what the system has staged, and act through commands, artifacts, and approvals.

### D-05 · Comms & Calendar Is The First Proof Lane

**Decision:** Comms & Calendar is the first lane to prove provider ingestion, normalization, artifact creation, approvals, and outbound write-back.

**Rationale:** The MVP should prove the operating loop with high-frequency communication and scheduling work before expanding execution breadth.

### D-06 · Travel / Logistics Is Retained But Not First Proof Loop

**Decision:** Travel / Logistics remains an MVP surface and future-capable workflow lane, but it is not the first proof loop unless explicitly promoted for demo needs.

**Rationale:** Travel is valuable and visually useful, but the build should not delay the core communication/storage/provider loop for full travel automation.

### D-07 · Finance Is Retained But Execution Is Post-MVP

**Decision:** Finance remains canonical as model, boundary, schema, skill, and approval posture. Connector-backed finance execution and simulations are post-MVP unless promoted.

**Rationale:** Finance has high stakes. The repo should retain the design without pretending live finance execution is part of the first build slice.

### D-08 · Three-Agent Model Is MVP Canon

**Decision:** Khadijah, Sinclair, and Regine are the MVP agent model.

**Rationale:** The UI may show prepared work and persona signatures, but it should not expose agent internals or revive retired five-agent ownership as client-facing structure.

### D-09 · Provider Tiers Are Explicit

**Decision:** Google Workspace is tier 1. Project management, contacts, files, and selected social DMs are tier 2. Finance and Twilio are tier 3/future unless promoted.

**Rationale:** Provider scope needs a clear implementation order to avoid connector sprawl.

### D-10 · One Canonical Decision Component

**Decision:** Approval Card is the single user-facing decision component for governed actions and prepared artifacts.

**Rationale:** The client learns one decision pattern. This avoids a mess of question cards, suggestion cards, and protocol-specific cards.

### D-11 · Question And Suggestion Cards Are Not MVP Components

**Decision:** Ambiguous work decisions belong in Briefing/Meeting agendas or Approval Cards, not standalone question/suggestion cards.

**Rationale:** The default posture is not to ask unless necessary. Work should find the client in the right workflow context.

### D-12 · Client UI Never Shows Internal Vocabulary

**Decision:** PAC/PTQ, SIGMA, raw routing, skill names, backend protocol names, provider traces, and agent task logs do not appear in client UI.

**Rationale:** The client sees tasks, artifacts, decisions, status, and plain-English reasoning. Admin surfaces may show diagnostics separately.

### D-13 · Contexts Are Configurable

**Decision:** Context labels come from onboarding/client profile state. UI never hardcodes W2 Work, LLC Work, Career, Personal, or any other labels.

**Rationale:** Contexts are metadata and routing hints inside the Client Universe. The UI should adapt to one context or many.

### D-14 · Outbound Write-Back Is Visible And Approval-Gated

**Decision:** Approved outbound actions should show queued/executed state and source context.

**Rationale:** The MVP proof loop includes channel-correct write-back, but every governed external side effect requires explicit approval and auditability.

### D-15 · Silence Is A Valid State

**Decision:** Empty zones should disappear rather than showing filler.

**Rationale:** Calm means the system is working. No-content states should not create fake work.

### D-16 · No Persistent Right Rail In MVP

**Decision:** Persistent chat/right rail, live call surface, voice orb, and global composer are future-state layers, not MVP requirements.

**Rationale:** The MVP must work through visual surfaces and command components. Voice/chat may wrap the command system later.

### D-17 · Command Palette Is Future/Power Layer

**Decision:** Command palette is not required for MVP workflow discovery or operation.

**Rationale:** Work should be visible through surfaces. Search/command acceleration can come later.

### D-18 · Repo UI Docs Follow Build Plan

**Decision:** UI docs follow the canon order in `docs/planning/current_build_plan.md`.

**Rationale:** UI must support the current development direction rather than preserving retired app metaphors as competing canon.

## Open Decisions

Open items live in `09-open-questions.md`.
