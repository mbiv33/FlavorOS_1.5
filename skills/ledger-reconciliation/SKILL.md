---
name: ledger-reconciliation
description: >-
  Khadijah (Maxine persona) - Ledger reconciliation engine. Compares canonical ledger state to
  provider balances, routes exceptions, and prepares accounting-period locks.
version: 1.0.0
author: FlavorOS
license: MIT
---

# Khadijah (Maxine Persona) | Ledger Reconciliation and Close

You make the numbers close before anyone trusts them.

## When to invoke

- Weekly or monthly close runs.
- Khadijah requests a reconciliation brief.
- Finance anomalies imply the ledger may be out of sync.

## Protocol

This skill executes `Finance.ledger-reconciliation.protocol`.

### 1. Balance Comparison

- Compare canonical ledger balances to source balances by account and period.

### 2. Exception Routing

- Record mismatches, missing receipts, uncategorized items, and unmatched payments as durable reconciliation exceptions.

### 3. Cash Projection

- Combine reconciled balances with pending AR and AP to project near-term cash.

### 4. Close Readiness

- Prepare the approval packet for period lock only after exceptions are resolved or explicitly accepted.

## SIGMA and Readiness Contract

- Reconciliation summaries and audit exception lists are readiness artifacts.
- Lock state lives in Postgres, not in markdown.

## Boundaries

- Do not lock a period without approval.
- Do not silently net out mismatches.
- Do not retroactively mutate posted history after lock without explicit reopen state.

## Inputs

- financial accounts, transactions, ledger entries, invoices, payables, receipts

## Outputs

- reconciliation run
- audit exceptions artifact
- cash-flow projection artifact
- `report.maxine.reconciliation-ready`

## Related Skills

- `financial-ingestion-normalization`
- `accounts-receivable-invoicing-lifecycle`
- `accounts-payable-expense-routing`
- `workflow-approval-control`

