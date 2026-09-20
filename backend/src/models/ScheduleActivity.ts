import { Schema, model, Types, type InferSchemaType } from "mongoose";

// Mirrors the frontend's ActivityStatus union (src/types/index.ts).
export const ACTIVITY_STATUSES = [
  "not-started",
  "in-progress",
  "completed",
  "delayed",
  "at-risk",
  "blocked",
] as const;
export type ActivityStatus = (typeof ACTIVITY_STATUSES)[number];

const ScheduleActivitySchema = new Schema(
  {
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    // Position of this stage within the project's critical path
    // (e.g. Foundation=1, Pillars=2, Beams=3, Road Surface=4, Drainage=5).
    sequence: { type: Number, required: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    owner: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ACTIVITY_STATUSES,
      default: "not-started",
    },
    planned: { type: Number, min: 0, max: 100, default: 0 },
    actual: { type: Number, min: 0, max: 100, default: 0 },
    plannedStart: { type: Date, required: true },
    plannedEnd: { type: Date, required: true },
    actualStart: { type: Date },
    actualEnd: { type: Date },
    delayDays: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ScheduleActivitySchema.index({ project: 1, code: 1 }, { unique: true });

export type ScheduleActivityDoc = InferSchemaType<typeof ScheduleActivitySchema> & {
  _id: Types.ObjectId;
};

export const ScheduleActivity = model("ScheduleActivity", ScheduleActivitySchema);
