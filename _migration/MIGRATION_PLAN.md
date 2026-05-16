# Migration Intake Plan

## Phase 1: Intake

Create the `_migration/` folder structure and copy only approved old-root materials into `intake/`.

Status: complete for the current requested intake set.

## Phase 2: Inventory

Record every copied file, its source, destination, category, reason for copy, and review safety.

Status: complete in `source_inventory.md`.

## Phase 3: Analysis

Review intake files without rewriting them. Classify each area as preserve, rewrite, archive, ignore, or inspect deeper.

Recommended first analysis targets:

- UI doctrine and app surfaces
- Approval/artifact components
- Architecture docs
- Agent consolidation
- SIGMA/GBrain model
- Provider normalization and Communication Sweep
- Runtime/deployment assumptions
- Secrets protocol documentation

## Phase 4: Prepared Candidates

Create normalized migration candidates under `prepared/` only after review.

Prepared files should be new FlavorOS 1.5 candidates, not raw copies.

## Phase 5: Approval Gate

Move or rewrite material into the real repo only after explicit approval.

No intake file should be copied directly into the product repo unless it has been reviewed and approved.
