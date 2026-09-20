import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { mongoIdSchema } from "../validation/project.validation";
import * as projectService from "../services/project.service";
import * as riskEngine from "../services/riskEngine.service";
import { listDependencyEdges } from "../services/dependencyGraph.service";

function requireValidId(raw: unknown, label: string): string {
  const result = mongoIdSchema.safeParse(raw);
  if (!result.success) throw ApiError.badRequest(`Invalid ${label}`);
  return result.data;
}

export const getProjectRisksHandler = asyncHandler(async (req: Request, res: Response) => {
  const projectId = requireValidId(req.params.id, "project id");
  await projectService.requireProjectExists(projectId);

  const risks = await riskEngine.getProjectRisks(projectId);
  res.status(200).json({ success: true, count: risks.length, data: { risks } });
});

export const getActivityImpactHandler = asyncHandler(async (req: Request, res: Response) => {
  const projectId = requireValidId(req.params.id, "project id");
  const activityId = requireValidId(req.params.activityId, "activity id");
  await projectService.requireProjectExists(projectId);

  const impact = await riskEngine.getActivityImpact(projectId, activityId);
  res.status(200).json({ success: true, data: impact });
});

// Optional debug/demo endpoint: the raw stored dependency edges, so the
// risk engine's traversal can be sanity-checked against what's actually
// in MongoDB rather than taken on faith.
export const getProjectDependenciesHandler = asyncHandler(async (req: Request, res: Response) => {
  const projectId = requireValidId(req.params.id, "project id");
  await projectService.requireProjectExists(projectId);

  const edges = await listDependencyEdges(projectId);
  res.status(200).json({ success: true, count: edges.length, data: edges });
});
