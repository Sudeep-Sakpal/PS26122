import type { ReportFileType } from "../../models/Report";
import { extractTxtText } from "./txtExtractor";
import { extractPdfText } from "./pdfExtractor";
import { extractXlsxText } from "./xlsxExtractor";

const XLSX_MIME_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
]);

// Extension takes priority since browsers/tools send inconsistent mime
// types (esp. application/octet-stream); mime type is the fallback.
export function detectReportFileType(
  originalName: string,
  mimeType: string
): ReportFileType | null {
  const ext = originalName.toLowerCase().split(".").pop();
  if (ext === "txt") return "txt";
  if (ext === "pdf") return "pdf";
  if (ext === "xlsx") return "xlsx";

  if (mimeType === "text/plain") return "txt";
  if (mimeType === "application/pdf") return "pdf";
  if (XLSX_MIME_TYPES.has(mimeType)) return "xlsx";

  return null;
}

// Single entry point the report ingestion service calls — it never needs
// to know how any individual format is read.
export async function extractDocumentText(
  buffer: Buffer,
  fileType: ReportFileType
): Promise<string> {
  switch (fileType) {
    case "txt":
      return extractTxtText(buffer);
    case "pdf":
      return extractPdfText(buffer);
    case "xlsx":
      return extractXlsxText(buffer);
  }
}
