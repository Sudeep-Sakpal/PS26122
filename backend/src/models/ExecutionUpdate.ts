import { Schema, model, Types, type InferSchemaType } from "mongoose";

// Deterministic schedule-matching methods, in the order B3's matching
// service attempts them (see services/scheduleMatching.service.ts).
export const MATCH_METHODS = ["exact-code", "exact-name", "keyword", "fuzzy"] as const;
export type MatchMethod = (typeof MATCH_METHODS)[number];

// One structured field-progress update extracted from a Report (B2). The
// activityName/activityCode/status fields stay loosely typed (free text
// from extraction) — the link* fields below are B3's addition: the result
// of deterministically matching this update to a real ScheduleActivity.
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

    // --- B3: schedule-link result -----------------------------------
    linkedActivity: {
      type: Schema.Types.ObjectId,
      ref: "ScheduleActivity",
      index: true,
    },
    // 0-100, distinct from extractionConfidence (0-1) — how confident the
    // deterministic matcher is that linkedActivity is correct.
    matchConfidence: { type: Number, min: 0, max: 100 },
    matchMethod: { type: String, enum: MATCH_METHODS },
    matchedAt: { type: Date },
  },
  { timestamps: true }
);

ExecutionUpdateSchema.index({ project: 1, updateDate: -1 });

export type ExecutionUpdateDoc = InferSchemaType<typeof ExecutionUpdateSchema> & {
  _id: Types.ObjectId;
};

export const ExecutionUpdate = model("ExecutionUpdate", ExecutionUpdateSchema);
