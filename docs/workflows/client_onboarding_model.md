# Client Onboarding Model

## Purpose

Client onboarding creates a usable, governed Client Universe for one tenant.

The MVP onboarding flow should support the visual-first WebApp:

```text
App Launch
-> Login / Sign Up
-> Client Onboarding
-> Command Center
```

Onboarding is complete only when FlavorOS has enough client identity, context, provider, and approval information to safely prepare briefings, meetings, artifacts, and commands.

## Onboarding Goals

Onboarding should establish:

- `client_id`,
- user/admin role separation,
- profile basics,
- client contexts,
- provider account expectations,
- account aliases,
- consent status,
- authority defaults,
- first workflow lanes,
- provider sync readiness.

## Role Separation

A person can be both a client and an operator/admin during development, but the roles remain separate.

Rules:

- client permissions are not admin powers,
- admin powers are not client preferences,
- first real client onboarding must not inherit development credentials,
- provider grants must be explicit and client-scoped.

## MVP Sequence

1. Create or confirm the client identity.
2. Create the client profile and envelope records.
3. Define initial contexts.
4. Define expected providers and account aliases.
5. Capture authority and HITL defaults.
6. Start provider connection flows through Composio or approved provider adapters.
7. Record provider account metadata.
8. Verify first sync or mark blocked.
9. Activate initial briefing and meeting workflows.
10. Enter Command Center.

## Required Completion Criteria

Successful onboarding means:

- client profile exists,
- at least one context exists,
- authority defaults are set,
- account/provider expectations are recorded,
- consent has been captured where needed,
- provider connection metadata exists where OAuth is used,
- secrets are stored outside the repo,
- initial workflow lanes are known,
- Command Center can render a safe initial state.

## Authority Defaults

Minimum default policy:

- outbound communications are draft-only,
- calendar commitments require approval,
- travel booking requires approval,
- money movement is blocked without explicit approval,
- sensitive relationship actions require approval,
- irreversible provider actions require approval.

These defaults should be visible to the client and enforced by workflow/runtime services.

## Provider Readiness

Provider connection readiness should be represented separately from the profile.

Useful states:

- `not_started`,
- `pending_consent`,
- `connected`,
- `syncing`,
- `ready`,
- `degraded`,
- `blocked`,
- `revoked`.

## MVP UI Implications

The onboarding UI should be structured and guided.

It should collect:

- profile basics,
- context setup,
- provider setup,
- approval defaults,
- first Command Center preferences.

It should not require a voice call, persistent chat, live transcript, or right rail.

