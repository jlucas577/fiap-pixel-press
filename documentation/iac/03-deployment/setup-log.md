# Deployment Setup Log

## Entry format: `[date] what → why → result`

---

### 2026-06-11 — IaC Files Authored (agent-swe-devops-iac / deploy workflow)

**What:** Created `render.yaml` Blueprint Spec at repo root with two services:
  - `pixelpress-api` (Node web service, free, Oregon)
  - `pixelpress-web` (Static site, CDN, Oregon)

**Why:** Free-tier Render Blueprint is the chosen IaC artifact for this $0 assignment deploy. No Terraform/Pulumi required — Render's native Blueprint YAML declares the full topology.

**Result:** File created at `/render.yaml`. Not yet deployed — awaiting user to connect repo in Render Dashboard and set secrets.

---

**What:** CORS patch applied to `src/api/src/main.ts`.

**Why:** The Vite dev proxy worked around CORS in development. In production, the React SPA runs on a different origin (`pixelpress-web.onrender.com`) from the API (`pixelpress-api.onrender.com`). Browser preflight requests would fail without explicit CORS headers from the API.

**Result:** Added `app.enableCors({ origin: process.env.CORS_ORIGIN?.split(',') ?? true, credentials: true })` after `app.setGlobalPrefix`. `CORS_ORIGIN=https://pixelpress-web.onrender.com` set in `render.yaml`.

---

**What:** Added `CORS_ORIGIN` to `src/api/.env.example`.

**Why:** Document the new env var for local dev and production. Default value `http://localhost:5173` (Vite dev server) preserves local dev experience.

**Result:** `.env.example` updated with comment explaining the production value.

---

**What:** Created documentation at `documentation/iac/` (README.md, 03-deployment/_active.md, 03-deployment/setup-log.md).

**Why:** Per deploy workflow Phase 04 — topology, trade-offs, runbook, and status tracking are primary deliverables.

**Result:** Files written. See README.md for full topology diagram and dashboard runbook.

---

### 2026-06-11 — Live Deploy to Render (4 build iterations)

**What:** Granted Render's GitHub App access to `caio-swdev/fiap-pixel-press`.
**Why:** Render needs repo read + webhook access to build on push and pull `render.yaml`.
**Result:** Access granted (one-time browser OAuth step).

---

**What:** Connected Blueprint via Render Dashboard (New > Blueprint).
**Why:** First Blueprint connection is dashboard-only — no CLI/API path exists for initial connect.
**Result:** Blueprint `pixelpress` created in workspace "My Workspace". Repo `caio-swdev/fiap-pixel-press`, branch `atividade-2`, auto-deploy on push ON. Secrets `JWT_SECRET` and `RAWG_API_KEY` set in dashboard (sync:false).

---

**What:** Build iteration 1 — static site `region` rejected.
**Why:** render.yaml set `region: oregon` on the static service.
**Result:** FAILED — "static sites cannot have a region". Fix: removed `region` from pixelpress-web.

---

**What:** Build iteration 2 — static site `plan` rejected.
**Why:** render.yaml set `plan: free` on the static service.
**Result:** FAILED — "no such plan free for service type web". Static sites are inherently free and take no plan. Fix: removed `plan` from pixelpress-web.

---

**What:** Build iteration 3 — pnpm install on Render base image.
**Why:** Original buildCommand used `npm install -g pnpm`.
**Result:** FAILED — EROFS, read-only `/usr/lib/node_modules`. Tried `corepack enable` next: ALSO failed — read-only `/usr/bin/pnpm` shim. Fix: use `corepack prepare pnpm@10.8.1 --activate` ONLY (writes to the writable cache; the `/usr/bin/pnpm` shim already exists). Added `COREPACK_ENABLE_DOWNLOAD_PROMPT=0` env var and `packageManager: "pnpm@10.8.1"` in `src/package.json` (lockfileVersion 9.0).

---

**What:** Build iteration 4 — static site rootDir / publish path.
**Why:** Static build needs the workspace root for pnpm to resolve, but publish path must point at the built SPA.
**Result:** FIXED to FINAL working config: `rootDir: src` (workspace root), build `corepack prepare pnpm@10.8.1 --activate && pnpm install --frozen-lockfile && pnpm --filter pixelpress-frontend run build`, `staticPublishPath: web/dist`.

---

**What:** Final deploy — both services LIVE on commit `fe7ed76`.
**Why:** All 4 build blockers resolved; render.yaml converged.
**Result:** SUCCESS.

| # | Service | Service ID | URL | State |
|---|---------|-----------|-----|-------|
| 1 | pixelpress-api | srv-d8llrhog4nts73fhc6n0 | https://pixelpress-api.onrender.com | LIVE — Nest started, DB pushed + seeded on boot. Health `GET /api/v1/games` → 200. Swagger at `/api/docs`. CORS verified (`vary: Origin` + `access-control-allow-credentials`). |
| 2 | pixelpress-web | srv-d8llrhog4nts73fhc6mg | https://pixelpress-web.onrender.com | LIVE — SPA renders, rewrite rule works. |

Secrets: `JWT_SECRET` set, `RAWG_API_KEY` set (but `USE_RAWG_MOCK=true` default still in effect → RAWG mock data served).
