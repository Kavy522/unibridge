import type { NextFunction, Request, Response } from "express";

import { ApiError } from "../utils/http.js";
import prisma from "../config/prisma.js";

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.header("authorization")?.replace(/^Bearer\s+/i, "").trim();

  if (!token) {
    return next(new ApiError(401, "AUTH_REQUIRED", "Authorization token is required."));
  }

  const [role, userId] = token.split(":");
  if (!role || !userId || !req.university) {
    return next(new ApiError(401, "AUTH_INVALID", "Invalid authorization token format."));
  }

  if (role === "HOD") {
    req.user = {
      id: userId,
      role: "FACULTY",
      isHod: true,
      universityId: req.university.id,
    };
    return next();
  }

  if (role === "FACULTY") {
    req.user = {
      id: userId,
      role: "FACULTY",
      isHod: false,
      universityId: req.university.id,
    };
    return next();
  }

  if (role === "STUDENT") {
    prisma.student
      .findUnique({ where: { id: userId }, select: { id: true } })
      .then((student) => {
        if (!student) {
          return next(new ApiError(401, "AUTH_INVALID", "Invalid student token."));
        }
        req.user = {
          id: userId,
          role: "STUDENT",
          isHod: false,
          universityId: req.university!.id,
        };
        next();
      })
      .catch(next);
    return;
  }

  if (role === "SUPER_ADMIN") {
    // Dean tokens are verified against the isDean flag — any faculty id alone is not enough.
    prisma.faculty
      .findUnique({ where: { id: userId }, select: { isDean: true } })
      .then((faculty) => {
        if (!faculty?.isDean) {
          return next(new ApiError(401, "AUTH_INVALID", "Invalid dean token."));
        }
        req.user = {
          id: userId,
          role: "SUPER_ADMIN",
          isHod: false,
          universityId: req.university!.id,
        };
        next();
      })
      .catch(next);
    return;
  }

  return next(new ApiError(401, "AUTH_INVALID", "Unsupported authorization token role."));
}

export function requireSuperAdmin(req: Request, _res: Response, next: NextFunction) {
  if (req.user?.role !== "SUPER_ADMIN") {
    return next(new ApiError(403, "FORBIDDEN", "Super-admin role required."));
  }

  next();
}

export function requireUserRole(...roles: Array<"FACULTY" | "STUDENT" | "SUPER_ADMIN">) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ApiError(403, "FORBIDDEN", "Insufficient role for this endpoint."));
    }
    next();
  };
}

export function requireFacultyPortal(req: Request, _res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== "FACULTY" || req.user.isHod) {
    return next(new ApiError(403, "FORBIDDEN", "Faculty role required."));
  }
  next();
}
