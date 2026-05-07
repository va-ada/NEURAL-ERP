# Neural ERP — Deployment Guide

This document covers every supported way to run Neural ERP — from a one-command
local dev loop to a single-VPS production deploy. Each section is self-contained.

> Stack at a glance: **14 Node.js services** (api-gateway + 13 microservices),
> **1 Python FastAPI ML service**, **1 Vite/React web frontend**,
> backed by **PostgreSQL**, **MongoDB** (audit logs), and **Redis** (cache + rate limit).

---

## Local — Docker Compose

The fastest path to a running stack. Brings up Postgres, Mongo, Redis, and the
ML service. The Node services are run via `npm run dev` on the host so you get
hot reload — same flow the team has used since day one.

```bash
cd backend
cp .env.example .env          # edit secrets if needed
docker compose up -d          # starts postgres, mongodb, redis, ml-service
npm install
npm run db:migrate            # apply Prisma schema
npm run db:seed               # seed demo data (optional)
npm run dev                   # boots api-gateway + 13 microservices
```

Frontend in another terminal:

```bash
cd web
npm install
npm run dev                   # http://localhost:5173
```

When you're done: `docker compose down` (add `-v` to also wipe volumes).

---

## Local — without Docker

If you cannot run Docker, install Postgres 15, MongoDB 7, and Redis 7 on the host
yourself, then point the env vars at them.

```bash
# 1. Bring up datastores yourself (e.g. brew services start postgresql@15 redis)
# 2. Backend
cd backend
cp .env.example .env          # set DATABASE_URL, REDIS_URL, MONGO_URL to host values
npm install
npm run db:migrate
npm run db:seed
npm run dev                   # 14 Node services concurrently

# 3. ML service (separate terminal)
cd backend/services/ml-service
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn src.main:app --port 3014 --reload

# 4. Web (separate terminal)
cd web
npm install
npm run dev
```

---

## Production — Render (free / hobby tier)

Render is the easiest "free until you grow" path. One service definition per
microservice. You can split this across two free Render accounts if you hit
service-count limits.

1. **Database — Render PostgreSQL.** Create a new PostgreSQL instance, copy the
   internal connection string, set it as `DATABASE_URL` on every backend service.
2. **Redis — Render Redis** (paid) **or Upstash Redis** (free tier). Set `REDIS_URL`.
3. **MongoDB — MongoDB Atlas free tier.** Set `MONGO_URL`.
4. **Each Node service — Render Web Service**, root directory pointed at the
   monorepo, build command `cd backend && npm install --workspaces`, start
   command `node services/<svc>/src/index.js` (or use the per-service Dockerfile
   with **Build context = `backend/`**).
5. **api-gateway — Render Web Service**, public, start `node api-gateway/src/index.js`.
   Wire the `*_SERVICE_URL` env vars to the internal Render URLs of each microservice.
6. **ml-service — Render Web Service**, point at `backend/services/ml-service/Dockerfile`.
   Set `ML_DATA_MODE=demo` initially.
7. **Web frontend — Render Static Site** OR Netlify/Vercel (see next section).
   Build command `cd web && npm install && npm run build`, publish `web/dist`.

### Free-tier caveats
- Render free Web Services sleep after 15 min idle — first request after sleep
  takes ~30s. Acceptable for demos, not for users.
- Free Postgres expires after 90 days. Migrate to a paid tier or a different
  managed Postgres (Neon, Supabase) before then.

---

## Production — Vercel / Netlify (frontend only)

The web frontend is a plain Vite SPA — drop it on any static host. The repo
already includes `web/netlify.toml` with the SPA fallback redirect and basic
security headers.

**Netlify**

1. New site → connect repo → base directory `web`.
2. Build settings come from `web/netlify.toml`. Nothing to fill in manually.
3. Set env var `VITE_API_URL=https://<your-gateway-host>`.
4. Deploy. Custom domain via the Netlify dashboard.

**Vercel**

1. New project → root directory `web`. Framework preset: Vite.
2. Build command `npm run build`, output directory `dist`.
3. Add a `vercel.json` rewrite of `/(.*)` → `/index.html` if Vercel doesn't
   auto-detect it (Netlify's redirect block above is the equivalent).
4. Set env var `VITE_API_URL`.

---

## Production — single VPS via Docker Compose

For a real production deploy on one machine (DigitalOcean droplet, Hetzner,
EC2, your own metal), use `backend/docker-compose.prod.yml`. It builds every
service from source and wires them behind nginx. Front the box with **Caddy**
for automatic TLS, or terminate TLS in nginx if you prefer manual certs.

```bash
# On the VPS
git clone <repo-url> neural-erp
cd neural-erp/backend

# Build the web bundle that nginx will serve
(cd ../web && npm install && npm run build)

# Configure secrets
cp .env.example .env
# !!! edit .env — set strong JWT_SECRET, DB password, REDIS_PASSWORD, etc.

# Build & start everything
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

# Run DB migrations once Postgres is healthy
docker compose -f docker-compose.prod.yml exec gateway sh -c \
  "cd / && npx prisma migrate deploy --schema=database/prisma/schema.prisma"
```

To update: pull, `docker compose -f docker-compose.prod.yml build`, then
`up -d` again. Compose recreates only changed containers.

### Putting Caddy in front (recommended for TLS)

Run Caddy on the host (port 80/443) and have it reverse-proxy to the nginx
container on `127.0.0.1:80`:

```caddyfile
neuralerp.example.com {
    reverse_proxy 127.0.0.1:80
}
```

Caddy will auto-issue a Let's Encrypt cert. To bind nginx to `127.0.0.1:80`
only, change the `nginx` ports block in `docker-compose.prod.yml` to
`"127.0.0.1:80:80"`.

---

## Environment Variable Checklist

These must be set in any production environment. Do **not** ship the defaults
from `.env.example` — they are dev-only and well-known.

### Required (every backend service)
- `DATABASE_URL` — Postgres connection string
- `JWT_SECRET` — 256-bit random hex (`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`)
- `JWT_REFRESH_SECRET` — different 256-bit random hex
- `NODE_ENV=production`

### Required (most services)
- `REDIS_URL` — `redis://:<password>@host:6379`
- `MONGO_URL` — Atlas / self-hosted MongoDB connection string

### Required for ml-service
- `ML_DATA_MODE` — `demo` (synthetic) or `live` (reads from Postgres)
- `ML_ADMIN_TOKEN` — shared secret for `/admin/*` endpoints
- `DATABASE_URL` — same Postgres as the Node services
- `ML_MODEL_DIR` — defaults to `/app/models` inside the container

### Required for the web frontend
- `VITE_API_URL` — the public URL of your api-gateway (e.g. `https://api.neuralerp.example.com`)

### Optional but recommended
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` — for OTP email
  (auth-service falls back to console-logging the OTP if these are unset, which
  is fine in dev but *not* in production)
- `GEMINI_API_KEY` — only if you want the LLM-powered AI features live;
  the app gracefully degrades if it is absent
- `FRONTEND_URL` — used by api-gateway for CORS

### Per-service ports (rarely need to override)
`AUTH_SERVICE_PORT=3001` … `ADMIN_SERVICE_PORT=3013`, `ML_SERVICE_PORT=3014`.
The defaults match `docker-compose.prod.yml`.

---

## Verifying a deploy

```bash
curl https://<your-host>/health                 # nginx → gateway health
curl https://<your-host>/api/auth/health        # gateway → auth-service
curl https://<your-host>/api/ml/healthz         # gateway → ml-service
```

All three should return 200. If `/api/ml/healthz` is slow on first hit, that
is the ML service auto-training on cold start — expected behaviour.
