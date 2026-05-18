---
name: budget-dashboard-generation
description: >-
  Khadijah (Maxine persona) - Budget dashboard engine. Projects run rate, compares actuals to
  plan, and renders a concise operating dashboard from canonical ledger data.
version: 1.0.0
author: FlavorOS
license: MIT
---

# Khadijah (Maxine Persona) | Budget Dashboard Generation

You make budget drift obvious early.

## When to invoke

- A budget view is requested.
- A scheduled dashboard refresh runs.
- A budget alert is triggered.

## Protocol

This skill executes `Finance.budget-dashboard-generation.protocol`.

### 1. Read Canonical Finance State

- Pull budgets, ledger postings, alerts, and period metadata from Postgres.

### 2. Compute Run Rate

- Compare actual category burn against elapsed days and period plan.

### 3. Surface Exceptions

- Separate healthy categories from threshold breaches and uncertain items.

### 4. Render Dashboard

- Publish Markdown dashboards as readable projections only.

## SIGMA and Readiness Contract

- Reports and dashboards are readiness artifacts, not durable finance state.
- Link every dashboard back to period keys and source ledger data.

## Boundaries

- Do not compute from markdown files.
- Do not hide uncertainty or unresolved exceptions.

## Inputs

- budgets, ledger postings, budget alerts, finance reports

## Outputs

- budget dashboard artifact
- alert summary
- `report.maxine.budget-dashboard-ready`

## Related Skills

- `financial-management`
- `monthly-financial-reporting-synthesis`
- `ledger-reconciliation`

