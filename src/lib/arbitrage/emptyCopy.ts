import type { ArbitrageViewTab } from "@/lib/arbitrage/summary";

const SIMPLE_LIVE = "No live opportunities right now.";
const SIMPLE_UPCOMING = "No upcoming opportunities right now.";

/**
 * Empty-board copy for the arb list.
 * Always the same simple line per Live/Upcoming tab — no sport/book/ROI
 * diagnostics that change by category.
 */
export function buildArbitrageEmptyCopy(viewTab: ArbitrageViewTab): string {
  return viewTab === "live" ? SIMPLE_LIVE : SIMPLE_UPCOMING;
}
