# Accounts Payable and Expense Routing Protocol

## Header

- Owner agent: Maxine
- Supporting agent: Khadijah
- Related skill: `accounts-payable-expense-routing`
- Planning source: `planning/10-accounts-payable-expense-routing/`

## Purpose

Capture outgoing financial obligations and route payment or reimbursement actions through approval.

## Trigger

- Bill, receipt, vendor invoice, subscription notice, or reimbursement request arrives

## Inputs

- Vendor, amount, due date, category, source file, payment method, project link, and ledger context

## Phase Contract

1. Bill Ingestion or Capture: normalize source material.
2. Ledger Entry: draft categorized ledger entry.
3. Prepare Reimbursement or Payment: create payable packet.
4. Khadijah Approval Brief: request decision.
5. Execution via Payment API: execute and record only after approval.

## Artifacts

- `project-state` SIGMA update for project-tied commitment, vendor, budget, or reconciliation changes
- payable packet
- ledger entry draft
- payment execution record

## SIGMA and Readiness Contract

- SIGMAs hold validated project-tied payable state and durable finance implications.
- Payable packets, ledger drafts, approval briefs, and execution records are readiness artifacts.
- Every payment artifact must link to the source bill, receipt, ledger item, and related SIGMAs.
- Standalone finance SIGMA types require catalog/template/folder work before use.

## Approval Gates

- Required for all payments, reimbursements, subscriptions, and commitment changes.

## Handoffs

- Khadijah receives payable approval packets.
- Monthly reporting consumes ledger state.

## Failure Modes

- Duplicate bill suspected: hold and flag.
- Missing receipt: create exception item.
- Payment connector failure: preserve approval and mark execution pending.

## Completion Signal

- Publish `report.maxine.payable-ready` or `report.maxine.payment-executed`.
