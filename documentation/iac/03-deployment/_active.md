> **Active Provider:** Render.com
> **IaC Tool:** render.yaml Blueprint Spec
> **Environment:** prod (free tier)
> **Status:** LIVE / provisioned
> **API URL:** https://pixelpress-api.onrender.com
> **Web URL:** https://pixelpress-web.onrender.com
> **Last updated:** 2026-06-11

## Deployment State

| # | Field | Value |
|---|-------|-------|
| 1 | Provider | Render.com |
| 2 | Workspace | My Workspace |
| 3 | Blueprint name | pixelpress |
| 4 | IaC artifact | `/render.yaml` (repo root) |
| 5 | Repo connected | caio-swdev/fiap-pixel-press |
| 6 | Branch | atividade-2 |
| 7 | Auto-deploy on push | ON |
| 8 | Live commit | fe7ed76 |
| 9 | API service name | pixelpress-api |
| 10 | API service ID | srv-d8llrhog4nts73fhc6n0 |
| 11 | API runtime | Node (native, no Docker) |
| 12 | API region | Oregon |
| 13 | API URL | https://pixelpress-api.onrender.com |
| 14 | API health | `GET /api/v1/games` → 200 |
| 15 | API Swagger | https://pixelpress-api.onrender.com/api/docs |
| 16 | Web service name | pixelpress-web |
| 17 | Web service ID | srv-d8llrhog4nts73fhc6mg |
| 18 | Web runtime | Static Site (Global CDN, no region/plan) |
| 19 | Web URL | https://pixelpress-web.onrender.com |
| 20 | Plan | Free (API free plan; static sites are inherently free) |
| 21 | DB | SQLite (ephemeral) — pushed + seeded on every boot |
| 22 | CORS | Verified (responses carry `vary: Origin` + `access-control-allow-credentials`) |
| 23 | Status | LIVE — both services provisioned and verified |

## Secrets (sync:false — set in Render Dashboard)

| # | Secret | State |
|---|--------|-------|
| 1 | JWT_SECRET | Set |
| 2 | RAWG_API_KEY | Set (but `USE_RAWG_MOCK=true` default still in effect, so RAWG mock data is served) |

## Previous Provider

None — first deployment.
