import type ExcelJS from "exceljs";

// Shared cell-reading helpers used by both the schedule importer
// (services/xlsxParser.ts) and the report XLSX extractor
// (services/documentExtraction/xlsxExtractor.ts).

export function cellToPrimitive(cell: ExcelJS.Cell): unknown {
  const value = cell.value;
  if (value === null || value === undefined) return undefined;
  if (value instanceof Date) return value;
  if (typeof value === "object") {
    if ("result" in value) return (value as { result: unknown }).result;
    if ("text" in value) return (value as { text: unknown }).text;
    if ("richText" in value) {
      return (value as { richText: Array<{ text: string }> }).richText
        .map((t) => t.text)
        .join("");
    }
    return undefined;
  }
  return value;
}

export function cellToText(cell: ExcelJS.Cell): string {
  const value = cellToPrimitive(cell);
  if (value === undefined || value === null) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).trim();
}

// exceljs's declared Buffer parameter type doesn't line up with the
// installed @types/node's generic Buffer<T>; the value is a plain Buffer
// at runtime either way.
export function loadWorkbookBuffer(
  workbook: ExcelJS.Workbook,
  buffer: Buffer
): Promise<ExcelJS.Workbook> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return workbook.xlsx.load(buffer as any);
}
