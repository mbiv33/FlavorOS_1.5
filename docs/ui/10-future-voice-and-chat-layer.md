# 10 · Future Voice And Chat Layer

This document preserves voice, chat, right-rail, and call-surface concepts as future-state architecture. It is explicitly not MVP canon.

The visual MVP must work without this layer. Future voice and chat should wrap the same workflow, artifact, approval, provider, and Client Universe data used by the visual surfaces.

## Future-State Only

The following are excluded from MVP:

- persistent right rail chat
- voice-first interaction
- always-on listening
- live agent call surface
- live transcript
- multi-agent conversational room
- direct agent DM interface
- voice orb
- speaker indicator
- power-user command palette

## Potential Future Layers

### Voice Input Layer

Could later allow commands to be spoken instead of clicked.

Must remain secondary to the visual command system.

Possible future capabilities:

- push-to-talk command execution
- spoken approve/defer/revise commands
- spoken search over artifacts
- spoken briefing step responses

### Chat Support Layer

Could later allow client questions or follow-up requests.

Must not become the default way to operate the MVP.

Possible future capabilities:

- contextual help within a Meeting
- follow-up request capture
- limited agent message thread
- admin/debug chat surfaces

### Live Call Layer

Could later support realtime voice-led Briefings.

Must be treated as an alternate interaction mode over the same briefing/meeting workflow data.

Possible future capabilities:

- realtime transcript
- audio/video controls
- speaker state
- pause/resume
- post-call artifact generation

### Command Palette Layer

Could later serve power users.

Must not be required to discover or operate core workflows.

Possible future capabilities:

- navigate surfaces
- search artifacts
- launch briefings/meetings
- open provider links
- execute safe commands

## Promotion Criteria

No future voice/chat layer should be promoted until:

- visual MVP flow works without it
- command components are stable
- HITL boundaries are enforced
- provider actions have audit trails
- tenant isolation is implemented
- accessibility and privacy posture are reviewed
- always-on listening is explicitly approved, if ever considered

## Rule For Future Work

Voice and chat should wrap the command system. They should not replace it.
