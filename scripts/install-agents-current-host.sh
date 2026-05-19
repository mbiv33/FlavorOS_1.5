#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="${REPO_DIR:-/srv/flavoros}"
ENV_FILE="${ENV_FILE:-/etc/flavoros/agents.env}"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run this script as root on the agent host." >&2
  exit 1
fi

if [[ ! -d "${REPO_DIR}/.git" ]]; then
  echo "Repo not found at ${REPO_DIR}. Clone or pull FlavorOS there first." >&2
  exit 1
fi

cd "${REPO_DIR}"

echo "==> Checking agent runtime config..."
bash scripts/check-agent-runtime-config.sh

echo "==> Ensuring base prerequisites..."
if ! command -v node >/dev/null 2>&1 || [[ "$(node -v)" != v20* ]]; then
  echo "Installing Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

corepack enable
corepack prepare pnpm@9.15.4 --activate
apt-get update -y
apt-get install -y git

command -v systemctl >/dev/null 2>&1 || {
  echo "systemctl is required for agent services." >&2
  exit 1
}

echo "Node: $(node -v)"
echo "pnpm: $(pnpm -v)"

echo "==> Installing repo dependencies..."
pnpm install --frozen-lockfile

echo "==> Checking ${ENV_FILE}..."
if [[ ! -f "${ENV_FILE}" ]]; then
  mkdir -p "$(dirname "${ENV_FILE}")"
  cat > "${ENV_FILE}.example" <<'EOF'
NODE_ENV=production
FLAVOROS_REPO_DIR=/srv/flavoros
HERMES_BIN=hermes
OPENCLAW_BIN=openclaw
# FLAVOROS_KHADIJAH_HERMES_COMMAND='hermes agent run --config agents/khadijah/agent.yaml --instructions agents/khadijah'
# FLAVOROS_REGINE_OPENCLAW_COMMAND='openclaw agent --agent main --local --config agents/regine/agent.yaml'
EOF
  chmod 600 "${ENV_FILE}.example"
  echo "Missing ${ENV_FILE}. Created ${ENV_FILE}.example; copy it to ${ENV_FILE} and add real secrets." >&2
  exit 1
fi

chmod 600 "${ENV_FILE}"
set -a
# shellcheck disable=SC1090
source "${ENV_FILE}"
set +a

HERMES_BIN="${HERMES_BIN:-hermes}"
OPENCLAW_BIN="${OPENCLAW_BIN:-openclaw}"

if [[ -z "${FLAVOROS_KHADIJAH_HERMES_COMMAND:-}" ]] && ! command -v "${HERMES_BIN}" >/dev/null 2>&1; then
  echo "Hermes binary '${HERMES_BIN}' not found. Install Hermes or set FLAVOROS_KHADIJAH_HERMES_COMMAND in ${ENV_FILE}." >&2
  exit 1
fi

if [[ -z "${FLAVOROS_REGINE_OPENCLAW_COMMAND:-}" ]] && ! command -v "${OPENCLAW_BIN}" >/dev/null 2>&1; then
  echo "OpenClaw binary '${OPENCLAW_BIN}' not found. Install OpenClaw or set FLAVOROS_REGINE_OPENCLAW_COMMAND in ${ENV_FILE}." >&2
  exit 1
fi

echo "==> Installing shared agent runner..."
install -d -m 755 /usr/local/bin
cat > /usr/local/bin/flavoros-agent-runner <<'RUNNER'
#!/usr/bin/env bash
set -euo pipefail

AGENT_KEY="${1:?agent key required}"
ENGINE="${2:?engine required}"
REPO_DIR="${FLAVOROS_REPO_DIR:-/srv/flavoros}"
ENV_FILE="${FLAVOROS_AGENT_ENV_FILE:-/etc/flavoros/agents.env}"

if [[ -f "${ENV_FILE}" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "${ENV_FILE}"
  set +a
fi

cd "${REPO_DIR}"

case "${AGENT_KEY}:${ENGINE}" in
  khadijah:hermes)
    export FLAVOROS_AGENT_NAME="khadijah_conductor"
    export FLAVOROS_AGENT_CONFIG="agents/khadijah/agent.yaml"
    export FLAVOROS_INSTRUCTION_ROOT="agents/khadijah"
    if [[ -n "${FLAVOROS_KHADIJAH_HERMES_COMMAND:-}" ]]; then
      exec bash -lc "${FLAVOROS_KHADIJAH_HERMES_COMMAND}"
    fi
    exec "${HERMES_BIN:-hermes}" agent run --config "${FLAVOROS_AGENT_CONFIG}" --instructions "${FLAVOROS_INSTRUCTION_ROOT}"
    ;;
  regine:openclaw)
    export FLAVOROS_AGENT_NAME="regine_research_logistics"
    export FLAVOROS_AGENT_CONFIG="agents/regine/agent.yaml"
    export FLAVOROS_INSTRUCTION_ROOT="agents/regine"
    if [[ -n "${FLAVOROS_REGINE_OPENCLAW_COMMAND:-}" ]]; then
      exec bash -lc "${FLAVOROS_REGINE_OPENCLAW_COMMAND}"
    fi
    exec "${OPENCLAW_BIN:-openclaw}" agent --agent main --local --config "${FLAVOROS_AGENT_CONFIG}"
    ;;
  *)
    echo "Unsupported FlavorOS agent runtime: ${AGENT_KEY}:${ENGINE}" >&2
    exit 64
    ;;
esac
RUNNER
chmod 755 /usr/local/bin/flavoros-agent-runner

echo "==> Installing systemd services..."
cat > /etc/systemd/system/flavoros-agent-khadijah-hermes.service <<'UNIT'
[Unit]
Description=FlavorOS Khadijah Hermes Agent
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=/srv/flavoros
EnvironmentFile=/etc/flavoros/agents.env
ExecStart=/usr/local/bin/flavoros-agent-runner khadijah hermes
Restart=always
RestartSec=10
KillSignal=SIGINT
TimeoutStopSec=30

[Install]
WantedBy=multi-user.target
UNIT

cat > /etc/systemd/system/flavoros-agent-regine-openclaw.service <<'UNIT'
[Unit]
Description=FlavorOS Regine OpenClaw Agent
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=/srv/flavoros
EnvironmentFile=/etc/flavoros/agents.env
ExecStart=/usr/local/bin/flavoros-agent-runner regine openclaw
Restart=always
RestartSec=10
KillSignal=SIGINT
TimeoutStopSec=30

[Install]
WantedBy=multi-user.target
UNIT

systemctl daemon-reload
systemctl enable flavoros-agent-khadijah-hermes.service
systemctl enable flavoros-agent-regine-openclaw.service
systemctl restart flavoros-agent-khadijah-hermes.service
systemctl restart flavoros-agent-regine-openclaw.service

systemctl --no-pager --full status flavoros-agent-khadijah-hermes.service flavoros-agent-regine-openclaw.service

echo "Agent services installed on current host."
