#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP_DIR="/root/flavoros-agent-backups/${STAMP}"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run this on the VPS as root so /docker agent data directories can be written." >&2
  exit 1
fi

cd "$ROOT"

copy_agent() {
  local agent="$1"
  local target="$2"

  if [[ ! -d "agents/${agent}" ]]; then
    echo "Missing agents/${agent}" >&2
    exit 1
  fi

  mkdir -p "$BACKUP_DIR"
  if [[ -d "$target/flavoros" ]]; then
    tar -czf "$BACKUP_DIR/${agent}-flavoros-before.tgz" -C "$target" flavoros
  fi

  rm -rf "$target/flavoros"
  mkdir -p "$target/flavoros"

  cp -a FLAVOROS_CONTEXT.md "$target/flavoros/"
  cp -a "agents/${agent}/SOUL.md" "$target/flavoros/"
  cp -a "agents/${agent}/agent.yaml" "$target/flavoros/"
  cp -a "agents/${agent}/skills" "$target/flavoros/"

  if [[ -d "agents/${agent}/protocols" ]]; then
    cp -a "agents/${agent}/protocols" "$target/flavoros/"
  fi

  echo "Synced ${agent} -> ${target}/flavoros"
}

copy_agent "khadijah" "/docker/hermes-agent-kxed/data"
copy_agent "sinclair" "/docker/hermes-agent-isuk/data"
copy_agent "maxine" "/docker/openclaw-pn8l/data"

echo "Backups: $BACKUP_DIR"
echo "Restart after configuring Hostinger runtimes to use the synced flavoros bundles:"
echo "  docker restart hermes-agent-kxed-hermes-agent-1 hermes-agent-isuk-hermes-agent-1 openclaw-pn8l-openclaw-1"
