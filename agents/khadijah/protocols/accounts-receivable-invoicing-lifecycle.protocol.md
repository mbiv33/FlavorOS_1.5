# Accounts Receivable and Invoicing Lifecycle Protocol

## Header

- Owner agent: Maxine
- Supporting agent: Khadijah
- Related skill: `accounts-receivable-invoicing-lifecycle`
- Planning source: `planning/09-accounts-receivable-invoicing-lifecycle/`

## Purpose

Convert billable milestones into approved invoices and tracked receivables.

## Trigger

- Billable milestone is complete
- Billing cycle closes
- Invoice status is requested

## Inputs

- Project scope, milestone status, client billing metadata, rates, prior invoices, and ledger state

## Phase Contract

1. Milestone Trigger: validate billable event.
2. Invoice Generation: build invoice packet.
3. HITL Approval: route dispatch decision to Khadijah.
4. Dispatch: send only after approval.
5. Payment Monitoring and Reconciliation: update receivable state.

## Artifacts

- `project-state` SIGMA update for billable events, invoice state, disputes, and reconciliation when tied to a project
- invoice packet
- receivables tracker
- reconciliation note

## SIGMA and Readiness Contract

- SIGMAs hold validated project billing context when the finance state belongs to an active project.
- Invoice packets and receivables trackers are readiness artifacts for approval, dispatch, and monitoring.
- Invoice readiness artifacts must link to milestones, ledger source items, and related SIGMAs.
- Standalone finance SIGMA types require catalog/template/folder work before use.

## Approval Gates

- Required for invoice dispatch, disputes, discounts, write-offs, and term changes.

## Handoffs

- Khadijah receives approval packet.
- Monthly reporting consumes invoice and reconciliation state.

## Failure Modes

- Missing billing terms: halt and escalate.
- Milestone disputed: open issue for Khadijah.
- Payment source mismatch: mark unreconciled and investigate.

## Completion Signal

- Publish `report.maxine.invoice-ready` or `report.maxine.receivable-updated`.
