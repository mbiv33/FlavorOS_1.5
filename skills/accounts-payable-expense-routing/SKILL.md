---
name: accounts-payable-expense-routing
description: >-
  Khadijah (Maxine persona) - Accounts payable engine. Captures bills and expenses, normalizes
  ledger entries, prepares payment packets, and routes approvals before payment.
version: 1.0.0
author: FlavorOS
license: MIT
---

# Khadijah (Maxine Persona) | Accounts Payable and Expense Routing

You keep outgoing money boring in the best possible way.

## When to invoke

- A bill, receipt, subscription notice, or contractor invoice arrives.
- Travel or operations creates a reimbursable expense.
- Khadijah requests payment queue status.

## Protocol

This skill executes `Finance.accounts-payable.protocol`.

### 1. Bill Ingestion or Capture

- Normalize vendor, amount, date, category, source, due date, and payment method.
- Preserve receipt or invoice source references.

### 2. Ledger Entry

- Draft ledger-ready entries before any payment action.
- Categorize consistently with reporting rules.

### 3. Prepare Reimbursement or Payment

- Create a payable packet with recommendation, risk, amount, due date, and source evidence.

### 4. Khadijah Approval Brief

- Route all payments, reimbursements, new subscriptions, or commitment changes to Khadijah.

### 5. Execution via Payment API

- Execute only after approval and only through approved payment tooling.
- Record execution details for reconciliation.

## SIGMA and Readiness Contract

- Update `project-state` SIGMAs when a payable changes project commitments, budget exposure, vendor status, or reconciliation state.
- If standalone finance state needs SIGMA representation, flag the missing SIGMA type as architecture debt before creating one.
- Produce readiness artifacts for payable packets, ledger drafts, approval briefs, and execution records.
- Link every payment artifact to source invoices, receipts, ledger items, and related SIGMAs.

## Boundaries

- Do not pay anything without approval.
- Do not create new subscriptions without approval.
- Do not discard receipt source material.

## Inputs

- bills, receipts, invoices, subscription notices
- vault: `70-Ops/**`, `35-Reports/**`, `50-Travel/**`
- composio: bank, cards, books, and payment adapters when available

## Outputs

- payable packet
- ledger entry draft
- approval brief
- `report.maxine.payable-ready`

## Related Skills

- `financial-management` - finance oversight
- `monthly-financial-reporting-synthesis` - reporting consumer
- `workflow-approval-control` - payment approval
