# Budget Dashboard Generation Protocol

## Header

- Owner agent: Maxine
- Supporting agent: Khadijah for distribution or budget decisions
- Related skill: `budget-dashboard-generation`

## Purpose

Render a readable budget operating view from canonical ledger and budget tables.

## Trigger

- Scheduled dashboard refresh
- Manual budget view request
- Alert threshold breach

## Inputs

- budget periods, budget lines, ledger postings, budget alerts, prior dashboard artifacts

## Phase Contract

1. Canonical Read: query budget and ledger state from Postgres.
2. Run-Rate Calculation: compute elapsed-period burn and projected variance.
3. Exception Segmentation: separate confirmed values from pending or uncertain items.
4. Dashboard Render: write markdown dashboard as a projection.

## Artifacts

- budget dashboard
- alert summary note

## Approval Gates

- Required before external distribution or commitment changes based on the dashboard.

## Failure Modes

- Missing budget lines: mark dashboard incomplete.
- Unlocked reconciliation issues: show uncertainty banner in artifact.

## Completion Signal

- Publish `report.maxine.budget-dashboard-ready`.

