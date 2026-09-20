import { Types } from "mongoose";
import { ScheduleActivity } from "../models/ScheduleActivity";
import type { MatchMethod } from "../models/ExecutionUpdate";

// Deterministic, LLM-free matching between an extracted ExecutionUpdate
// and the ScheduleActivity it describes. Tried in order — code, then
// exact name, then keyword overlap, then fuzzy similarity — stopping at
// the first tier that produces a confident match.

export interface MatchedResult {
  matched: true;
  executionUpdateId: string;
  activityId: string;
  activityCode: string;
  activityName: string;
  confidence: number; // 0-100
  matchMethod: MatchMethod;
}

export interface UnmatchedResult {
  matched: false;
  executionUpdateId: string;
  reason: string;
}

export type MatchOutcome = MatchedResult | UnmatchedResult;

export interface MatchableExecutionUpdate {
  _id: Types.ObjectId;
  activityName: string;
  activityCode?: string | null;
  extractionConfidence?: number | null;
}

interface MatchableActivity {
  _id: Types.ObjectId;
  code: string;
  name: string;
}

// Below this, we'd rather say "unmatched" than guess.
const MIN_ACCEPTABLE_CONFIDENCE = 55;
const CODE_MATCH_FLOOR = 90;
const NAME_MATCH_FLOOR = 85;
const KEYWORD_OVERLAP_THRESHOLD = 0.7;
const FUZZY_SIMILARITY_THRESHOLD = 0.6;

/**
 * lowercase, trim, collapse common separators (-, _, /, |, —, –, commas)
 * to spaces, strip remaining punctuation, collapse repeated whitespace.
 */
export function normalizeActivityName(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[-_/|,.]+/g, " ")
    .replace(/[‒-―]+/g, " ") // en/em dash variants
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function wordsOf(normalized: string): Set<string> {
  return new Set(normalized.split(" ").filter(Boolean));
}

function bigramsOf(s: string): Set<string> {
  const padded = ` ${s} `;
  const grams = new Set<string>();
  for (let i = 0; i < padded.length - 1; i++) grams.add(padded.slice(i, i + 2));
  return grams;
}

/** Dice coefficient over character bigrams — simple, dependency-free string similarity (0-1). */
function diceSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  const gramsA = bigramsOf(a);
  const gramsB = bigramsOf(b);
  if (gramsA.size === 0 || gramsB.size === 0) return 0;
  let intersection = 0;
  for (const g of gramsA) if (gramsB.has(g)) intersection++;
  return (2 * intersection) / (gramsA.size + gramsB.size);
}

function toMatched(
  update: MatchableExecutionUpdate,
  activity: MatchableActivity,
  matchMethod: MatchMethod,
  confidence: number
): MatchedResult {
  return {
    matched: true,
    executionUpdateId: update._id.toString(),
    activityId: activity._id.toString(),
    activityCode: activity.code,
    activityName: activity.name,
    confidence: Math.max(0, Math.min(100, Math.round(confidence))),
    matchMethod,
  };
}

function toUnmatched(update: MatchableExecutionUpdate, reason: string): UnmatchedResult {
  return { matched: false, executionUpdateId: update._id.toString(), reason };
}

export async function matchExecutionUpdateToActivity(
  projectId: string,
  update: MatchableExecutionUpdate
): Promise<MatchOutcome> {
  const activities = (await ScheduleActivity.find({ project: new Types.ObjectId(projectId) })
    .select("_id code name")
    .lean()) as MatchableActivity[];

  if (activities.length === 0) {
    return toUnmatched(
      update,
      "This project has no schedule activities imported yet — nothing to match against"
    );
  }

  // Extraction confidence (0-1) reflects how sure B2 was that the raw
  // fields (name/code/etc.) were read correctly. An exact string match is
  // itself unambiguous, so we lean on that value directly for those
  // tiers rather than inventing a separate number, with a floor so a
  // shaky extraction never sinks an otherwise-unambiguous match.
  const extractionConfidence = update.extractionConfidence ?? 0.75;

  // 1. Exact activity code match.
  if (update.activityCode && update.activityCode.trim() !== "") {
    const code = update.activityCode.trim().toUpperCase();
    const activity = activities.find((a) => a.code === code);
    if (activity) {
      return toMatched(
        update,
        activity,
        "exact-code",
        Math.max(CODE_MATCH_FLOOR, extractionConfidence * 100)
      );
    }
  }

  const normalizedUpdateName = normalizeActivityName(update.activityName);
  const updateWords = wordsOf(normalizedUpdateName);

  // 2. Exact normalized name match.
  const exactNameMatch = activities.find(
    (a) => normalizeActivityName(a.name) === normalizedUpdateName
  );
  if (exactNameMatch) {
    return toMatched(
      update,
      exactNameMatch,
      "exact-name",
      Math.max(NAME_MATCH_FLOOR, extractionConfidence * 100 * 0.97)
    );
  }

  // 3. Keyword match — the activity's own name words are (almost) all
  // present in the update's name, e.g. "Foundation Works" or
  // "Foundation - Package B2" against schedule activity "Foundation".
  let bestKeyword: { activity: MatchableActivity; score: number } | null = null;
  for (const activity of activities) {
    const activityWords = wordsOf(normalizeActivityName(activity.name));
    if (activityWords.size === 0) continue;
    const overlap = [...activityWords].filter((w) => updateWords.has(w)).length;
    const score = overlap / activityWords.size;
    if (!bestKeyword || score > bestKeyword.score) bestKeyword = { activity, score };
  }
  if (bestKeyword && bestKeyword.score >= KEYWORD_OVERLAP_THRESHOLD) {
    const confidence = bestKeyword.score * extractionConfidence * 90;
    if (confidence >= MIN_ACCEPTABLE_CONFIDENCE) {
      return toMatched(update, bestKeyword.activity, "keyword", confidence);
    }
  }

  // 4. Fuzzy match — character-level similarity, for typos/rewording.
  let bestFuzzy: { activity: MatchableActivity; score: number } | null = null;
  for (const activity of activities) {
    const score = diceSimilarity(normalizedUpdateName, normalizeActivityName(activity.name));
    if (!bestFuzzy || score > bestFuzzy.score) bestFuzzy = { activity, score };
  }
  if (bestFuzzy && bestFuzzy.score >= FUZZY_SIMILARITY_THRESHOLD) {
    const confidence = bestFuzzy.score * 85;
    if (confidence >= MIN_ACCEPTABLE_CONFIDENCE) {
      return toMatched(update, bestFuzzy.activity, "fuzzy", confidence);
    }
  }

  return toUnmatched(
    update,
    `No schedule activity matched "${update.activityName}"${
      update.activityCode ? ` (code ${update.activityCode})` : ""
    } with sufficient confidence`
  );
}
