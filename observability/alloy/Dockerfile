# Grafana Alloy agent with the UniBridge scrape config baked in.
# Deploy this to any always-on host (Railway, Fly.io, an Oracle free VM).
# Secrets are provided at runtime as environment variables, never built in.
FROM grafana/alloy:latest
COPY config.alloy /etc/alloy/config.alloy
# The base image's entrypoint runs: alloy run /etc/alloy/config.alloy
