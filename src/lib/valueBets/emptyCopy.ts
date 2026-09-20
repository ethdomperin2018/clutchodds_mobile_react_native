export type ValueBetsViewTab = "live" | "upcoming";

const SIMPLE_LIVE = "No live +EV opportunities right now.";
const SIMPLE_UPCOMING = "No upcoming +EV opportunities right now.";

/**
 * Empty-board copy for Value Bets.
 * Always the same simple line per Live/Upcoming tab — no filter diagnostics
 * that change by sport category.
 */
export function buildValueBetsEmptyCopy(viewTab: ValueBetsViewTab): string {
  return viewTab === "live" ? SIMPLE_LIVE : SIMPLE_UPCOMING;
}
