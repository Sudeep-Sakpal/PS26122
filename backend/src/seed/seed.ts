import { Types } from "mongoose";
import { connectDB, disconnectDB } from "../config/db";
import { Project } from "../models/Project";
import { ScheduleActivity } from "../models/ScheduleActivity";
import { Dependency } from "../models/Dependency";
import { seedActivities, seedProject } from "./data";

async function resetExistingDemoProject() {
  const existing = await Project.findOne({ code: seedProject.code });
  if (!existing) return;

  console.log(`[seed] removing existing demo data for ${seedProject.code}`);
  await Dependency.deleteMany({ project: existing._id });
  await ScheduleActivity.deleteMany({ project: existing._id });
  await Project.deleteOne({ _id: existing._id });
}

async function seed() {
  await connectDB();

  await resetExistingDemoProject();

  const project = await Project.create(seedProject);

  const codeToId = new Map<string, Types.ObjectId>();
  for (const activity of seedActivities) {
    const { dependsOn: _dependsOn, ...rest } = activity;
    const doc = await ScheduleActivity.create({ ...rest, project: project._id });
    codeToId.set(activity.code, doc._id);
  }

  let dependencyCount = 0;
  for (const activity of seedActivities) {
    const activityId = codeToId.get(activity.code);
    if (!activityId) continue;

    for (const depCode of activity.dependsOn) {
      const dependsOnId = codeToId.get(depCode);
      if (!dependsOnId) continue;
      await Dependency.create({
        project: project._id,
        activity: activityId,
        dependsOn: dependsOnId,
      });
      dependencyCount += 1;
    }
  }

  console.log(
    `[seed] created project "${project.name}" (${project.code}) with ${seedActivities.length} activities and ${dependencyCount} dependencies`
  );
}

seed()
  .then(() => disconnectDB())
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[seed] failed:", err);
    process.exit(1);
  });
