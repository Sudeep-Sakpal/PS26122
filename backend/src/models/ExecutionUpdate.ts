import { Schema, model, Types, type InferSchemaType } from "mongoose";

// One structured field-progress update extracted from a Report. This is
// intentionally loosely typed (e.g. `status` is free text, not the
// ScheduleActivity enum) — matching it against real schedule activities
// and computing variance/status is B3's job, not this one's.
const ExecutionUpdateSchema = new Schema(
  {
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    // The report this update was extracted from.
    source: {
      type: Schema.Types.ObjectId,
      ref: "Report",
      required: true,
      index: true,
    },
    activityName: { type: String, required: true, trim: true },
    activityCode: { type: String, trim: true },
    updateDate: { type: Date, required: true },
    actualProgress: { type: Number, required: true, min: 0, max: 100 },
    status: { type: String, trim: true },
    reason: { type: String, trim: true, default: "" },
    remarks: { type: String, trim: true },
    // The snippet of source text this update was derived from.
    extractedText: { type: String },
    extractionConfidence: { type: Number, min: 0, max: 1, default: 0.5 },
  },
  { timestamps: true }
);

ExecutionUpdateSchema.index({ project: 1, updateDate: -1 });

export type ExecutionUpdateDoc = InferSchemaType<typeof ExecutionUpdateSchema> & {
  _id: Types.ObjectId;
};

export const ExecutionUpdate = model("ExecutionUpdate", ExecutionUpdateSchema);
