import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { mongoIdSchema } from "../validation/project.validation";
import * as projectService from "../services/project.service";
import * as reportService from "../services/report.service";

export const uploadReportHandler = asyncHandler(async (req: Request, res: Response) => {
  const idResult = mongoIdSchema.safeParse(req.params.id);
  if (!idResult.success) throw ApiError.badRequest("Invalid project id");

  if (!req.file) {
    throw ApiError.badRequest(
      'No file uploaded. Attach a .txt, .pdf, or .xlsx file under field "file".'
    );
  }

  const result = await reportService.ingestReport(idResult.data, req.file);
  res.status(201).json({ success: true, data: result });
});

export const getProjectReportsHandler = asyncHandler(async (req: Request, res: Response) => {
  const idResult = mongoIdSchema.safeParse(req.params.id);
  if (!idResult.success) throw ApiError.badRequest("Invalid project id");

  await projectService.requireProjectExists(idResult.data);
  const result = await reportService.listReportsForProject(idResult.data);

  res.status(200).json({
    success: true,
    count: result.reports.length,
    data: result,
  });
});
