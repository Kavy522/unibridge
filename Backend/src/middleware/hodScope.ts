import type { NextFunction, Request, Response } from "express";

import prisma from "../config/prisma.js";
import { ApiError } from "../utils/http.js";

export async function hodScope(req: Request, _res: Response, next: NextFunction) {
  if (!req.user?.isHod) {
    return next(new ApiError(403, "FORBIDDEN", "HOD role required."));
  }

  const semesterId = typeof req.query.semesterId === "string" ? req.query.semesterId : undefined;
  const activeSemesterId = semesterId ??
    (await prisma.semester.findFirst({
      where: { universityId: req.user.universityId, status: "ACTIVE" },
      select: { id: true },
    }))?.id;

  const scopes = await prisma.hodBatchScope.findMany({
    where: {
      facultyId: req.user.id,
      semesterId: activeSemesterId ?? undefined,
    },
    include: {
      batch: { select: { code: true } },
    },
  });

  req.hodBatchIds = scopes.map((scope) => scope.batchId);
  req.hodSemesterIds = [...new Set(scopes.map((scope) => scope.semesterId))];
  req.hodBatchCodes = scopes.map((scope) => scope.batch.code);

  next();
}
