import type { RawExtractionCandidate } from "../../validation/report.validation";
import { parseFlexibleDate } from "./parseFlexibleDate";

// Deterministic, no-API-key extraction path. Requires no LLM configuration
// so B2 can be exercised end-to-end locally (see samples/foundation-site-report.txt).
// Understands two shapes:
//  1. Labeled "Key: Value" lines (Activity/Date/Progress/Reason/...), the
//     natural format for a DPR-style site report and for the report XLSX
//     extractor's per-row output.
//  2. A handful of regex fallbacks (a percentage, a date-like substring)
//     for otherwise-narrative text.

const LABEL_ALIASES: Record<string, keyof RawExtractionCandidate> = {
  activity: "activityName",
  activityname: "activityName",
  stage: "activityName",
  stagename: "activityName",

  activitycode: "activityCode",
  code: "activityCode",
  stagecode: "activityCode",

  date: "updateDate",
  updatedate: "updateDate",
  reportdate: "updateDate",
  progressdate: "updateDate",

  actualprogress: "actualProgress",
  progress: "actualProgress",
  actual: "actualProgress",
  percentcomplete: "actualProgress",
  completion: "actualProgress",

  status: "status",

  reason: "reason",
  cause: "reason",
  delayreason: "reason",

  remarks: "remarks",
  notes: "remarks",
  comment: "remarks",
  comments: "remarks",
};

// Colon only — a bare hyphen/en-dash is too common inside ordinary
// sentences (e.g. "pier-cap") to safely treat as a label separator.
const LABEL_LINE = /^\s*([A-Za-z][A-Za-z /]{1,30}?)\s*:\s*(.+?)\s*$/;
const PERCENT_PATTERN = /(\d{1,3}(?:\.\d+)?)\s*%/;
const MONTH_NAME_DATE = /\b\d{1,2}\s+[A-Za-z]{3,9}\.?\s+\d{4}\b/;
const ISO_DATE = /\b\d{4}-\d{2}-\d{2}\b/;
const REASON_FALLBACK = /(?:due to|because of|owing to)\s+([^.\n]+)/i;

function normalizeLabel(raw: string): string {
  return raw.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

// A labeled progress value ("70%", "70 percent") still needs its bare
// number pulled out before zod's numeric coercion sees it.
function extractPercentValue(raw: string): string {
  const match = PERCENT_PATTERN.exec(raw) ?? /(\d{1,3}(?:\.\d+)?)/.exec(raw);
  return match ? match[1] : raw;
}

// Fields where a PDF/TXT line-wrap continuation should be re-joined
// rather than treated as a new, unrelated line (e.g. a long Reason
// sentence that a PDF's text layer split across two lines).
const CONTINUABLE_FIELDS = new Set<keyof RawExtractionCandidate>(["reason", "remarks"]);

function extractOneBlock(block: string): RawExtractionCandidate | null {
  const candidate: RawExtractionCandidate = { sourceSnippet: block.trim() };
  const unmatchedLines: string[] = [];
  let lastField: keyof RawExtractionCandidate | undefined;

  for (const line of block.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) {
      lastField = undefined;
      continue;
    }

    const match = LABEL_LINE.exec(line);
    const field = match ? LABEL_ALIASES[normalizeLabel(match[1])] : undefined;

    if (match && field) {
      candidate[field] =
        field === "actualProgress" ? extractPercentValue(match[2]) : match[2];
      lastField = field;
    } else if (match) {
      // A labeled line we don't recognize (e.g. "Reported by: ...") — not
      // a continuation of the previous field.
      unmatchedLines.push(trimmed);
      lastField = undefined;
    } else if (
      lastField &&
      CONTINUABLE_FIELDS.has(lastField) &&
      typeof candidate[lastField] === "string"
    ) {
      candidate[lastField] = `${candidate[lastField]} ${trimmed}`;
    } else {
      unmatchedLines.push(trimmed);
    }
  }

  // Fallbacks for narrative text that doesn't use explicit labels.
  if (candidate.actualProgress === undefined) {
    const percent = PERCENT_PATTERN.exec(block);
    if (percent) candidate.actualProgress = percent[1];
  }

  if (candidate.updateDate === undefined) {
    const dateMatch = MONTH_NAME_DATE.exec(block) ?? ISO_DATE.exec(block);
    if (dateMatch) candidate.updateDate = dateMatch[0];
  }

  if (candidate.reason === undefined) {
    const reasonMatch = REASON_FALLBACK.exec(block);
    if (reasonMatch) candidate.reason = reasonMatch[1].trim();
  }

  if (candidate.activityName === undefined && unmatchedLines[0]?.length && unmatchedLines[0].length < 60) {
    candidate.activityName = unmatchedLines[0].replace(/[:.]+$/, "");
  }

  // Not enough signal to call this a real update.
  if (candidate.activityName === undefined || candidate.actualProgress === undefined) {
    return null;
  }

  if (typeof candidate.updateDate === "string") {
    const parsed = parseFlexibleDate(candidate.updateDate);
    if (parsed) candidate.updateDate = parsed;
  }

  candidate.confidence = 0.94;
  return candidate;
}

export function runDemoExtraction(text: string): RawExtractionCandidate[] {
  const blocks = text
    .split(/\n\s*---\s*\n|\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  const segments = blocks.length > 0 ? blocks : [text];
  const candidates: RawExtractionCandidate[] = [];

  for (const block of segments) {
    const candidate = extractOneBlock(block);
    if (candidate) candidates.push(candidate);
  }

  // A single-section report (typical PDF/TXT) may have its labeled lines
  // split across paragraphs by blank lines, which the block-splitter
  // above treats as separate — and separately, none of them individually
  // meet the bar. Retry once against the whole text before giving up.
  if (candidates.length === 0) {
    const whole = extractOneBlock(text);
    if (whole) candidates.push(whole);
  }

  return candidates;
}
