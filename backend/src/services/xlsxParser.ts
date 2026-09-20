import ExcelJS from "exceljs";
import { ApiError } from "../utils/ApiError";

export type RawScheduleRow = Record<string, unknown>;

// Accepted column header spellings, normalized (lowercased, non-alphanumeric
// stripped) -> canonical field name. Keeps the importer tolerant of
// reasonably-formatted schedule exports rather than one exact template.
const HEADER_ALIASES: Record<string, string> = {
  sequence: "sequence",
  seq: "sequence",
  order: "sequence",
  stage: "sequence",
  stagesequence: "sequence",

  code: "code",
  activitycode: "code",
  stagecode: "code",
  id: "code",

  name: "name",
  activity: "name",
  activityname: "name",
  stagename: "name",

  owner: "owner",
  responsible: "owner",
  responsibleowner: "owner",

  status: "status",

  planned: "planned",
  plannedprogress: "planned",
  plannedpercent: "planned",
  plannedprogresspercent: "planned",

  actual: "actual",
  actualprogress: "actual",
  actualpercent: "actual",
  actualprogresspercent: "actual",

  plannedstart: "plannedStart",
  plannedstartdate: "plannedStart",

  plannedend: "plannedEnd",
  plannedenddate: "plannedEnd",

  actualstart: "actualStart",
  actualstartdate: "actualStart",

  actualend: "actualEnd",
  actualenddate: "actualEnd",

  delaydays: "delayDays",
  delay: "delayDays",

  dependson: "dependsOn",
  dependencies: "dependsOn",
  predecessor: "dependsOn",
  predecessors: "dependsOn",
  after: "dependsOn",
};

function normalizeHeader(raw: string): string | undefined {
  const key = raw.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  return HEADER_ALIASES[key];
}

function cellToPrimitive(cell: ExcelJS.Cell): unknown {
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

export async function parseScheduleWorkbook(
  buffer: Buffer
): Promise<RawScheduleRow[]> {
  const workbook = new ExcelJS.Workbook();
  try {
    // exceljs's declared Buffer parameter type doesn't line up with the
    // installed @types/node's generic Buffer<T>; the value is a plain
    // Buffer at runtime either way.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await workbook.xlsx.load(buffer as any);
  } catch {
    throw ApiError.badRequest("Could not read the uploaded file as an .xlsx workbook");
  }

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw ApiError.badRequest("The workbook has no worksheets");
  }

  const headerRow = worksheet.getRow(1);
  const columnFields: Record<number, string> = {};
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const field = normalizeHeader(String(cell.value ?? ""));
    if (field) columnFields[colNumber] = field;
  });

  if (Object.keys(columnFields).length === 0) {
    throw ApiError.badRequest(
      "Could not recognize any schedule columns in the first row. Expected headers such as Sequence, Code, Name, Owner, Status, Planned, Actual, Planned Start, Planned End, Depends On."
    );
  }

  const rows: RawScheduleRow[] = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    const record: RawScheduleRow = {};
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const field = columnFields[colNumber];
      if (!field) return;
      const value = cellToPrimitive(cell);
      // A blank cell may still hold an empty string rather than being
      // truly absent; treat both the same so optional fields (e.g.
      // actualStart on a not-yet-started stage) coerce correctly.
      if (typeof value === "string" && value.trim() === "") return;
      record[field] = value;
    });

    const hasContent = Object.values(record).some(
      (v) => v !== undefined && v !== null && v !== ""
    );
    if (hasContent) rows.push(record);
  });

  return rows;
}
