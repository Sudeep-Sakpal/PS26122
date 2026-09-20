import { Schema, model, type InferSchemaType } from "mongoose";

// Mirrors the frontend's ProjectStatus union (src/types/index.ts).
export const PROJECT_STATUSES = [
  "on-track",
  "at-risk",
  "delayed",
  "completed",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

const ProjectSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true,
    },
    location: { type: String, required: true, trim: true },
    sector: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: PROJECT_STATUSES,
      default: "on-track",
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    budgetUtilized: { type: Number, min: 0, max: 100, default: 0 },
    contractor: { type: String, required: true, trim: true },
    // Overall physical progress, 0-100. Recomputed from schedule activities
    // in later milestones; stored directly for now.
    progress: { type: Number, min: 0, max: 100, default: 0 },
  },
  { timestamps: true }
);

export type ProjectDoc = InferSchemaType<typeof ProjectSchema>;

export const Project = model("Project", ProjectSchema);
