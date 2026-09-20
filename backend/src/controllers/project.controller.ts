import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { createProjectSchema, mongoIdSchema } from "../validation/project.validation";
import * as projectService from "../services/project.service";

export const getProjects = asyncHandler(async (_req: Request, res: Response) => {
  const projects = await projectService.listProjects();
  res.status(200).json({ success: true, count: projects.length, data: projects });
});

export const createProject = asyncHandler(async (req: Request, res: Response) => {
  const parsed = createProjectSchema.safeParse(req.body);
  if (!parsed.success) throw parsed.error;

  const project = await projectService.createProject(parsed.data);
  res.status(201).json({ success: true, data: project });
});

export const getProjectById = asyncHandler(async (req: Request, res: Response) => {
  const idResult = mongoIdSchema.safeParse(req.params.id);
  if (!idResult.success) throw ApiError.badRequest("Invalid project id");

  const project = await projectService.getProjectById(idResult.data);
  res.status(200).json({ success: true, data: project });
});
