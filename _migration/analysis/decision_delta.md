# Decision Delta

This note records decisions added after the original migration intake prompt and explains how they should change the next normalization pass.

## What Was Added

The migration decisions now include a fuller UI architecture doctrine:

- FlavorOS 1.5 remains a Next.js deployable WebApp.
- MVP UI is visual-first, surface-led, button-led, workflow-led, artifact-led, and approval-led.
- MVP UI is not voice-forward, chat-forward, live-call-forward, persistent-right-rail-forward, or transcript-forward.
- The client enters the Command Center, launches a configured Briefing or Meeting, reviews prepared information/artifacts, and selects commands that trigger workflows.
- Canonical flow now runs from App Launch through auth/onboarding, Command Center, Briefings/Meetings, channel screens, commands/approvals/artifacts, and Completion Summary.
- MVP IA now distinguishes App Launch, Admin Mode, Client Mode, Briefing Types, and Meeting Types.
- Old surface names now have explicit mappings to MVP surfaces.
- Old UI docs now have explicit treatment instructions.
- MVP included/excluded UI lists are now controlling.
- Reusable command components are now the highest-priority UI building blocks.

## Effect On Old UI File Treatment

The old UI intake should no longer be normalized as a three-pane conversational shell.

Instead:

- `04-surfaces.md` should become the source for a rewritten `04-app-surfaces.md` candidate centered on Command Center, Briefings, Meetings, channel-specific screens, commands, approvals, artifacts, and summaries.
- `05-call-surface.md` should become the source for a rewritten `05-structured-interaction-surface.md` candidate. Preserve agenda/dialog-step concepts, but remove voice-first, live-call, orb, and transcript assumptions from MVP canon.
- `06-right-rail.md` should be archived or replaced by a new `06-command-components.md` candidate. Preserve only reusable ideas that support commands, approvals, artifacts, status, and links.
- Old command palette concepts should be marked future-state/power-user, not MVP.
- Old Messages and Calendar material should be combined into Comms & Calendar Meeting, not full inbox/calendar replacements.
- Old Travel material should be narrowed to Travel Meeting and pre-trip/logistics review. Geolocation-aware travel mode is future-state.
- Old Work material should become Projects Meeting, without user-created arbitrary projects.
- Old Library material should become Reports & Artifacts Meeting.
- Old Preferences material should move to Settings/Admin/Profile and should not be a core MVP surface.

## Copied Intake Files Most Affected

Most affected UI doctrine files:

- `_migration/intake/old_ui/docs/prd/ui/01-interaction-taxonomy.md`
- `_migration/intake/old_ui/docs/prd/ui/02-information-architecture.md`
- `_migration/intake/old_ui/docs/prd/ui/04-surfaces.md`
- `_migration/intake/old_ui/docs/prd/ui/05-call-surface.md`
- `_migration/intake/old_ui/docs/prd/ui/06-right-rail.md`
- `_migration/intake/old_ui/docs/prd/ui/08-decisions-and-rationale.md`

Most affected old app source:

- `_migration/intake/old_ui/app_web/components/shell/ShellContent.tsx`
- `_migration/intake/old_ui/app_web/components/shell/RightRail.tsx`
- `_migration/intake/old_ui/app_web/components/rail/Composer.tsx`
- `_migration/intake/old_ui/app_web/components/rail/Threads.tsx`
- `_migration/intake/old_ui/app_web/components/rail/VoiceOrb.tsx`
- `_migration/intake/old_ui/app_web/components/call/CallSurface.tsx`
- `_migration/intake/old_ui/app_web/components/call/Transcript.tsx`
- `_migration/intake/old_ui/app_web/components/call/SpeakerOrb.tsx`
- `_migration/intake/old_ui/app_web/components/palette/CommandPalette.tsx`
- `_migration/intake/old_ui/app_web/lib/state/call.ts`
- `_migration/intake/old_ui/app_web/lib/state/threads.ts`
- `_migration/intake/old_ui/app_web/lib/state/voice.ts`
- `_migration/intake/old_ui/app_web/lib/voice/phrases.ts`

Old source that remains useful but needs reframing:

- `_migration/intake/old_ui/docs/prd/ui/00-principles-and-vocabulary.md`
- `_migration/intake/old_ui/docs/prd/ui/03-approval-card.md`
- `_migration/intake/old_ui/docs/prd/ui/07-protocols-affecting-ui.md`
- `_migration/intake/old_ui/app_web/components/approval/`
- `_migration/intake/old_ui/app_web/components/library/`
- `_migration/intake/old_ui/app_web/components/messages/`
- `_migration/intake/old_ui/app_web/components/today/`
- `_migration/intake/old_ui/app_web/components/work/`
- `_migration/intake/old_ui/app_web/components/primitives/`

## What The Next Normalization Prompt Should Do Differently

The next normalization prompt should explicitly require the UI prepared candidates to:

1. Use `_migration/decisions.md` and this delta as controlling doctrine.
2. Produce new prepared UI docs around command-and-control screens, not voice/chat/call surfaces.
3. Treat old voice, transcript, right rail, persistent chat, command palette, and call-surface files as future-state/archive unless extracting non-conversational concepts.
4. Prioritize prepared component specs for Command Button, Approval Card, Artifact Card, Dialog Step Block, Link Card, Meeting Launch Card, Briefing Launch Card, Completion Summary, and Status Chip.
5. Map old surfaces into the approved MVP IA:
   - Today -> Command Center Dashboard
   - Work -> Projects Meeting
   - Travel -> Travel Meeting
   - Messages + Calendar -> Comms & Calendar Meeting
   - Library -> Reports & Artifacts Meeting
   - Preferences -> Settings/Admin/Profile
6. Avoid producing any prepared candidate that assumes a persistent right rail, live transcript, voice orb, always-on listening, direct agent DM room, full inbox replacement, full calendar replacement, geolocation-aware travel mode, arbitrary user-created projects, or MVP command palette.
7. Keep all prepared outputs inside `_migration/prepared/` until explicitly approved.
