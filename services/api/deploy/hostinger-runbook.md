# FlavorOS API — Hostinger VPS Deploy Runbook

**Target:** Hostinger VPS (Ubuntu 22.04)  
**Result:** `api.flavoros.cc` → always-on VPS instead of Cloudflare tunnel to laptop  
**Time estimate:** ~90 min human, ~15 min hands-on

---

## Prerequisites (one-time)

- SSH access to Hostinger VPS
- Domain `api.flavoros.cc` already on Cloudflare (DNS or tunnel)
- Cloudflare tunnel `bcc8b555-8eb5-495e-943e-5a99f93c8528` currently pointing at your laptop

---

## Step 1 — Provision Postgres on the VPS

```bash
sudo apt update && sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql && sudo systemctl start postgresql

sudo -u postgres psql <<'SQL'
CREATE USER flavoros WITH PASSWORD '<strong-db-password>';
CREATE DATABASE flavoros OWNER flavoros;
SQL
```

Test connection:
```bash
psql postgresql://flavoros:<password>@localhost:5432/flavoros -c "SELECT 1;"
```

---

## Step 2 — Create deploy user + directories

```bash
sudo useradd --system --create-home --shell /bin/bash flavoros
sudo mkdir -p /opt/flavoros/api /etc/flavoros
sudo chown flavoros:flavoros /opt/flavoros/api
```

---

## Step 3 — Clone + install the API

```bash
sudo -u flavoros bash
cd /opt/flavoros/api
git clone https://github.com/mbiv33/FlavorOS_1.5.git repo
cd repo/services/api

python3.11 -m venv .venv
.venv/bin/pip install --upgrade pip
.venv/bin/pip install .
```

Symlink for the service:
```bash
ln -s /opt/flavoros/api/repo/services/api /opt/flavoros/api/.venv
# (or keep working dir as /opt/flavoros/api/repo/services/api — update service file accordingly)
```

> **Note:** Update `WorkingDirectory` in `flavoros-api.service` to match your actual path.

---

## Step 4 — Set environment variables

```bash
sudo cp /opt/flavoros/api/repo/services/api/deploy/.env.production.example /etc/flavoros/api.env
sudo nano /etc/flavoros/api.env   # fill in real values
sudo chmod 600 /etc/flavoros/api.env
sudo chown flavoros:flavoros /etc/flavoros/api.env
```

Required values to set:
| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | `postgresql+psycopg://flavoros:<password>@localhost:5432/flavoros` |
| `JWT_SECRET` | `python -c "import secrets; print(secrets.token_hex(32))"` |
| `ANTHROPIC_API_KEY` | Anthropic console |
| `COMPOSIO_API_KEY` | Composio dashboard |
| `API_ORIGINS` | `https://flavoros.vercel.app` (comma-sep if multiple) |
| `COMPOSIO_REDIRECT_URI` | `https://api.flavoros.cc/providers/callback` |

---

## Step 5 — Run Alembic migrations

```bash
sudo -u flavoros bash -c "
  cd /opt/flavoros/api/repo/services/api
  source /etc/flavoros/api.env
  export DATABASE_URL
  .venv/bin/python -m alembic upgrade head
"
```

Verify:
```bash
sudo -u flavoros bash -c "
  cd /opt/flavoros/api/repo/services/api
  source /etc/flavoros/api.env
  export DATABASE_URL
  .venv/bin/python -m alembic current
"
# Expected: 0007 (head)
```

---

## Step 6 — Install + start the systemd service

```bash
sudo cp /opt/flavoros/api/repo/services/api/deploy/flavoros-api.service \
    /etc/systemd/system/flavoros-api.service

# Edit WorkingDirectory + ExecStart paths if needed
sudo nano /etc/systemd/system/flavoros-api.service

sudo systemctl daemon-reload
sudo systemctl enable flavoros-api
sudo systemctl start flavoros-api
sudo systemctl status flavoros-api
```

Check the API is up locally:
```bash
curl -sf http://127.0.0.1:8008/health
# Expected: {"status":"ok",...}
```

---

## Step 7 — Point Cloudflare tunnel at the VPS

The existing tunnel `bcc8b555-8eb5-495e-943e-5a99f93c8528` routes `api.flavoros.cc` to wherever `cloudflared` is running. Move it to the VPS:

### Option A — Install cloudflared on VPS (recommended, keeps existing tunnel)

```bash
# On the VPS:
curl -L https://pkg.cloudflare.com/cloudflare-main.gpg \
    | sudo gpg --dearmor -o /usr/share/keyrings/cloudflare-main.gpg
echo 'deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared jammy main' \
    | sudo tee /etc/apt/sources.list.d/cloudflared.list
sudo apt update && sudo apt install -y cloudflared
```

Authenticate and run the existing tunnel:
```bash
cloudflared tunnel login
cloudflared tunnel run --url http://127.0.0.1:8008 bcc8b555-8eb5-495e-943e-5a99f93c8528
```

Install as a system service:
```bash
cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
```

Then **stop cloudflared on your laptop** — the VPS takes over.

### Option B — Direct IP + nginx (alternative if you prefer no tunnel)

```bash
sudo apt install -y nginx
sudo nano /etc/nginx/sites-available/flavoros-api
# paste the nginx config from deploy/nginx-flavoros.conf
sudo ln -s /etc/nginx/sites-available/flavoros-api /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Update Cloudflare DNS: add an A record `api.flavoros.cc → <VPS-IP>` with proxy enabled (orange cloud).

---

## Step 8 — Verify end-to-end

```bash
# From any machine:
curl -sf https://api.flavoros.cc/health
# Expected: {"status":"ok","database":"connected",...}

# CORS smoke test:
curl -sf -H "Origin: https://flavoros.vercel.app" \
    -H "Access-Control-Request-Method: POST" \
    -X OPTIONS https://api.flavoros.cc/auth/login
# Expected: 200 with Access-Control-Allow-Origin header
```

Open `https://flavoros.vercel.app` → log in → verify no CORS errors in browser console.

---

## Step 9 — Update Vercel environment

In Vercel dashboard → Project `flavoros` → Settings → Environment Variables:

```
NEXT_PUBLIC_FLAVOROS_API_URL = https://api.flavoros.cc
```

Redeploy (or trigger auto-deploy via git push).

---

## Step 10 — Post-deploy checklist

Run from any machine once Vercel points at the VPS:

```bash
# 1. API health
curl -sf https://api.flavoros.cc/health

# 2. Login works
curl -sf -X POST https://api.flavoros.cc/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"client@demo.local","password":"<dev-client-password>"}'

# 3. App shell loads
curl -sfI https://flavoros.vercel.app

# 4. Manual E2E
# Login → onboarding → sync → Command Center → approve
```

---

## Ongoing ops

| Task | Command |
|---|---|
| View logs | `sudo journalctl -u flavoros-api -f` |
| Restart API | `sudo systemctl restart flavoros-api` |
| Deploy update | `cd /opt/flavoros/api/repo && git pull && sudo systemctl restart flavoros-api` |
| Run new migrations | `cd /opt/flavoros/api/repo/services/api && .venv/bin/python -m alembic upgrade head && sudo systemctl restart flavoros-api` |
| Check tunnel | `sudo systemctl status cloudflared` |

---

## Rollback

```bash
cd /opt/flavoros/api/repo
git log --oneline -10          # find last good commit
git checkout <commit-hash>
sudo systemctl restart flavoros-api
```
