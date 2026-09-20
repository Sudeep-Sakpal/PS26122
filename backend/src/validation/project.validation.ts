import { z } from "zod";
import { PROJECT_STATUSES } from "../models/Project";

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, "name is required"),
  code: z.string().trim().min(1, "code is required"),
  location: z.string().trim().min(1, "location is required"),
  sector: z.string().trim().min(1, "sector is required"),
  status: z.enum(PROJECT_STATUSES).optional().default("on-track"),
  startDate: z.coerce.date({ error: "startDate must be a valid date" }),
  endDate: z.coerce.date({ error: "endDate must be a valid date" }),
  budgetUtilized: z.coerce.number().min(0).max(100).optional().default(0),
  contractor: z.string().trim().min(1, "contractor is required"),
  progress: z.coerce.number().min(0).max(100).optional().default(0),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const mongoIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "must be a valid identifier");
