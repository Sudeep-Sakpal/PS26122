import { Types } from "mongoose";
import { Report } from "../models/Report";
import { ExecutionUpdate } from "../models/ExecutionUpdate";
import { requireProjectExists } from "./project.service";
import { detectReportFileType, extractDocumentText } from "./documentExtraction";
import { runExtraction } from "./extraction";
import { extractionCandidateSchema } from "../validation/report.validation";
import { ApiError } from "../utils/ApiError";

const MAX_STORED_TEXT_LENGTH = 20_000;

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}\n…[truncated]` : text;
}

export interface UploadedReportFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export async function ingestReport(projectId: string, file: UploadedReportFile) {
  await requireProjectExists(projectId);
  const project = new Types.ObjectId(projectId);

  const fileType = detectReportFileType(file.originalname, file.mimetype);
  if (!fileType) {
    throw ApiError.badRequest("Only .txt, .pdf, or .xlsx report files are accepted");
  }

  let extractedText: string;
  try {
    extractedText = await extractDocumentText(file.buffer, fileType);
  } catch (err) {
    await Report.create({
      project,
      fileName: file.originalname,
      fileType,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      status: "failed",
      errorMessage: err instanceof Error ? err.message : "Could not read the document",
    });
    if (err instanceof ApiError) throw err;
    throw ApiError.badRequest("Could not read the uploaded document");
  }

  if (!extractedText || extractedText.trim().length === 0) {
    await Report.create({
      project,
      fileName: file.originalname,
      fileType,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      status: "failed",
      errorMessage: "No readable text content found in the document",
    });
    throw ApiError.badRequest("The uploaded document has no readable content");
  }

  const extraction = await runExtraction(extractedText);

  const report = await Report.create({
    project,
    fileName: file.originalname,
    fileType,
    mimeType: file.mimetype,
    sizeBytes: file.size,
    extractedText: truncate(extractedText, MAX_STORED_TEXT_LENGTH),
    extractionMethod: extraction.provider,
    status: extraction.candidates.length > 0 ? "processed" : "no-data",
  });

  const executionUpdates = [];
  const warnings = [...extraction.warnings];

  for (const candidate of extraction.candidates) {
    const parsed = extractionCandidateSchema.safeParse(candidate);
    if (!parsed.success) {
      warnings.push(
        `Skipped an extracted update: ${parsed.error.issues
          .map((i) => `${i.path.join(".") || "value"}: ${i.message}`)
          .join("; ")}`
      );
      continue;
    }

    const doc = await ExecutionUpdate.create({
      project,
      source: report._id,
      activityName: parsed.data.activityName,
      activityCode: parsed.data.activityCode,
      updateDate: parsed.data.updateDate,
      actualProgress: parsed.data.actualProgress,
      status: parsed.data.status,
      reason: parsed.data.reason,
      remarks: parsed.data.remarks,
      extractedText:
        typeof candidate.sourceSnippet === "string" ? candidate.sourceSnippet : undefined,
      extractionConfidence: parsed.data.confidence,
    });
    executionUpdates.push(doc);
  }

  if (executionUpdates.length === 0 && report.status === "processed") {
    report.status = "no-data";
    await report.save();
  }

  return {
    report,
    executionUpdates,
    extraction: { provider: extraction.provider, warnings },
  };
}

export async function listReportsForProject(projectId: string) {
  const project = new Types.ObjectId(projectId);

  const [reports, executionUpdates] = await Promise.all([
    Report.find({ project }).sort({ createdAt: -1 }).lean(),
    ExecutionUpdate.find({ project }).sort({ createdAt: -1 }).lean(),
  ]);

  const updatesByReport = new Map<string, typeof executionUpdates>();
  for (const update of executionUpdates) {
    const key = update.source.toString();
    const list = updatesByReport.get(key) ?? [];
    list.push(update);
    updatesByReport.set(key, list);
  }

  const reportsWithUpdates = reports.map((r) => ({
    ...r,
    executionUpdates: updatesByReport.get(r._id.toString()) ?? [],
  }));

  return { reports: reportsWithUpdates, executionUpdates };
}
