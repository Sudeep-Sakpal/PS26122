import { Types } from "mongoose";
import { ScheduleActivity } from "../models/ScheduleActivity";
import { Dependency } from "../models/Dependency";

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
