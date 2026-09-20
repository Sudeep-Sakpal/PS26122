import { Schema, model, Types, type InferSchemaType } from "mongoose";

// A single uploaded execution/site-progress document. The binary file
// itself is not persisted (no S3/Cloudinary for this prototype) — only
// its metadata and the text extracted from it.
export const REPORT_FILE_TYPES = ["txt", "pdf", "xlsx"] as const;
export type ReportFileType = (typeof REPORT_FILE_TYPES)[number];

export const REPORT_STATUSES = ["processed", "no-data", "failed"] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const EXTRACTION_METHODS = ["demo", "openai", "anthropic"] as const;
export type ExtractionMethod = (typeof EXTRACTION_METHODS)[number];

const ReportSchema = new Schema(
  {
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    fileName: { type: String, required: true, trim: true },
    fileType: { type: String, enum: REPORT_FILE_TYPES, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    // Raw text pulled from the document, capped so a large PDF/XLSX
    // doesn't bloat the collection. Kept for traceability and reuse by B3.
    extractedText: { type: String, default: "" },
    extractionMethod: { type: String, enum: EXTRACTION_METHODS },
    status: {
      type: String,
      enum: REPORT_STATUSES,
      default: "processed",
    },
    errorMessage: { type: String },
  },
  { timestamps: true }
);

export type ReportDoc = InferSchemaType<typeof ReportSchema> & {
  _id: Types.ObjectId;
};

export const Report = model("Report", ReportSchema);
