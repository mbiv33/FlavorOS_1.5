# 05 · Structured Interaction Surface

This document defines the FlavorOS 1.5 MVP structured interaction model. It intentionally removes live-call-first, voice-first, transcript-first, and right-rail-takeover assumptions from MVP canon.

## Definition

A Structured Interaction Surface is the screen used after a client launches a configured Briefing or Meeting.

It presents:

- prepared context
- ordered dialog steps
- artifact cards
- approval cards
- command buttons
- external links
- completion summary

It does not require:

- voice
- live call state
- transcript
- agent avatars speaking in real time
- persistent chat

## Supported MVP Interaction Types

### Briefing Flow

Used by:

- Morning Standup
- COB Work Day
- Goodnight

Typical structure:

```text
Header
-> Prepared Context
-> Dialog Step 1
-> Commands / Approval / Artifact
-> Dialog Step 2
-> Commands / Approval / Artifact
-> Final Review
-> Completion Summary
```

### Meeting Flow

Used by:

- Comms & Calendar
- Travel
- Projects
- Reports & Artifacts

Typical structure:

```text
Meeting Header
-> Channel Status
-> Prepared Artifacts
-> Open Decisions
-> Commands / Links
-> Completion Summary
```

## Anatomy

```text
Structured Interaction Surface

[Title + Status Chip]
[Prepared summary]

[Step list / progress]
  [Dialog Step Block]
  [Artifact Card]
  [Approval Card]
  [Command Button row]
  [Link Cards]

[Completion Summary]
```

## Dialog Step Block

A Dialog Step Block is a pre-programmed prompt/question inside a configured flow.

It should contain:

- step title
- short prepared context
- specific client decision needed, if any
- command choices
- optional artifact/approval linkage
- defer/skip where appropriate

It should not contain:

- open-ended chat composer
- live transcript
- agent thinking
- backend routing metadata

## Agenda Handling

The old call agenda becomes a visible step list or progress rail.

Allowed states:

- pending
- active
- completed
- deferred
- skipped
- needs revision

The client can use buttons to:

- continue
- approve
- defer
- revise
- skip
- open artifact
- open provider/source link
- finish

## Silent Mode Is The Default

The MVP interaction should work through reading and clicking.

Voice may be added later as an alternate input layer, but MVP copy and layout must not assume the client is speaking.

## Completion Summary

Every structured Briefing or Meeting should end with a completion summary.

The summary should list:

- decisions made
- approvals granted
- items deferred
- artifacts opened or created
- workflows triggered
- provider actions queued
- next expected prepared work

The summary becomes a client-facing artifact where appropriate.

## Backend Dependencies

The Structured Interaction Surface requires:

- briefing definitions
- meeting definitions
- dialog step definitions
- workflow run state
- approval requests
- artifacts
- command/action definitions
- provider/source links
- completion events

## What Moved To Future-State

The following old call-surface concepts are not MVP:

- live voice call surface
- speaker orb
- live transcript
- always-on call state
- agent speaking indicator
- microphone controls
- realtime call pause/resume
- transcript search

These are preserved only as future-state concepts in `10-future-voice-and-chat-layer.md`.
