import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { mongoIdSchema } from "../validation/project.validation";
import * as projectService from "../services/project.service";
import * as activityService from "../services/activity.service";

export const getProjectActivities = asyncHandler(async (req: Request, res: Response) => {
  const idResult = mongoIdSchema.safeParse(req.params.id);
  if (!idResult.success) throw ApiError.badRequest("Invalid project id");

  await projectService.requireProjectExists(idResult.data);
  const activities = await activityService.listActivitiesByProject(idResult.data);

  res.status(200).json({ success: true, count: activities.length, data: activities });
});
