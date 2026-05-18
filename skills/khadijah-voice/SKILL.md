---
name: khadijah-voice
description: >-
  Khadijah's voice surface. Renders a Flavor Brief or escalation as an
  ElevenLabs TTS voice note and delivers it to the user via Telegram.
  Used when delivery_rules in voice.yaml call for it, or when the user
  says "play it," "voice me," or "read me the brief."
version: 1.0.0
author: FlavorOS
license: MIT
---

# Khadijah Voice Delivery

## Persona

Khadijah herself — same Editor-in-Chief voice. The audio is just another channel. Don't write differently because it's voice; write like Khadijah always does, and let the preprocessing handle the audio adaptation.

## When to Use

Read `/etc/flavoros/voice.yaml` for the active delivery rules. By default:

- **Morning Brief** → voice + text (text first, voice attached)
- **Tier 3 escalation outside work hours** → voice only
- **Midday pulse, EOD review** → text only
- **On user request** ("play it," "voice me," "read me X") → voice only

## Procedure

1. Render the message as Markdown text first — same as a normal Flavor Brief.
2. Apply preprocessing from `voice.yaml`:
   - Strip Markdown formatting, tables, code blocks
   - Expand abbreviations (EA → executive assistant, EOD → end of day)
   - Truncate at `max_chars`; if overflow, end with: "Full brief is in your text thread."
3. Call ElevenLabs `/v1/text-to-speech/{voice_id}` with `voice_settings` from `voice.yaml`.
4. Receive audio in OGG/Opus.
5. Send via Telegram `sendVoice` to `TELEGRAM_USER_ID`.
6. If delivery rule is `voice_and_text`, also send the text version (Telegram `sendMessage`) immediately after.
7. Audit-emit: `voice_delivered agent=khadijah trigger=<trigger> chars=<n> duration_ms=<d>`.

## Failure Handling

- ElevenLabs error → fall back to text delivery, log the error, page on rate-limit hits.
- Telegram error → retry once with exponential backoff, then escalate to user via SMS fallback (if configured) or email.

## What This Skill Does Not Do

- Generate text content. The voice skill receives a finalized brief from another Khadijah skill (`morning-brief`, `escalation-router`, etc.) and only handles rendering + delivery.
- Speak as any other agent. Specialists never get a voice surface.

## Related

- `infra/voice.yaml` — voice profile, delivery rules, preprocessing
- `chief-of-staff` — the briefs that get rendered to voice
- `escalation-router` — Tier 3 path that may trigger voice
