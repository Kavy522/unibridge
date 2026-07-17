import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "./config/env.js";
import { metricsHandler, metricsMiddleware } from "./config/metrics.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { apiRouter } from "./routes/index.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim()),
    }),
  );
  app.use(compression());
  app.use(express.json({ limit: "5mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan("dev"));
  app.get("/api/v1/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });
  // On Render there is no private network — gate /metrics behind a bearer token when METRICS_TOKEN is set.
  // Respond 404 (not 401) so the endpoint stays undiscoverable to anonymous callers.
  app.get("/metrics", (req, res, next) => {
    if (env.METRICS_TOKEN && req.headers.authorization !== `Bearer ${env.METRICS_TOKEN}`) {
      res.status(404).end();
      return;
    }
    next();
  }, metricsHandler);
  app.use(metricsMiddleware);
  app.use("/api/v1", apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
