import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { mongoIdSchema } from "../validation/project.validation";
import * as projectService from "../services/project.service";
import * as activityService from "../services/activity.service";
import { compareActivity } from "../services/comparison.service";

function requireValidId(raw: unknown, label: string): string {
  const result = mongoIdSchema.safeParse(raw);
  if (!result.success) throw ApiError.badRequest(`Invalid ${label}`);
  return result.data;
}

export const getProjectActivities = asyncHandler(async (req: Request, res: Response) => {
  const idResult = mongoIdSchema.safeParse(req.params.id);
  if (!idResult.success) throw ApiError.badRequest("Invalid project id");

  await projectService.requireProjectExists(idResult.data);
  const activities = await activityService.listActivitiesByProject(idResult.data);

  res.status(200).json({ success: true, count: activities.length, data: activities });
});

// B3: activity identity + planned schedule + planned-vs-actual/delay,
// merged from the matched execution update (if any).
export const getActivityByIdHandler = asyncHandler(async (req: Request, res: Response) => {
  const projectId = requireValidId(req.params.id, "project id");
  const activityId = requireValidId(req.params.activityId, "activity id");

  await projectService.requireProjectExists(projectId);
  const detail = await activityService.getActivityDetail(projectId, activityId);

  res.status(200).json({ success: true, data: detail });
});

export const getActivityComparisonHandler = asyncHandler(async (req: Request, res: Response) => {
  const projectId = requireValidId(req.params.id, "project id");
  const activityId = requireValidId(req.params.activityId, "activity id");

  await projectService.requireProjectExists(projectId);
  const activity = await activityService.getActivityForProject(projectId, activityId);
  const comparison = await compareActivity(activity);

  res.status(200).json({ success: true, data: comparison });
});
