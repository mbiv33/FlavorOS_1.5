#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

AGENT_NAME="sinclair_communications"
SERVICE_NAME="flavoros-agent-sinclair-hermes"
AGENT_CONFIG="agents/sinclair/agent.yaml"
INSTRUCTION_ROOT="agents/sinclair"
ENV_FILE="${FLAVOROS_LOCAL_ENV_FILE:-.env.local}"
HERMES_BIN="${HERMES_BIN:-hermes}"
SMOKE=0

if [[ "${1:-}" == "--smoke" ]]; then
  SMOKE=1
fi

if [[ -f "${ENV_FILE}" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "${ENV_FILE}"
  set +a
fi

require_path() {
  local path="$1"
  if [[ ! -e "${path}" ]]; then
    echo "Missing required path: ${path}" >&2
    exit 1
  fi
}

require_path "${AGENT_CONFIG}"
require_path "${INSTRUCTION_ROOT}"
require_path "${INSTRUCTION_ROOT}/skills"
require_path "${INSTRUCTION_ROOT}/protocols"

if [[ "${SMOKE}" == "1" ]]; then
  echo "Service: ${SERVICE_NAME}"
  echo "Agent: ${AGENT_NAME}"
  echo "Agent config: ${AGENT_CONFIG}"
  echo "Instruction root: ${INSTRUCTION_ROOT}"
  echo "Local env file: ${ENV_FILE}"
  if [[ -n "${FLAVOROS_SINCLAIR_HERMES_COMMAND:-}" ]]; then
    echo "Command: FLAVOROS_SINCLAIR_HERMES_COMMAND override is set"
  elif command -v "${HERMES_BIN}" >/dev/null 2>&1; then
    echo "Hermes binary: $(command -v "${HERMES_BIN}")"
  else
    echo "Hermes binary '${HERMES_BIN}' not found; set HERMES_BIN or FLAVOROS_SINCLAIR_HERMES_COMMAND." >&2
    exit 1
  fi
  echo "Local Sinclair Hermes smoke check OK"
  exit 0
fi

export FLAVOROS_AGENT_NAME="${AGENT_NAME}"
export FLAVOROS_AGENT_SERVICE="${SERVICE_NAME}"
export FLAVOROS_AGENT_CONFIG="${AGENT_CONFIG}"
export FLAVOROS_INSTRUCTION_ROOT="${INSTRUCTION_ROOT}"
export FLAVOROS_RUNTIME_LOCATION="local"
export FLAVOROS_ENGINE="hermes"

if [[ -n "${FLAVOROS_SINCLAIR_HERMES_COMMAND:-}" ]]; then
  exec bash -lc "${FLAVOROS_SINCLAIR_HERMES_COMMAND}"
fi

exec "${HERMES_BIN}" agent run \
  --config "${AGENT_CONFIG}" \
  --instructions "${INSTRUCTION_ROOT}"
