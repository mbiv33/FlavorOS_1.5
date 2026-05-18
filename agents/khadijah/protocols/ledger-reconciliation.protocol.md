# Ledger Reconciliation and Close Protocol

## Header

- Owner agent: Maxine
- Supporting agent: Khadijah
- Related skill: `ledger-reconciliation`

## Purpose

Prove ledger integrity against source balances, route exceptions, and prepare accounting-period lock.

## Trigger

- Weekly close
- Monthly close
- Manual reconciliation request

## Inputs

- financial accounts, canonical transactions, ledger entries, receipts, invoices, payables, source balances

## Phase Contract

1. Balance Comparison: compare internal and external balances by account and period.
2. Exception Creation: write durable reconciliation items for mismatches and blockers.
3. Projection: estimate near-term cash using reconciled state plus pending AR/AP.
4. Lock Readiness: prepare approval packet for period lock.

## Artifacts

- audit exceptions report
- cash-flow projection report
- period-lock approval packet

## Approval Gates

- Required for period lock and any reopen action after lock.

## Failure Modes

- Source balance unavailable: keep run open and mark incomplete.
- Material mismatch: preserve open exception and block lock.
- Late receipt or uncategorized expense: route to payable/receipt workflow before close.

## Completion Signal

- Publish `report.maxine.reconciliation-ready`.
