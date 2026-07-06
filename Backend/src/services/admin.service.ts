import prisma from "../config/prisma.js";
import { ApiError } from "../utils/http.js";

export class AdminService {
  async assignHodScope(facultyId: string, batchIds: string[], semesterId: string) {
    const faculty = await prisma.faculty.findUnique({
      where: { id: facultyId },
      select: { id: true, isHod: true },
    });
    if (!faculty || !faculty.isHod) {
      throw new ApiError(404, "HOD_NOT_FOUND", "HOD faculty record not found.");
    }

    const semester = await prisma.semester.findUnique({
      where: { id: semesterId },
      select: { id: true, academicYearId: true },
    });
    if (!semester) {
      throw new ApiError(404, "SEMESTER_NOT_FOUND", "Semester not found.");
    }

    const assigned: Array<{ hodId: string; batchCode: string }> = [];

    for (const batchId of batchIds) {
      const batch = await prisma.batch.findUnique({
        where: { id: batchId },
        select: { id: true, code: true },
      });
      if (!batch) {
        throw new ApiError(404, "BATCH_NOT_FOUND", `Batch ${batchId} not found.`);
      }

      const existingScope = await prisma.hodBatchScope.findFirst({
        where: {
          batchId,
          semesterId,
          NOT: { facultyId },
        },
        select: { id: true },
      });
      if (existingScope) {
        throw new ApiError(
          409,
          "BATCH_ALREADY_HAS_HOD",
          `Batch ${batch.code} is already assigned to another HOD for this semester.`,
        );
      }

      const currentScope = await prisma.hodBatchScope.findFirst({
        where: {
          batchId,
          semesterId,
          facultyId,
        },
      });

      if (!currentScope) {
        await prisma.hodBatchScope.create({
          data: {
            facultyId,
            batchId,
            semesterId,
            academicYearId: semester.academicYearId,
          },
        });
      }

      assigned.push({ hodId: facultyId, batchCode: batch.code });
    }

    return { assigned };
  }
}
