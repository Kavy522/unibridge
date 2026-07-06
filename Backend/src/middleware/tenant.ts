import type { NextFunction, Request, Response } from "express";

import { env } from "../config/env.js";
import prisma from "../config/prisma.js";
import { ApiError } from "../utils/http.js";

export async function tenantMiddleware(req: Request, _res: Response, next: NextFunction) {
  const host = req.header("host");
  const hostname = host?.split(":")[0]?.toLowerCase();
  const subdomain = hostname?.includes(".") ? hostname.split(".")[0] : undefined;
  const isLocalHost = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  const slug = !subdomain || isLocalHost ? env.DEFAULT_UNIVERSITY_SLUG : subdomain;

  const university = await prisma.university.findUnique({ where: { slug } });
  if (!university) {
    return next(new ApiError(404, "UNIVERSITY_NOT_FOUND", "University tenant not found."));
  }

  req.university = university;
  next();
}
