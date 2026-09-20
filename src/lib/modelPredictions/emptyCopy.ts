/**
 * Shared empty-board copy for Model Predictions (web + mobile).
 * Sport-tab empties only blame confidence/edge when that sport still has rows
 * before those filters.
 */

export type ModelPredictionsEmptyCopyInput = {
  allCount: number;
  /** Rows for the active sport tab only (no confidence / edge filters). */
  sportScopedCount: number;
  /** Rows after sport + confidence + edge. */
  filteredCount: number;
  sportFilterActive: boolean;
  searchQuery?: string;
  /** Rows before search but after other filters (list only). */
  preSearchCount?: number;
};

export function buildModelPredictionsFeaturedEmptyCopy(
  input: ModelPredictionsEmptyCopyInput
): string {
  if (input.allCount === 0) {
    return "No engine predictions available right now. Check back closer to tip-off.";
  }
  if (input.sportFilterActive && input.sportScopedCount === 0) {
    return "No predictions for this sport right now. Try All sports or check back closer to tip-off.";
  }
  if (input.filteredCount === 0) {
    return input.sportFilterActive
      ? "No predictions for this sport with your current confidence / edge filters. Try All sports or lower filters."
      : "No games meet your confidence or model-edge filters. Lower filters to see more matchups.";
  }
  return "No predictions to show.";
}

export function buildModelPredictionsListEmptyCopy(
  input: ModelPredictionsEmptyCopyInput
): string {
  const q = input.searchQuery?.trim() ?? "";
  const preSearch = input.preSearchCount ?? input.filteredCount;
  if (q && preSearch > 0) {
    return `No matches for “${q}”. Clear search or try another team.`;
  }
  if (input.allCount === 0) {
    return "No predictions available right now.";
  }
  if (input.sportFilterActive && input.sportScopedCount === 0) {
    return "No predictions for this sport right now.";
  }
  if (input.filteredCount === 0) {
    return input.sportFilterActive
      ? "No games match this sport plus your confidence / edge filters."
      : "No games meet your confidence or model-edge filters.";
  }
  return "No predictions to show.";
}
