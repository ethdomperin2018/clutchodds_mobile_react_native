/**
 * Shared empty-board copy for Model Predictions (web + mobile).
 * Always the same simple line — no sport / confidence / edge diagnostics
 * that change by category.
 */

const SIMPLE_FEATURED =
  "No engine predictions available right now. Check back closer to tip-off.";
const SIMPLE_LIST = "No predictions available right now.";

export function buildModelPredictionsFeaturedEmptyCopy(): string {
  return SIMPLE_FEATURED;
}

export function buildModelPredictionsListEmptyCopy(input?: {
  searchQuery?: string;
  /** Rows before search (list only). */
  preSearchCount?: number;
}): string {
  const q = input?.searchQuery?.trim() ?? "";
  const preSearch = input?.preSearchCount ?? 0;
  if (q && preSearch > 0) {
    return `No matches for “${q}”. Clear search or try another team.`;
  }
  return SIMPLE_LIST;
}
