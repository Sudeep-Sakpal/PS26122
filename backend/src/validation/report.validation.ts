import { z } from "zod";

// Shape every extraction candidate (demo or LLM) must satisfy before it's
// persisted as an ExecutionUpdate. Kept lenient with coercion since both
// paths may hand back loosely-typed values (e.g. dates/numbers as strings).
export const extractionCandidateSchema = z.object({
  activityName: z.string().trim().min(1, "activityName is required"),
  activityCode: z
    .string()
    .trim()
    .min(1)
    .optional()
    .nullable()
    .transform((v) => v ?? undefined),
  updateDate: z.coerce.date({ error: "updateDate must be a valid date" }),
  actualProgress: z.coerce.number().min(0).max(100),
  status: z
    .string()
    .trim()
    .min(1)
    .optional()
    .nullable()
    .transform((v) => v ?? undefined),
  reason: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((v) => v ?? ""),
  remarks: z
    .string()
    .trim()
    .min(1)
    .optional()
    .nullable()
    .transform((v) => v ?? undefined),
  confidence: z.coerce.number().min(0).max(1).optional().default(0.5),
});

export type ExtractionCandidate = z.infer<typeof extractionCandidateSchema>;

// What an extraction candidate looks like before validation/coercion —
// both the demo parser and the LLM adapter produce this loosely-typed
// shape, sourceSnippet included, so report.service.ts can attach it.
export interface RawExtractionCandidate {
  activityName?: unknown;
  activityCode?: unknown;
  updateDate?: unknown;
  actualProgress?: unknown;
  status?: unknown;
  reason?: unknown;
  remarks?: unknown;
  confidence?: unknown;
  sourceSnippet?: string;
}
