#!/usr/bin/env bash
# ============================================================
# FlavorOS VPS Deployment Script
# Target: root@2.24.65.59 (Hostinger VPS)
# Repo:   https://github.com/mbiv33/FlavorOS_1.5.git
#
# Run from your LOCAL machine: bash deploy-vps.sh
# Re-running is safe — it pulls latest and rebuilds.
# ============================================================
set -euo pipefail

VPS_IP="2.24.65.59"
VPS_USER="root"
# Set your GitHub Personal Access Token here (repo scope required for private repos)
# Get one at: https://github.com/settings/tokens
GITHUB_TOKEN="${GITHUB_TOKEN:-}"   # can also export GITHUB_TOKEN=... before running
REPO_URL="https://${GITHUB_TOKEN}@github.com/mbiv33/FlavorOS_1.5.git"
REPO_DIR="/srv/flavoros"
APP_NAME="flavoros"
BRANCH="main"   # change if you deploy from a different branch

# ─── STEP 1: Connectivity check ─────────────────────────────
echo "==> Checking SSH connectivity..."
ssh -o ConnectTimeout=10 "${VPS_USER}@${VPS_IP}" \
  "echo '✓ SSH OK — $(uname -a)'"

# ─── STEP 2: System deps (Node 20 + pnpm 9 + PM2) ──────────
echo "==> Installing system dependencies..."
ssh "${VPS_USER}@${VPS_IP}" bash <<'REMOTE'
set -euo pipefail

# Node 20
if ! command -v node &>/dev/null || [[ "$(node -v)" != v20* ]]; then
  echo "Installing Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
echo "Node: $(node -v)"

# pnpm 9 via corepack
corepack enable
corepack prepare pnpm@9.15.4 --activate
echo "pnpm: $(pnpm -v)"

# PM2
if ! command -v pm2 &>/dev/null; then
  npm install -g pm2
fi
echo "PM2: $(pm2 -v)"

# git
apt-get install -y git 2>/dev/null || true
REMOTE

# ─── STEP 3: Clone or pull repo ─────────────────────────────
echo "==> Syncing repo from GitHub..."
ssh "${VPS_USER}@${VPS_IP}" bash <<REMOTE
set -euo pipefail

if [ -d "${REPO_DIR}/.git" ]; then
  echo "Repo exists — pulling latest..."
  cd ${REPO_DIR}
  git fetch origin
  git checkout ${BRANCH}
  git reset --hard origin/${BRANCH}
else
  echo "Stale directory found (no .git) — removing and cloning fresh..."
  rm -rf ${REPO_DIR}
  git clone --branch ${BRANCH} ${REPO_URL} ${REPO_DIR}
  cd ${REPO_DIR}
fi

echo "HEAD: \$(git log --oneline -1)"
REMOTE

# ─── STEP 4: Install deps & build ───────────────────────────
echo "==> Installing dependencies and building..."
ssh "${VPS_USER}@${VPS_IP}" bash <<REMOTE
set -euo pipefail
cd ${REPO_DIR}
pnpm install --frozen-lockfile
pnpm --filter ${APP_NAME} build
REMOTE

# ─── STEP 5: .env check ─────────────────────────────────────
echo "==> Checking .env..."
ssh "${VPS_USER}@${VPS_IP}" bash <<'REMOTE'
ENV_PATH="/srv/flavoros/apps/flavoros/.env"
if [ ! -f "$ENV_PATH" ]; then
  echo ""
  echo "⚠️  WARNING: No .env found at $ENV_PATH"
  echo "   Create it before starting the app:"
  echo ""
  echo "   cat > $ENV_PATH <<EOF"
  echo "   NEXT_PUBLIC_INSTANT_APP_ID=<your-instant-app-id>"
  echo "   INSTANT_APP_ADMIN_TOKEN=<your-instant-admin-token>"
  echo "   NODE_ENV=production"
  echo "   PORT=3000"
  echo "   EOF"
  echo ""
else
  echo "✓ .env exists"
fi
REMOTE

# ─── STEP 6: Start / restart with PM2 ───────────────────────
echo "==> Starting app with PM2..."
ssh "${VPS_USER}@${VPS_IP}" bash <<REMOTE
set -euo pipefail
cd ${REPO_DIR}

pm2 delete ${APP_NAME} 2>/dev/null || true

pm2 start "pnpm --filter ${APP_NAME} start" \
  --name "${APP_NAME}" \
  --cwd "${REPO_DIR}" \
  --env production

pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || true

echo ""
pm2 list
REMOTE

# ─── STEP 7: Health check ───────────────────────────────────
echo "==> Waiting for app to come up..."
sleep 6

ssh "${VPS_USER}@${VPS_IP}" \
  "curl -sf http://localhost:3000 -o /dev/null \
    && echo '✓ App responding on :3000' \
    || echo '✗ Not responding yet — check: pm2 logs ${APP_NAME}'"

echo ""
echo "============================================================"
echo "  Deployment complete!"
echo "  App: http://${VPS_IP}:3000"
echo ""
echo "  To redeploy after a git push:"
echo "    bash deploy-vps.sh"
echo ""
echo "  Remaining steps:"
echo "    1. Ensure /srv/flavoros/apps/flavoros/.env exists"
echo "    2. Point domain DNS A record -> ${VPS_IP}"
echo "    3. Install Caddy or nginx for TLS on port 443"
echo "============================================================"
