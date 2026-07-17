# Production observability (Option A) — Grafana Cloud + Alloy

Backend runs on **Render**, frontend on **Vercel**. Grafana Cloud hosts the dashboards and
storage; a small **Grafana Alloy** agent scrapes the backend's token-protected `/metrics`
and pushes samples to Grafana Cloud. Nothing here needs a database, a disk, or Docker on Render.

```
Render backend  ──/metrics (Bearer token)──►  Alloy agent  ──remote_write──►  Grafana Cloud
(unibridge-api)      always-on, on Railway/Fly            (hosted Prometheus + Grafana)
```

## What to commit to GitHub
Commit: everything in `observability/` EXCEPT `.env` files.
`config.alloy`, `Dockerfile`, `.env.example`, the dashboards and provisioning are all
safe — they carry no secrets. `observability/.env` and `observability/alloy/.env` are
already git-ignored. Secrets (METRICS_TOKEN, Grafana Cloud API key) only ever live as
environment variables on Render and on the agent host.

## Step 1 — Protect and deploy the backend (Render)
1. Generate a token: `openssl rand -hex 32`.
2. Render dashboard → your backend service → **Environment** → add `METRICS_TOKEN` = that value. Save (it redeploys).
3. Also confirm `ALLOWED_ORIGINS` includes your Vercel domain, e.g. `https://unibridge.vercel.app`.
4. Verify after deploy:
   ```
   curl -o /dev/null -w "%{http_code}\n" https://<your-app>.onrender.com/metrics            # 404 (protected)
   curl -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer <token>" \
        https://<your-app>.onrender.com/metrics                                             # 200
   ```
   > On Render's free plan the service sleeps after ~15 min idle and the in-memory metrics
   > reset on each restart. Counters recover via `rate()`; for gap-free graphs use the
   > always-on Starter instance.

## Step 2 — Create the Grafana Cloud stack (free)
1. Sign up at grafana.com → create a **free** stack.
2. Left nav → **Connections → Add new connection → Hosted Prometheus metrics** (or the stack's
   "Details"). Copy three values into `observability/alloy/.env` (from `.env.example`):
   - **Remote write endpoint** → `GRAFANA_CLOUD_PROM_URL` (ends in `/api/prom/push`)
   - **Username / Instance ID** (a number) → `GRAFANA_CLOUD_PROM_USER`
   - Generate a **token / Cloud Access Policy** with scope `metrics:write` → `GRAFANA_CLOUD_API_KEY`
3. Set `RENDER_HOST=<your-app>.onrender.com:443` and `METRICS_TOKEN=<same as Render>`.

## Step 3 — Deploy the Alloy agent (always-on host)

### Railway (easiest, UI-driven)
1. railway.app → **New Project → Deploy from GitHub repo** → pick this repo.
2. Service settings → **Root Directory** = `observability/alloy` (it builds the Dockerfile).
3. **Variables** → add `RENDER_HOST`, `METRICS_TOKEN`, `GRAFANA_CLOUD_PROM_URL`,
   `GRAFANA_CLOUD_PROM_USER`, `GRAFANA_CLOUD_API_KEY`.
4. Deploy. Check the logs for `Starting Grafana Alloy` and no scrape/remote_write errors.

### Fly.io (CLI alternative)
```
cd observability/alloy
fly launch --no-deploy --name unibridge-alloy      # accept the Dockerfile, skip DB/redis
fly secrets set RENDER_HOST=<host>:443 METRICS_TOKEN=<t> \
  GRAFANA_CLOUD_PROM_URL=<url> GRAFANA_CLOUD_PROM_USER=<id> GRAFANA_CLOUD_API_KEY=<key>
fly deploy
fly logs
```

## Step 4 — Import the dashboard
1. Grafana Cloud → **Dashboards → New → Import**.
2. Upload `observability/grafana/dashboards/unibridge-api.json`.
3. When prompted for the data source, pick your stack's **grafanacloud-…-prom** Prometheus.

## Step 5 — Verify data is flowing
In Grafana Cloud → **Explore** → run `sum(rate(unibridge_http_requests_total[5m]))`.
Hit a few backend endpoints first so there's traffic; samples appear within ~1 minute.

## Step 6 (optional) — Alerts
Grafana Cloud → **Alerting**. Useful rules:
- 5xx rate: `sum(rate(unibridge_http_requests_total{status=~"5.."}[5m])) > 0`
- p95 latency: `histogram_quantile(0.95, sum by (le) (rate(unibridge_http_request_duration_seconds_bucket[5m]))) > 1`

## Frontend (Vercel)
Vercel is static/serverless — there is no Prometheus endpoint to scrape. Use **Vercel Web
Analytics / Speed Insights** for frontend metrics, and Sentry for frontend errors.
