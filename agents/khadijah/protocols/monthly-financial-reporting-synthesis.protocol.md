# Monthly Financial Reporting Synthesis Protocol

## Header

- Owner agent: Maxine
- Supporting agent: Khadijah
- Related skill: `monthly-financial-reporting-synthesis`
- Planning source: `planning/11-monthly-financial-reporting-synthesis/`

## Purpose

Produce a consolidated monthly finance report across revenue, burn, categories, and anomalies.

## Trigger

- Monthly cron
- Manual finance report request
- Reconciliation cycle begins

## Inputs

- Receivables, payables, bank and card summaries, books data, category map, and prior monthly report

## Phase Contract

1. Data Aggregation: collect source totals and ledger artifacts.
2. Categorization Check: validate labels and missing categories.
3. Anomaly Detection: flag unusual movement and exceptions.
4. Report Generation: write report into `vault/35-Reports/`.

## Artifacts

- supported SIGMA update when validated anomalies or category changes affect an existing SIGMA scope
- monthly financial report
- anomaly review note
- categorization audit summary

## SIGMA and Readiness Contract

- SIGMAs hold internal state only when the monthly report changes an existing supported SIGMA scope.
- The monthly financial report and exception notes are readiness artifacts.
- Report sections must link to receivables, payables, ledger source items, and related SIGMAs.
- Standalone finance SIGMA types require catalog/template/folder work before use.

## Approval Gates

- Required before external distribution or decisions based on the report.

## Handoffs

- Khadijah receives owner-facing report summary.
- Accounts receivable and payable receive correction tasks if needed.

## Failure Modes

- Missing source account: mark incomplete and list unavailable source.
- Reconciliation mismatch: flag anomaly with source references.
- Category drift: create audit action.

## Completion Signal

- Publish `report.maxine.monthly-finance-ready`.
