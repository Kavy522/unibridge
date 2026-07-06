import type { Request, Response } from "express";
import { z } from "zod";

import { AdminService } from "../services/admin.service.js";

const requestSchema = z.object({
  facultyId: z.string().min(1),
  batchIds: z.array(z.string().min(1)).min(1),
  semesterId: z.string().min(1),
});

const adminService = new AdminService();

export function assignHodScope(req: Request, res: Response) {
  const payload = requestSchema.parse(req.body);
  const result = adminService.assignHodScope(payload.facultyId, payload.batchIds, payload.semesterId);
  return res.status(201).json(result);
}
