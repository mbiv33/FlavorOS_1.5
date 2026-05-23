# FlavorOS 1.5 Migration Intake

> **STATUS: Legacy intake only. Nothing in this directory is wired to the running system.**  
> Do not implement against any file here. Do not treat `intake/` as current architecture or migration-ready code.  
> This directory will be deleted once the intake backlog is fully absorbed.

This folder is the controlled intake area for reviewing selected material from the old FlavorOS root before anything is allowed into the real FlavorOS 1.5 repo structure.

## Purpose

`_migration/` exists to separate source archaeology from approved migration work.

The old root is copied here only as review material. The new root remains clean while decisions are made about what to preserve, rewrite, archive, or ignore.

## Folder Rules

- `intake/` contains copied source material only. Files here should stay as close to the old source as possible.
- `analysis/` contains notes, reports, and next-step recommendations about the copied material.
- `prepared/` contains normalized migration candidates created from intake material after review.
- `archive/` contains material that should remain available for reference but should not enter the product canon.

## Approval Rule

Nothing moves from `_migration/` into the real repo until explicitly approved.

Do not treat files in `intake/` as current architecture, current code, or migration-ready assets. They are source evidence.

## Safety Rule

This folder must not contain private client data, real secrets, local runtime state, generated dependency folders, build output, or cache files.
