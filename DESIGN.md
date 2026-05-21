# FlavorOS Design System

**Status:** Canonical visual design source (consultation 2026-05-21). **Approved direction: SAFE** (stakeholder sign-off 2026-05-21).  
**Product UX canon** (IA, surfaces, wireframes) remains in [`docs/ui/`](docs/ui/). If this file conflicts with `docs/planning/current_build_plan.md`, the build plan wins.

## Product category

**Executive client operating system** — a calm command center where prepared agent work surfaces as approvals, briefings, and channel previews. Not a chat app, not an inbox clone, not a generic SaaS dashboard.

## Memorable thing

**The Operating Picture:** the top strip that always answers, in plain English, whether today is ready, what needs a decision, and whether the day is quiet. Clients remember FlavorOS when they open the app and know their status in under ten seconds without reading a feed.

## Aesthetic

**Calm command** — warm paper-like surfaces, stone neutrals, crisp type, generous whitespace. Authority without corporate coldness; activity without notification noise. Admin surfaces use the same language with denser diagnostics (monospace for IDs/timestamps only).

## Typography

| Role | Font | Weight | Size (desktop) | Notes |
|------|------|--------|----------------|-------|
| UI / body | [Geist Sans](https://vercel.com/font) | 400–500 | 14–15px (`text-sm` / `text-base`) | Already loaded in `apps/flavoros/src/app/layout.tsx` |
| Labels / meta | Geist Sans | 500 | 12px (`text-xs`) | Uppercase only for section eyebrows, sparingly |
| Mono / admin | Geist Mono | 400 | 12–13px | Admin diagnostics, sync timestamps, IDs — never in client hero copy |
**Rules:** No more than two families on client UI. Line height 1.5 for body, 1.2 for headings. Tabular figures for counts in approval queues.

## Color

### Core palette (approved)

Aligned with `apps/flavoros/src/app/globals.css`:

| Token | Hex | Usage |
|-------|-----|--------|
| `background` | `#f7f7f5` | Page canvas (warm off-white) |
| `foreground` | `#18181b` | Primary text |
| `surface` | `#ffffff` | Cards, panels |
| `surface-muted` | `#fafaf9` | Secondary panels, table zebra |
| `border` | `#e7e5e4` | Default borders |
| `border-strong` | `#d6d3d1` | Dividers, focus rings |
| `muted` | `#78716c` | Secondary text |
| `muted-strong` | `#57534e` | Tertiary / placeholders |
| `accent` | `#1c1917` | Primary buttons, active nav (near-black) |
| `accent-foreground` | `#fafaf9` | Text on accent buttons |

### Semantic status (do not repurpose as brand color)

| Token | Hex | Meaning |
|-------|-----|---------|
| `status-attention` | `#b45309` | Needs attention, amber |
| `status-blocked` | `#b91c1c` | Blocked / error |
| `status-ok` | `#047857` | Completed / connected |
| `status-pending` | `#6d28d9` | Queued / in progress |
| `status-info` | `#1d4ed8` | Informational link |

Use status colors only on badges, dots, and border-left accents — never as full-page backgrounds.

### Declined alternative (RISK — do not implement)

Explored during consultation; not approved. Kept for reference in `docs/design-preview/preview-risk.html` only: copper accent `#9a3412`, optional Source Serif 4 on Today headline.

## Layout & spacing

- **Grid:** 4px base; Tailwind spacing scale
- **App shell:** Fixed left nav ~240px; main content max-width ~1200px centered in remaining width
- **Command Center zones:** Follow [`docs/ui/11-command-center-wireframe.md`](docs/ui/11-command-center-wireframe.md); empty zones **hide** (no “0 items” noise)
- **Card padding:** `p-4` compact (Needs Attention), `p-5` default, `p-6` hero (Today)
- **Section gap:** `gap-6` between zones; `gap-3` within card lists
- **Radius:** `rounded-lg` (8px) cards; `rounded-md` (6px) buttons and inputs; `rounded-full` avatars only

## Motion

- **Duration:** 150ms UI feedback; 200ms panel expand
- **Easing:** `ease-out` for enter, `ease-in` for exit
- **Avoid:** bounce, parallax, auto-playing motion, pulsing badges
- **Reduced motion:** respect `prefers-reduced-motion` — disable transitions on collapses

## Components (visual rules)

Canonical behavior lives in `docs/ui/`; visual rules here:

| Component | Visual |
|-----------|--------|
| **Approval Card** | White surface, `border-strong`, left accent bar by status; primary action right-aligned; density variants compact/default |
| **Update row** | No icon salad; one line title + muted timestamp; no unread counters |
| **Briefing / Meeting launcher** | Tile or row with clear verb (“Start Morning Standup”); disabled state muted, not hidden |
| **Left nav** | Muted labels; active item `bg-surface-muted` + `foreground` weight 500; no bright pill |
| **Provider status** | Small dot + plain English; tier-3 providers show “coming soon” not broken UI |

**Never on client UI:** chat dock, voice orb, agent task logs, PAC/PTQ/SIGMA vocabulary, notification bell with numeric badge.

## Iconography

- Prefer Lucide-style stroke icons at 16–20px, `stroke-width` 1.5
- Status dots supersede icons where possible
- No emoji in production UI

## Dark mode

**Post-MVP.** Light mode is canonical for MVP and demo. When added, invert surfaces to `#18181b` canvas / `#27272a` cards; keep semantic status hues; do not invert photography.

## Competitive positioning

| Product | FlavorOS difference |
|---------|---------------------|
| Superhuman / email clients | Not inbox-first; approvals and briefings are workflows |
| Linear | Not issue tracking; channel surfaces + agent-prepared work |
| Generic AI chat | No persistent chat; Meetings are intentional sessions |
| Sagan / task boards | Not Kanban-first; Command Center zones and one Approval pattern |

## Implementation map

| Concern | Location |
|---------|----------|
| CSS variables | `apps/flavoros/src/app/globals.css` |
| Fonts | `apps/flavoros/src/app/layout.tsx` |
| Shell / nav | `apps/flavoros/src/components/LeftNav.tsx` |
| UX wireframes | `docs/ui/11-command-center-wireframe.md` |
| Token previews | `docs/design-preview/preview-safe.html`, `preview-risk.html` |

## Design consultation artifacts

- **gstack project slug:** `mbiv33-FlavorOS_1.5`
- **AI mockups:** Require `design setup` + `OPENAI_API_KEY` — not generated in initial consultation run
- **HTML preview (canonical):** `docs/design-preview/preview-safe.html`

## Changelog

| Date | Change |
|------|--------|
| 2026-05-21 | Stakeholder approved **SAFE**; RISK archived as declined alternative |
| 2026-05-21 | Initial design system from `/design-consultation` (SAFE default, RISK documented) |
