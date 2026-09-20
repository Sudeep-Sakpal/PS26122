import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { mongoIdSchema } from "../validation/project.validation";
import * as projectService from "../services/project.service";
import * as executionUpdateService from "../services/executionUpdate.service";

function requireValidId(raw: unknown, label: string): string {
  const result = mongoIdSchema.safeParse(raw);
  if (!result.success) throw ApiError.badRequest(`Invalid ${label}`);
  return result.data;
}

export const getProjectExecutionUpdatesHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const projectId = requireValidId(req.params.id, "project id");
    await projectService.requireProjectExists(projectId);

    const updates = await executionUpdateService.listExecutionUpdatesForProject(projectId);
    res.status(200).json({ success: true, count: updates.length, data: updates });
  }
);

export const linkExecutionUpdateHandler = asyncHandler(async (req: Request, res: Response) => {
  const projectId = requireValidId(req.params.id, "project id");
  const updateId = requireValidId(req.params.updateId, "execution update id");

  const result = await executionUpdateService.linkExecutionUpdate(projectId, updateId);
  res.status(200).json({ success: true, data: result });
});

export const linkAllUnmatchedHandler = asyncHandler(async (req: Request, res: Response) => {
  const projectId = requireValidId(req.params.id, "project id");

  const result = await executionUpdateService.linkAllUnmatchedForProject(projectId);
  res.status(200).json({ success: true, data: result });
});
