import { z } from "zod";
import { ACTIVITY_STATUSES } from "../models/ScheduleActivity";

export const scheduleRowSchema = z.object({
  sequence: z.coerce.number().int().positive(),
  code: z.string().trim().min(1, "code is required"),
  name: z.string().trim().min(1, "name is required"),
  owner: z.string().trim().min(1, "owner is required"),
  status: z.enum(ACTIVITY_STATUSES).optional().default("not-started"),
  planned: z.coerce.number().min(0).max(100).optional().default(0),
  actual: z.coerce.number().min(0).max(100).optional().default(0),
  plannedStart: z.coerce.date({ error: "plannedStart must be a valid date" }),
  plannedEnd: z.coerce.date({ error: "plannedEnd must be a valid date" }),
  actualStart: z.coerce.date().optional(),
  actualEnd: z.coerce.date().optional(),
  delayDays: z.coerce.number().optional().default(0),
  dependsOn: z.array(z.string().trim().min(1)).optional().default([]),
});

export type ScheduleRowInput = z.infer<typeof scheduleRowSchema>;
