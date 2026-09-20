import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { mongoIdSchema } from "../validation/project.validation";
import * as dashboardService from "../services/dashboard.service";

export const getProjectDashboardHandler = asyncHandler(async (req: Request, res: Response) => {
  const idResult = mongoIdSchema.safeParse(req.params.id);
  if (!idResult.success) throw ApiError.badRequest("Invalid project id");

  const dashboard = await dashboardService.getProjectDashboard(idResult.data);
  res.status(200).json({ success: true, data: dashboard });
});
