# PixelPress — Infrastructure as Code

## Topology

```
                  ┌─────────────────────────────────────┐
                  │          Render.com (free tier)      │
                  │                                      │
  Browser ──────► │  pixelpress-web (Static Site / Global)│
                  │  https://pixelpress-web.onrender.com  │
                  │                                      │
                  │       VITE_API_BASE_URL ──────────►  │
                  │                                      │
                  │  pixelpress-api (Web Service / Node) │
                  │  https://pixelpress-api.onrender.com  │
                  │   ├─ NestJS 10 + Prisma 5            │
                  │   ├─ SQLite (ephemeral, /prisma/dev.db)│
                  │   └─ CORS ← CORS_ORIGIN env var      │
                  └─────────────────────────────────────┘
```

## IaC Artifact

| File | Purpose |
|------|---------|
| `/render.yaml` | Render Blueprint Spec — single source of truth for both services |

Render does not use Terraform or Pulumi. The Blueprint YAML is the IaC artifact.

## Final Build Configuration (as deployed)

The render.yaml took 4 deploy iterations to converge. The final working config:

### pixelpress-api (Node web service)
- `rootDir: src` (pnpm workspace root)
- Build: `corepack prepare pnpm@10.8.1 --activate` → `pnpm install --frozen-lockfile` → `pnpm --filter pixelpress-backend exec prisma generate` → `pnpm --filter pixelpress-backend run build`
- Start: `cd api && npx prisma db push --skip-generate && npx prisma db seed && node dist/main.js`
- `plan: free`, `region: oregon`
- `COREPACK_ENABLE_DOWNLOAD_PROMPT=0` env var

### pixelpress-web (Static site)
- `rootDir: src` (workspace root — NOT `src/web`)
- Build: `corepack prepare pnpm@10.8.1 --activate` → `pnpm install --frozen-lockfile` → `pnpm --filter pixelpress-frontend run build`
- `staticPublishPath: web/dist` (relative to rootDir `src/`)
- **NO `region`** — Render static sites cannot have a region (served Global).
- **NO `plan`** — Render static sites take no plan (`free` is rejected: "no such plan free for service type web"); they are inherently free.

### Prerequisite in repo
- `src/package.json` declares `packageManager: "pnpm@10.8.1"`; lockfile is `pnpm-lock.yaml` (lockfileVersion 9.0).

## Why $0 / Free Tier

This is an academic assignment (FIAP MVP) requiring zero infrastructure cost. The free tier fully covers the demo use case.

## Trade-offs (Accepted)

| Trade-off | Impact | Mitigation |
|-----------|--------|------------|
| API cold start ~50s after 15 min idle | First request after idle wakes the service | Upgrade to $7/mo paid plan for always-on |
| Ephemeral SQLite filesystem | dev.db wiped on every restart or redeploy | startCommand runs `prisma db push` + `prisma db seed` on each boot. Runtime data (reviews, library items) is NOT persisted. Acceptable for demo. |
| Vite bakes VITE_API_BASE_URL at build time | Cannot use Render's `fromService` dynamic reference for static sites | URL hardcoded as `https://pixelpress-api.onrender.com/api/v1`. Two-step deploy required if API URL changes (deploy API first, then frontend). |
| pnpm workspace on Render native Node | Render's base image has a read-only `/usr/lib/node_modules` and `/usr/bin`. `npm install -g pnpm` fails (EROFS) and `corepack enable` also fails (read-only `/usr/bin/pnpm` shim). | Activate pnpm via Corepack into the writable cache only: `corepack prepare pnpm@10.8.1 --activate` (the `/usr/bin/pnpm` shim already exists). Requires `packageManager: "pnpm@10.8.1"` in `src/package.json` (lockfileVersion 9.0) and env `COREPACK_ENABLE_DOWNLOAD_PROMPT=0`. See render.yaml for the exact build commands. |
| No persistent DB on free plan | Cannot upgrade to persistent disk without paid plan | Acceptable for MVP demo. Production deployment would require migration to Postgres (paid add-on) or an external DB. |

## Deploy Order

1. Deploy `pixelpress-api` first (API must be live before frontend can be tested).
2. Deploy `pixelpress-web` after API is healthy (Vite build bakes the API URL).

## Secrets (Dashboard Only — Never Committed)

| Variable | Where to Set | Notes |
|----------|-------------|-------|
| `JWT_SECRET` | Render Dashboard > pixelpress-api > Environment | Min 32 random chars |
| `RAWG_API_KEY` | Render Dashboard > pixelpress-api > Environment | Free key from rawg.io/apidocs. Leave USE_RAWG_MOCK=true if not set. |

## Services (LIVE)

| Service | URL | Service ID | Plan | Region | Status |
|---------|-----|-----------|------|--------|--------|
| pixelpress-api | https://pixelpress-api.onrender.com | srv-d8llrhog4nts73fhc6n0 | Free | Oregon | LIVE (commit fe7ed76) |
| pixelpress-web | https://pixelpress-web.onrender.com | srv-d8llrhog4nts73fhc6mg | Free (inherent) | Global (no region) | LIVE (commit fe7ed76) |

## Further Reading

- [Render Blueprint Spec](https://render.com/docs/blueprint-spec)
- [Render Free Plan limits](https://render.com/docs/free)
- `documentation/iac/03-deployment/setup-log.md` — execution log
- `documentation/iac/03-deployment/_active.md` — current provider state
