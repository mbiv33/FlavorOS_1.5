#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP_DIR="${BACKUP_DIR:-/root/flavoros-agent-backups/${STAMP}}"
RESTART=0
SKIP_OPENCLAW=0

KHADIJAH_DATA_ROOT="${KHADIJAH_DATA_ROOT:-/docker/hermes-agent-kxed/data}"
REGINE_HERMES_DATA_ROOT="${REGINE_HERMES_DATA_ROOT:-/docker/hermes-agent-isuk/data}"
REGINE_OPENCLAW_DATA_ROOT="${REGINE_OPENCLAW_DATA_ROOT:-/docker/openclaw-pn8l/data}"
KHADIJAH_CONTAINER="${KHADIJAH_CONTAINER:-hermes-agent-kxed-hermes-agent-1}"
REGINE_HERMES_CONTAINER="${REGINE_HERMES_CONTAINER:-hermes-agent-isuk-hermes-agent-1}"
REGINE_OPENCLAW_CONTAINER="${REGINE_OPENCLAW_CONTAINER:-openclaw-pn8l-openclaw-1}"

for arg in "$@"; do
  case "${arg}" in
    --restart) RESTART=1 ;;
    --skip-openclaw) SKIP_OPENCLAW=1 ;;
    *)
      echo "Unknown argument: ${arg}" >&2
      exit 64
      ;;
  esac
done

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run this on the VPS as root so /docker agent data directories can be written." >&2
  exit 1
fi

cd "${ROOT_DIR}"

bash scripts/check-agent-runtime-config.sh

copy_agent() {
  local agent="$1"
  local target_root="$2"

  if [[ ! -d "agents/${agent}" ]]; then
    echo "Missing agents/${agent}" >&2
    exit 1
  fi

  if [[ ! -d "${target_root}" ]]; then
    echo "Missing Hostinger data root: ${target_root}" >&2
    echo "Set the target explicitly, for example: ${agent^^}_DATA_ROOT=/docker/<container>/data" >&2
    exit 1
  fi

  mkdir -p "${BACKUP_DIR}"
  if [[ -d "${target_root}/flavoros" ]]; then
    tar -czf "${BACKUP_DIR}/${agent}-flavoros-before.tgz" -C "${target_root}" flavoros
  fi

  rm -rf "${target_root}/flavoros"
  mkdir -p "${target_root}/flavoros"

  if [[ -f "agents/${agent}/SOUL.md" ]]; then
    cp -a "agents/${agent}/SOUL.md" "${target_root}/flavoros/"
  fi
  cp -a "agents/${agent}/agent.yaml" "${target_root}/flavoros/"

  for child in skills protocols personas; do
    if [[ -d "agents/${agent}/${child}" ]]; then
      cp -a "agents/${agent}/${child}" "${target_root}/flavoros/"
    fi
  done

  echo "Synced ${agent} -> ${target_root}/flavoros"
}

copy_agent "khadijah" "${KHADIJAH_DATA_ROOT}"

if [[ "${SKIP_OPENCLAW}" == "1" ]]; then
  copy_agent "regine" "${REGINE_HERMES_DATA_ROOT}"
else
  copy_agent "regine" "${REGINE_OPENCLAW_DATA_ROOT}"
fi

echo "Backups: ${BACKUP_DIR}"

if [[ "${RESTART}" == "1" ]]; then
  if [[ "${SKIP_OPENCLAW}" == "1" ]]; then
    docker restart "${KHADIJAH_CONTAINER}" "${REGINE_HERMES_CONTAINER}"
  else
    docker restart "${KHADIJAH_CONTAINER}" "${REGINE_OPENCLAW_CONTAINER}"
  fi
else
  echo "Restart when ready:"
  if [[ "${SKIP_OPENCLAW}" == "1" ]]; then
    echo "  docker restart ${KHADIJAH_CONTAINER} ${REGINE_HERMES_CONTAINER}"
  else
    echo "  docker restart ${KHADIJAH_CONTAINER} ${REGINE_OPENCLAW_CONTAINER}"
  fi
fi
