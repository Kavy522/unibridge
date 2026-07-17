# Local and production monitoring

This stack uses Prometheus to collect metrics and Grafana to display them. It is intentionally small enough for the free Oracle VM.

## Start locally

1. Start the backend on the host:

   ```bash
   cd Backend
   npm run dev
   ```

2. Copy the monitoring environment file and set a local Grafana password:

   ```bash
   cp observability/.env.example observability/.env
   ```

3. Start Prometheus and Grafana:

   ```bash
   docker compose --env-file observability/.env -f docker-compose.observability.yml up -d
   ```

4. Open Grafana at `http://localhost:3001` and sign in with the values from `observability/.env`. The pre-provisioned **UniBridge API Overview** dashboard appears in the `UniBridge` folder. Prometheus is available only on `http://localhost:9090` for local debugging.

5. After PostgreSQL and Redis are running locally, start their exporters too:

   ```bash
   docker compose --env-file observability/.env -f docker-compose.observability.yml --profile exporters up -d
   ```

6. On a Linux production VM, add host CPU/RAM/disk metrics with Node Exporter:

   ```bash
   docker compose --env-file observability/.env -f docker-compose.observability.yml --profile host-metrics up -d
   ```

   Do **not** enable `host-metrics` on Docker Desktop for macOS; Docker Desktop does not support the required Linux host mount. Grafana still shows API, database, and Redis metrics locally.

The backend exposes `http://localhost:4000/metrics`. This is for local use only; do not publish it through the production reverse proxy.

## What is collected

- API request count, error rate, p50/p95/p99 latency, in-flight requests, and per-route usage.
- Successful feature use by role (results, attendance, notes, quizzes, announcements, chat, timetable, calendar, AI).
- Prisma query duration by SQL operation only—never raw SQL or student data.
- Node.js event-loop, CPU, memory, GC, and active-handle metrics.
- Optional PostgreSQL, Redis, and VM exporter metrics.

Metric labels intentionally never include student IDs, enrollment numbers, emails, IP addresses, tokens, raw URLs, or SQL text.

## Production use

1. Run the API, Prometheus, and exporters on the same private Docker network.
2. Mount `observability/prometheus/prometheus.production.yml` into Prometheus instead of the local file. Its API target is `api:4000`.
3. Do not publish the API container port. Caddy proxies only `/api/*` and must return `404` for `/metrics`.
4. Do not publish Prometheus. Publish Grafana only through Caddy HTTPS at a protected administrator-only subdomain such as `grafana.example.edu`.
5. Set a long `GRAFANA_ADMIN_PASSWORD`, keep the volumes backed up, and retain Prometheus data for seven days on the free VM.

## Verify a performance change

1. Run the same k6 script before and after a code change.
2. Compare the API p95 latency, 5xx rate, request rate, database p95, CPU/memory, and cache hit rate on the Grafana dashboard.
3. A lower p95 with no higher error rate is a verified improvement.

## Stop or reset local monitoring

```bash
docker compose -f docker-compose.observability.yml down
```

Add `-v` only when deliberately deleting local Grafana dashboards and Prometheus history.
