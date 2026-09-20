import { Types } from "mongoose";
import { ScheduleActivity } from "../models/ScheduleActivity";
import { Dependency } from "../models/Dependency";
import { requireProjectExists } from "./project.service";
import { parseScheduleWorkbook, type RawScheduleRow } from "./xlsxParser";
import { scheduleRowSchema, type ScheduleRowInput } from "../validation/schedule.validation";
import { ApiError } from "../utils/ApiError";

interface RowIssue {
  row: number; // 1-indexed spreadsheet row, header included
  message: string;
}

function normalizeStatus(value: unknown): unknown {
  if (typeof value !== "string") return value;
  return value.trim().toLowerCase().replace(/\s+/g, "-");
}

function splitDependsOn(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value !== "string" || value.trim() === "") return [];
  return value
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function toCandidate(raw: RawScheduleRow): Record<string, unknown> {
  return {
    ...raw,
    status: normalizeStatus(raw.status),
    dependsOn: splitDependsOn(raw.dependsOn),
  };
}

async function resolveActivityId(
  project: Types.ObjectId,
  code: string,
  cache: Map<string, Types.ObjectId>
): Promise<Types.ObjectId | null> {
  const upper = code.toUpperCase();
  const cached = cache.get(upper);
  if (cached) return cached;

  const existing = await ScheduleActivity.findOne({ project, code: upper })
    .select("_id")
    .lean();
  if (existing) {
    cache.set(upper, existing._id);
    return existing._id;
  }
  return null;
}

export interface ScheduleImportResult {
  projectId: string;
  importedCount: number;
  activities: unknown[];
  rowIssues: RowIssue[];
}

export async function importScheduleFromXlsx(
  projectId: string,
  buffer: Buffer
): Promise<ScheduleImportResult> {
  await requireProjectExists(projectId);

  const rawRows = await parseScheduleWorkbook(buffer);
  if (rawRows.length === 0) {
    throw ApiError.badRequest("The uploaded file has no schedule rows");
  }

  const rowIssues: RowIssue[] = [];
  const validRows: ScheduleRowInput[] = [];

  rawRows.forEach((raw, index) => {
    const rowNumber = index + 2; // +1 for header, +1 for 1-indexing
    const result = scheduleRowSchema.safeParse(toCandidate(raw));
    if (!result.success) {
      const message = result.error.issues
        .map((issue) => `${issue.path.join(".") || "value"}: ${issue.message}`)
        .join("; ");
      rowIssues.push({ row: rowNumber, message });
      return;
    }
    validRows.push(result.data);
  });

  if (validRows.length === 0) {
    throw ApiError.badRequest("No valid schedule rows found in the file", rowIssues);
  }

  const project = new Types.ObjectId(projectId);
  const codeToId = new Map<string, Types.ObjectId>();
  const activities = [];

  for (const row of validRows) {
    const code = row.code.toUpperCase();
    const doc = await ScheduleActivity.findOneAndUpdate(
      { project, code },
      {
        project,
        sequence: row.sequence,
        code,
        name: row.name,
        owner: row.owner,
        status: row.status,
        planned: row.planned,
        actual: row.actual,
        plannedStart: row.plannedStart,
        plannedEnd: row.plannedEnd,
        actualStart: row.actualStart,
        actualEnd: row.actualEnd,
        delayDays: row.delayDays,
      },
      { upsert: true, new: true, runValidators: true }
    );
    codeToId.set(code, doc._id);
    activities.push(doc);
  }

  for (const row of validRows) {
    if (row.dependsOn.length === 0) continue;

    const activityId = codeToId.get(row.code.toUpperCase());
    if (!activityId) continue;

    await Dependency.deleteMany({ activity: activityId });

    for (const depCode of row.dependsOn) {
      const dependsOnId = await resolveActivityId(project, depCode, codeToId);
      if (!dependsOnId) {
        rowIssues.push({
          row: 0,
          message: `Activity "${row.code}" depends on unknown code "${depCode}" — skipped`,
        });
        continue;
      }
      if (dependsOnId.equals(activityId)) {
        rowIssues.push({
          row: 0,
          message: `Activity "${row.code}" cannot depend on itself — skipped`,
        });
        continue;
      }
      await Dependency.updateOne(
        { activity: activityId, dependsOn: dependsOnId },
        { $set: { project, activity: activityId, dependsOn: dependsOnId } },
        { upsert: true }
      );
    }
  }

  return {
    projectId,
    importedCount: activities.length,
    activities,
    rowIssues,
  };
}
