import { Types } from "mongoose";
import { ScheduleActivity } from "../models/ScheduleActivity";
import { Dependency } from "../models/Dependency";
import { Report } from "../models/Report";
import { compareActivity } from "./comparison.service";
import { ApiError } from "../utils/ApiError";

// Returns activities scoped to a project, each annotated with a
// `dependsOn` array of predecessor activity ids — shaped to match the
// frontend's ScheduleActivity.dependsOn concept (src/types/index.ts),
// even though the two are normalized into separate collections here.
export async function listActivitiesByProject(projectId: string) {
  const project = new Types.ObjectId(projectId);

  const [activities, dependencies] = await Promise.all([
    ScheduleActivity.find({ project }).sort({ sequence: 1 }).lean(),
    Dependency.find({ project }).lean(),
  ]);

  const dependsOnByActivity = new Map<string, string[]>();
  for (const dep of dependencies) {
    const key = dep.activity.toString();
    const list = dependsOnByActivity.get(key) ?? [];
    list.push(dep.dependsOn.toString());
    dependsOnByActivity.set(key, list);
  }

  return activities.map((activity) => ({
    ...activity,
    dependsOn: dependsOnByActivity.get(activity._id.toString()) ?? [],
  }));
}

/** Fetches one activity scoped to a project, same "not found here rather
 * than elsewhere" reasoning as executionUpdate.service.ts. */
export async function getActivityForProject(projectId: string, activityId: string) {
  const activity = await ScheduleActivity.findOne({
    _id: activityId,
    project: new Types.ObjectId(projectId),
  });
  if (!activity) {
    throw ApiError.notFound(`Activity ${activityId} not found for project ${projectId}`);
  }
  return activity;
}

// B3: the full activity view — identity + planned schedule (B1) merged
// with the deterministic planned-vs-actual/delay result (comparison
// service) and, when linked, which report that came from. No
// dependency/risk propagation here — that's B4.
export async function getActivityDetail(projectId: string, activityId: string) {
  const activity = await getActivityForProject(projectId, activityId);

  const [dependsOn, comparison] = await Promise.all([
    Dependency.find({ activity: activity._id }).select("dependsOn").lean(),
    compareActivity(activity),
  ]);

  const sourceReport = comparison.linkedExecutionUpdate
    ? await Report.findById(comparison.linkedExecutionUpdate.source)
        .select("fileName fileType extractionMethod createdAt")
        .lean()
    : null;

  return {
    activity: {
      _id: activity._id,
      project: activity.project,
      sequence: activity.sequence,
      code: activity.code,
      name: activity.name,
      owner: activity.owner,
      status: activity.status,
      plannedStart: activity.plannedStart,
      plannedEnd: activity.plannedEnd,
      actualStart: activity.actualStart,
      actualEnd: activity.actualEnd,
      delayDays: activity.delayDays,
      dependsOn: dependsOn.map((d) => d.dependsOn.toString()),
    },
    comparison,
    source: sourceReport,
  };
}
