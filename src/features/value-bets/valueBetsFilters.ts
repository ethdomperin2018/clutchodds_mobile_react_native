import { DEFAULT_MAX_LEG_SKEW_MIN } from "@/lib/odds/oddsAge";
import { SCANNER_SPORT_TABS } from "@/lib/scanner/sportTabs";

/** Same as web `VALUE_BETS_SPORT_TABS`. */
export const VALUE_BETS_SPORT_TABS = SCANNER_SPORT_TABS;

export type ValueBetsSidebarFilters = {
  sportKey: string;
  minEdge: string;
  minConfidence: string;
  maxLineAgeGapMin: string;
};

export const DEFAULT_SIDEBAR_FILTERS: ValueBetsSidebarFilters = {
  sportKey: "all",
  minEdge: "0",
  minConfidence: "0",
  maxLineAgeGapMin: String(DEFAULT_MAX_LEG_SKEW_MIN),
};

export const MIN_EDGE_FILTER_OPTIONS = [
  "all",
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
] as const;

export const MIN_CONFIDENCE_FILTER_OPTIONS = ["0", "5", "6", "7", "8", "9"] as const;

export const MAX_LINE_AGE_GAP_OPTIONS = ["all", "1", "2", "3", "4", "5"] as const;

export function countValueBetsSidebarFilters(
  filters: ValueBetsSidebarFilters
): number {
  let count = 0;
  if (filters.sportKey !== DEFAULT_SIDEBAR_FILTERS.sportKey) count += 1;
  if (filters.minEdge !== DEFAULT_SIDEBAR_FILTERS.minEdge) count += 1;
  if (filters.minConfidence !== DEFAULT_SIDEBAR_FILTERS.minConfidence) {
    count += 1;
  }
  if (filters.maxLineAgeGapMin !== DEFAULT_SIDEBAR_FILTERS.maxLineAgeGapMin) {
    count += 1;
  }
  return count;
}
