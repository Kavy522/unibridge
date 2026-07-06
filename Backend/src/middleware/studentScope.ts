import type { NextFunction, Request, Response } from "express";

import prisma from "../config/prisma.js";
import { ApiError } from "../utils/http.js";

export async function studentScope(req: Request, _res: Response, next: NextFunction) {
  const student = await prisma.student.findUnique({
    where: { id: req.user?.id ?? "" },
    select: {
      id: true,
      universityId: true,
      enrollmentNo: true,
      name: true,
      email: true,
      branch: true,
      admissionYear: true,
      profilePhotoUrl: true,
      phone: true,
      isActive: true,
    },
  });

  if (!student) {
    return next(new ApiError(404, "NOT_FOUND", "Student not found."));
  }

  const activeSemester =
    (await prisma.semester.findFirst({
      where: { universityId: req.user?.universityId ?? "", status: "ACTIVE" },
      select: { id: true },
    })) ?? null;

  const currentEnrollment = await prisma.studentEnrollment.findFirst({
    where: {
      studentId: student.id,
      isCurrent: true,
      semesterId: activeSemester?.id ?? undefined,
    },
    select: { batchId: true, semesterId: true },
  });

  req.studentRecord = student as any;
  req.currentEnrollment = currentEnrollment as any;
  req.batchId = currentEnrollment?.batchId;
  req.semesterId = currentEnrollment?.semesterId;

  next();
}
