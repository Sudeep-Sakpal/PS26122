import ExcelJS from "exceljs";
import { ApiError } from "../../utils/ApiError";
import { cellToText, loadWorkbookBuffer } from "../../utils/xlsxCell";

// Report spreadsheets aren't a fixed schema (unlike the B1 schedule
// import), so this doesn't map columns to known fields — it just turns
// each row into readable "Header: value" text, one block per row, so the
// same downstream extraction layer (demo or LLM) used for PDF/TXT can
// interpret it uniformly.
export async function extractXlsxText(buffer: Buffer): Promise<string> {
  const workbook = new ExcelJS.Workbook();
  try {
    await loadWorkbookBuffer(workbook, buffer);
  } catch {
    throw ApiError.badRequest("Could not read the uploaded file as an .xlsx workbook");
  }

  const blocks: string[] = [];

  for (const worksheet of workbook.worksheets) {
    const rows: string[][] = [];
    worksheet.eachRow({ includeEmpty: false }, (row) => {
      const cells: string[] = [];
      row.eachCell({ includeEmpty: false }, (cell) => {
        cells.push(cellToText(cell));
      });
      if (cells.some((c) => c !== "")) rows.push(cells);
    });

    if (rows.length === 0) continue;

    const [header, ...dataRows] = rows;
    const looksLikeHeader =
      dataRows.length > 0 && header.every((h) => h.length > 0 && h.length < 40);

    if (looksLikeHeader) {
      for (const row of dataRows) {
        const lines = header
          .map((label, i) => [label, row[i] ?? ""] as const)
          .filter(([, value]) => value !== "")
          .map(([label, value]) => `${label}: ${value}`);
        if (lines.length > 0) blocks.push(lines.join("\n"));
      }
    } else {
      blocks.push(rows.map((r) => r.join(" | ")).join("\n"));
    }
  }

  return blocks.join("\n\n---\n\n");
}
