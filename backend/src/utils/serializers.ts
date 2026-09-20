// Presentational response shaping (B5). None of this touches stored data
// or business logic — it only normalizes what a response looks like at
// the API boundary.

/**
 * ExecutionUpdate documents carry two different confidence numbers on
 * different scales by design: `extractionConfidence` (B2, 0-1 — how sure
 * the extractor was about the raw fields it read) and `matchConfidence`
 * (B3, 0-100 — how sure the deterministic matcher is about the schedule
 * link). Returning both side by side unscaled is a genuine integration
 * trap for a frontend expecting one consistent 0-100 "confidence"
 * convention (matching every other confidence value in this API:
 * matchConfidence, risk confidence). This rescales extractionConfidence
 * to 0-100 for API responses only; the underlying 0-1 field, its
 * validation, and B2's extraction logic are untouched.
 */
export function toExecutionUpdateJSON(update: unknown): Record<string, unknown> {
  const maybeDoc = update as { toObject?: () => Record<string, unknown> };
  const obj: Record<string, unknown> =
    typeof maybeDoc.toObject === "function"
      ? maybeDoc.toObject()
      : { ...(update as Record<string, unknown>) };

  if (typeof obj.extractionConfidence === "number") {
    obj.extractionConfidence = Math.round(obj.extractionConfidence * 100);
  }

  return obj;
}
