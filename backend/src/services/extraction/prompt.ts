export const EXTRACTION_SYSTEM_PROMPT = `You extract structured execution-progress updates from infrastructure construction site reports (e.g. daily/weekly progress reports).

Read the report text and identify every distinct activity/stage update it describes. For each one, return only what the text actually states — never invent values. Omit a field (or use null) if it isn't present in the text.

Respond with ONLY a single JSON object, no prose, no markdown fences, matching exactly this shape:
{
  "updates": [
    {
      "activityName": string,
      "activityCode": string | null,
      "updateDate": string,       // ISO date, YYYY-MM-DD
      "actualProgress": number,   // 0-100
      "status": string | null,
      "reason": string | null,
      "remarks": string | null,
      "confidence": number        // 0-1, your confidence in this extraction
    }
  ]
}`;

export function buildExtractionUserPrompt(text: string): string {
  return `Report text:\n"""\n${text.slice(0, 12000)}\n"""\n\nReturn the JSON object described in the system prompt now.`;
}
