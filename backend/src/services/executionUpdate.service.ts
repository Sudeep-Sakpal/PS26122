import { Types } from "mongoose";
import { ExecutionUpdate } from "../models/ExecutionUpdate";
import { requireProjectExists } from "./project.service";
import { matchExecutionUpdateToActivity, type MatchOutcome } from "./scheduleMatching.service";
import { ApiError } from "../utils/ApiError";
import { toExecutionUpdateJSON } from "../utils/serializers";

export async function listExecutionUpdatesForProject(projectId: string) {
  const updates = await ExecutionUpdate.find({ project: new Types.ObjectId(projectId) })
    .sort({ updateDate: -1, createdAt: -1 })
    .populate("linkedActivity", "code name sequence")
    .lean();

  return updates.map(toExecutionUpdateJSON);
}

/** Fetches an execution update scoped to a project in one query, so a
 * valid id belonging to a different project reads as "not found here"
 * rather than leaking that it exists elsewhere. */
export async function getExecutionUpdateForProject(projectId: string, updateId: string) {
  const update = await ExecutionUpdate.findOne({
    _id: updateId,
    project: new Types.ObjectId(projectId),
  });
  if (!update) {
    throw ApiError.notFound(
      `Execution update ${updateId} not found for project ${projectId}`
    );
  }
  return update;
}

async function applyMatch(update: InstanceType<typeof ExecutionUpdate>, outcome: MatchOutcome) {
  if (!outcome.matched) return;
  update.linkedActivity = new Types.ObjectId(outcome.activityId);
  update.matchConfidence = outcome.confidence;
  update.matchMethod = outcome.matchMethod;
  update.matchedAt = new Date();
  await update.save();
}

/**
 * Links a single execution update to its schedule activity. Idempotent:
 * re-running it re-evaluates the same deterministic rules against the
 * same data and simply reconfirms (or updates) the link — it never
 * errors just because a link already exists, and never creates a
 * second/duplicate link record since the result lives on the update
 * document itself.
 */
export async function linkExecutionUpdate(projectId: string, updateId: string) {
  await requireProjectExists(projectId);
  const update = await getExecutionUpdateForProject(projectId, updateId);

  const outcome = await matchExecutionUpdateToActivity(projectId, update);
  await applyMatch(update, outcome);

  return { executionUpdate: toExecutionUpdateJSON(update), match: outcome };
}

export interface LinkAllSummary {
  attempted: number;
  linked: number;
  unmatched: number;
  results: Array<{ executionUpdateId: string; match: MatchOutcome }>;
}

/** Links every execution update in the project that doesn't already have
 * a linkedActivity. Already-linked updates are left untouched. */
export async function linkAllUnmatchedForProject(projectId: string): Promise<LinkAllSummary> {
  await requireProjectExists(projectId);
  const project = new Types.ObjectId(projectId);

  const pending = await ExecutionUpdate.find({
    project,
    linkedActivity: { $exists: false },
  });

  const results: LinkAllSummary["results"] = [];
  for (const update of pending) {
    const outcome = await matchExecutionUpdateToActivity(projectId, update);
    await applyMatch(update, outcome);
    results.push({ executionUpdateId: update._id.toString(), match: outcome });
  }

  return {
    attempted: results.length,
    linked: results.filter((r) => r.match.matched).length,
    unmatched: results.filter((r) => !r.match.matched).length,
    results,
  };
}
