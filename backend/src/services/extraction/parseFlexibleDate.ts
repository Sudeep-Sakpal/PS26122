const DMY_NUMERIC = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/;

// Handles the date spellings a site report is likely to use: ISO
// (2025-12-14), month-name forms ("14 Dec 2025", "Dec 14, 2025" — V8
// parses these unambiguously), and numeric DD/MM/YYYY (ambiguous in
// `new Date()`, so read explicitly as day-first given the India-based
// PS 26122 scenario).
export function parseFlexibleDate(raw: string): Date | undefined {
  const value = raw.trim();
  if (!value) return undefined;

  const numeric = DMY_NUMERIC.exec(value);
  if (numeric) {
    const [, day, month, year] = numeric;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}
