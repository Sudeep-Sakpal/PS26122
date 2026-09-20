import { Schema, model, type InferSchemaType } from "mongoose";

// One edge per predecessor relationship: `activity` cannot proceed until
// `dependsOn` is done. Mirrors the frontend's ScheduleActivity.dependsOn
// array, normalized into its own collection as requested for B1.
const DependencySchema = new Schema(
  {
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    activity: {
      type: Schema.Types.ObjectId,
      ref: "ScheduleActivity",
      required: true,
    },
    dependsOn: {
      type: Schema.Types.ObjectId,
      ref: "ScheduleActivity",
      required: true,
    },
  },
  { timestamps: true }
);

DependencySchema.index({ activity: 1, dependsOn: 1 }, { unique: true });

export type DependencyDoc = InferSchemaType<typeof DependencySchema>;

export const Dependency = model("Dependency", DependencySchema);
