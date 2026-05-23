# API CI: Ruff lint (recurring failure mode)

## What actually fails

`git push` usually succeeds. **GitHub Actions** fails on the API job step **Lint (ruff)** in [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml), which runs from `services/api`:

```bash
.venv/bin/ruff check app/
```

That is the same command you must run locally before pushing API changes. It is **not** optional and is **not** covered by `pytest` alone.

## Why this keeps coming back

Multiple Cursor and Claude sessions have fixed individual Ruff violations, but CI still failed on the next push because:

1. **Import order (I001)** — Ruff uses isort rules on `app.*` imports. They must be alphabetized by module path (e.g. `app.executor` before `app.onboarding` and `app.schemas`). Reordering imports while editing often leaves `executor` or `services` blocks out of order.
2. **Line length (E501)** — `line-length = 100` in [`services/api/pyproject.toml`](../../services/api/pyproject.toml). Long `if` conditions and error strings need explicit line breaks; the editor does not always wrap at 100.
3. **Agents skip the check** — Edits land without running `.venv/bin/ruff check app/` from `services/api`, so only CI surfaces the failure.

## Required pre-push check (API)

From repo root:

```bash
cd services/api
.venv/bin/ruff check app/
```

Auto-fix safe issues (imports, some formatting):

```bash
cd services/api
.venv/bin/ruff check app/ --fix
```

Then re-run without `--fix` and fix any remaining E501 manually.

Full API CI parity (lint + tests):

```bash
cd services/api
.venv/bin/ruff check app/
.venv/bin/python -m pytest tests/ -v --tb=short
```

Use the same env vars as CI for tests when needed: `DATABASE_URL=sqlite://`, `API_SKIP_STARTUP_SEED=true`, `JWT_SECRET=ci-test-secret`.

## Ruff configuration reference

Defined in [`services/api/pyproject.toml`](../../services/api/pyproject.toml):

- `line-length = 100`
- `select = ["E", "F", "I", "UP"]` (includes **I** = isort import sorting)

## For AI agents

Before claiming an API branch is ready to push or opening a PR that touches `services/api/app/**`:

1. Run `cd services/api && .venv/bin/ruff check app/` and fix until it passes.
2. After editing imports in any router, re-run Ruff; do not assume import order is correct.
3. Do not confuse "push failed" with "CI lint failed" — ask for the failing workflow step name.

## Historical fix (2026-05)

Resolved persistent CI failures in:

- `app/routers/providers.py` — I001 import block order
- `app/services/artifact_meta.py` — E501 line over 100 characters

If CI reports new I001/E501 files, apply the same rules rather than disabling Ruff in CI.
