import { Router } from "express";

import { assignHodScope } from "../controllers/admin.controller.js";
import { asyncHandler } from "../utils/http.js";

export const adminRouter = Router();

adminRouter.post("/hod-scope", asyncHandler(assignHodScope));
