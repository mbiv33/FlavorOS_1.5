# FlavorOS 1.5 Architecture Decisions

These decisions control migration review.

- Three-agent MVP: Khadijah, Sinclair, and Regine are the operational MVP agents.
- Visual-first, not voice-forward: the MVP should be a structured command-and-control interface.
- Next.js deployable WebApp: FlavorOS 1.5 centers on a deployable web application.
- Clean product monorepo demo: the new root should stay understandable as a product monorepo.
- Multi-tenant SaaS foundation: tenant isolation and role-aware access belong in the foundation.
- GBrain is the memory, persistent state, and SIGMA layer.
- SIGMA artifacts are internal agent-used artifacts.
- Client artifacts are user-facing outputs for review, approval, use, or delivery.
- Composio/provider access remains needed for external accounts and provider actions.
- Sinclair/Butler handles the local and private data boundary.
- Communication Sweep replaces narrow Gmail sync.
- Hostinger remains the VPS deployment target.
- HITL remains required for money, time commitments, public-facing communications, sensitive relationships, and other governed actions.
- Obsidian is not the permanent source of truth.
- The old 12-hour MVP is discarded.
- `FLAVOROS_CONTEXT.md` is not runtime canon.

## UI Control Decision

The MVP should feel like:

```text
Open the dashboard.
Pick the work mode.
Review what the system prepared.
Click what should happen next.
```

It should not feel like:

```text
Open the app and talk to agents.
```

## Additional Approved FlavorOS 1.5 Decisions

### UI Architecture

FlavorOS 1.5 is designed around Next.js as a deployable WebApp.

The MVP UI is visual-first, surface-led, button-led, workflow-led, artifact-led, and approval-led.

The MVP is not:

- voice-forward
- chat-forward
- live-call-forward
- persistent-right-rail-forward
- transcript-forward

The client does not primarily "talk to the OS." The client enters the Command Center, launches a configured Briefing or Meeting, reviews prepared information/artifacts, and selects commands that trigger agent workflows.

Canonical MVP flow:

```text
App Launch
-> Login / Sign Up
-> Client Onboarding
-> Command Center
-> Briefings / Meetings
-> Channel-Specific Screens
-> Commands / Approvals / Artifacts
-> Completion Summary
```

### MVP Information Architecture

1. App Launch
   - Login
   - Sign Up
   - Client Onboarding

2. Admin Mode
   - Test app
   - Configure agents
   - Add/update skills
   - Monitor functionality

3. Client Mode
   - Command Center Dashboard
   - Briefings
   - Meetings

4. Briefing Types
   - Morning Standup
   - COB Work Day
   - Goodnight

5. Meeting Types
   - Comms & Calendar
   - Travel
   - Projects
   - Reports & Artifacts

### Surface Mapping

Old UI surfaces should map as follows:

- Today becomes Command Center Dashboard.
- Work becomes Projects Meeting.
- Travel becomes Travel Meeting.
- Messages + Calendar become Comms & Calendar Meeting.
- Library becomes Reports & Artifacts Meeting.
- Preferences moves to Settings/Admin/Profile.
- Command Palette is future-state.
- Right Rail is future-state or replaced by command components.
- Call Surface becomes structured Briefing/Meeting surface.

### Old UI File Treatment

- `04-surfaces.md` should be rewritten/reframed as `04-app-surfaces.md`.
- `05-call-surface.md` should be rewritten/reframed as `05-structured-interaction-surface.md`.
- `06-right-rail.md` should be replaced or archived. Prefer replacing it with `06-command-components.md`.
- Original right rail, persistent chat, live transcript, voice orb, agent DM, and call-surface concepts should be archived as future-state unless explicitly promoted later.

### MVP Included UI

The MVP includes:

- Login / Sign Up
- Client Onboarding
- Command Center Dashboard
- Briefing launch
- Morning Standup
- COB Work Day
- Goodnight
- Meeting launcher
- Comms & Calendar Meeting
- Travel Meeting
- Projects Meeting
- Reports & Artifacts Meeting
- Artifact cards
- Approval cards
- External links
- Command buttons
- Completion summaries

### MVP Excluded UI

The MVP excludes:

- Persistent right rail chat
- Voice-first interaction
- Always-on listening
- Live agent call surface
- Live transcript
- Multi-agent conversational room
- Geolocation-aware travel mode
- Full inbox replacement
- Full calendar replacement
- User-created arbitrary projects
- Power-user command palette

### Component Priority

Prioritize reusable command components:

- Command Button
- Approval Card
- Artifact Card
- Dialog Step Block
- Link Card
- Meeting Launch Card
- Briefing Launch Card
- Completion Summary
- Status Chip

### Final UI Rule

The new UI should feel like:

```text
Open the dashboard. Pick the work mode. Review what the system prepared. Click what should happen next.
```

It should not feel like:

```text
Open the app and talk to agents.
```
