import { Router } from "express";

import { portalService } from "../services/portal.service.js";
import { asyncHandler } from "../utils/http.js";

function str(value: unknown) {
  return Array.isArray(value) ? String(value[0] ?? "") : String(value ?? "");
}

// University (Dean) portal — mounted at /admin with requireAuth + requireSuperAdmin.
export const adminRouter = Router();

adminRouter.get("/overview", asyncHandler(async (req, res) => res.json(await portalService.uniOverview(req.user!.universityId))));

// Academic structure
adminRouter.get("/years", asyncHandler(async (req, res) => res.json(await portalService.uniYears(req.user!.universityId))));
adminRouter.post("/years", asyncHandler(async (req, res) => res.json(await portalService.uniCreateYear(req.user!.universityId, req.body))));
adminRouter.post("/years/:id/activate", asyncHandler(async (req, res) => res.json(await portalService.uniActivateYear(req.user!.universityId, str(req.params.id)))));
adminRouter.post("/semesters", asyncHandler(async (req, res) => res.json(await portalService.uniCreateSemester(req.user!.universityId, req.body))));
adminRouter.post("/semesters/:id/activate", asyncHandler(async (req, res) => res.json(await portalService.uniActivateSemester(req.user!.universityId, str(req.params.id)))));
adminRouter.post("/batches", asyncHandler(async (req, res) => res.json(await portalService.uniCreateBatch(req.user!.universityId, req.body))));

// HODs
adminRouter.get("/hods", asyncHandler(async (req, res) => res.json(await portalService.uniHods(req.user!.universityId))));
adminRouter.post("/hods/:facultyId/toggle", asyncHandler(async (req, res) => res.json(await portalService.uniSetHod(req.user!.universityId, str(req.params.facultyId), Boolean(req.body.isHod)))));
adminRouter.post("/hod-scope", asyncHandler(async (req, res) => res.json(await portalService.uniAssignHodScope(req.user!.universityId, String(req.body.facultyId), String(req.body.batchId)))));
adminRouter.delete("/hod-scope/:batchId", asyncHandler(async (req, res) => res.json(await portalService.uniRemoveHodScope(req.user!.universityId, str(req.params.batchId)))));

// Faculty
adminRouter.get("/faculty", asyncHandler(async (req, res) => res.json(await portalService.uniFaculty(req.user!.universityId, req.query.search as string | undefined, Number(req.query.page ?? 1), Number(req.query.limit ?? 20)))));
adminRouter.post("/faculty", asyncHandler(async (req, res) => res.json(await portalService.register(req.body, req.user!.universityId))));
adminRouter.patch("/faculty/:id/active", asyncHandler(async (req, res) => res.json(await portalService.uniSetFacultyActive(req.user!.universityId, str(req.params.id), Boolean(req.body.isActive)))));

// Students
adminRouter.get("/students", asyncHandler(async (req, res) => res.json(await portalService.uniStudents(req.user!.universityId, { search: req.query.search as string | undefined, branch: req.query.branch as string | undefined, page: Number(req.query.page ?? 1), limit: Number(req.query.limit ?? 20) }))));
adminRouter.post("/students", asyncHandler(async (req, res) => res.json(await portalService.register({ ...req.body, role: "STUDENT" }, req.user!.universityId))));
adminRouter.patch("/students/:id/active", asyncHandler(async (req, res) => res.json(await portalService.uniSetStudentActive(req.user!.universityId, str(req.params.id), Boolean(req.body.isActive)))));

// Branches — the universal list; student branches must come from here
adminRouter.get("/branches", asyncHandler(async (req, res) => res.json(await portalService.uniBranches(req.user!.universityId))));
adminRouter.post("/branches", asyncHandler(async (req, res) => res.status(201).json(await portalService.addUniversityBranch(req.user!.universityId, String(req.body.code).trim().toUpperCase(), String(req.body.name)))));
adminRouter.delete("/branches/:id", asyncHandler(async (req, res) => res.json(await portalService.uniDeleteBranch(req.user!.universityId, str(req.params.id)))));

// Settings
adminRouter.get("/settings", asyncHandler(async (req, res) => res.json(await portalService.uniSettings(req.user!.universityId))));
adminRouter.put("/settings", asyncHandler(async (req, res) => res.json(await portalService.uniUpdateSettings(req.user!.universityId, req.body))));
