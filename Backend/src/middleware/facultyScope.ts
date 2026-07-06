import type { NextFunction, Request, Response } from "express";

import prisma from "../config/prisma.js";

export async function facultyScope(req: Request, _res: Response, next: NextFunction) {
  const activeSemester =
    (await prisma.semester.findFirst({
      where: { universityId: req.user?.universityId ?? "", status: "ACTIVE" },
      select: { id: true },
    })) ?? null;

  const assignments = await prisma.facultyBatchAssignment.findMany({
    where: {
      facultyId: req.user?.id,
      semesterId: activeSemester?.id ?? undefined,
    },
    select: { batchId: true, subjectId: true },
  });

  req.assignedBatchIds = [...new Set(assignments.map((item) => item.batchId))];
  req.assignedSubjectIds = [
    ...new Set(assignments.map((item) => item.subjectId).filter((item): item is string => Boolean(item))),
  ];
  req.mentorStudentIds = (
    await prisma.mentorAssignment.findMany({
      where: {
        facultyId: req.user?.id,
        semesterId: activeSemester?.id ?? undefined,
      },
      select: { studentId: true },
    })
  ).map((item) => item.studentId);
  req.facultySemesterId = activeSemester?.id;

  next();
}
