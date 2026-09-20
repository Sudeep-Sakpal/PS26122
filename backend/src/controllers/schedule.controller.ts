import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { mongoIdSchema } from "../validation/project.validation";
import * as scheduleService from "../services/schedule.service";

export const importSchedule = asyncHandler(async (req: Request, res: Response) => {
  const idResult = mongoIdSchema.safeParse(req.params.id);
  if (!idResult.success) throw ApiError.badRequest("Invalid project id");

  if (!req.file) {
    throw ApiError.badRequest("No file uploaded. Attach an .xlsx file under field \"file\".");
  }

  const result = await scheduleService.importScheduleFromXlsx(
    idResult.data,
    req.file.buffer
  );

  res.status(201).json({ success: true, data: result });
});
