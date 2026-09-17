import type { LineShopPick } from "@/lib/odds/types";
import { buildModelPredictionRows } from "@/lib/modelPredictions/modelPredictionRows";
import type {
  DashboardPredictionRow,
  EnginePredictionFetchItem,
  SportPredictionLookupResult,
} from "@/lib/predictions/types";
import { displayConfidenceScore } from "@/lib/valueBets/format";

export type {
  DashboardPredictionRow,
  EnginePredictionFetchItem,
  SportPredictionLookupResult,
};

export { uniqueEngineEventsForPredictionFetch } from "@/lib/modelPredictions/modelPredictionRows";
export { isEnginePick } from "@/lib/valueBets/engineEliteInsights";

export function lineShopPickToEnginePredictionInput(
  pick: LineShopPick
): EnginePredictionFetchItem {
  return {
    key: pick.eventId,
    homeTeam: pick.homeTeam,
    awayTeam: pick.awayTeam,
    commenceTime: pick.commenceTime,
    sportKey: pick.sportKey,
  };
}

export function compareDashboardPredictionRows(
  a: DashboardPredictionRow,
  b: DashboardPredictionRow
): number {
  if (a.winProb !== b.winProb) return b.winProb - a.winProb;
  const confA = displayConfidenceScore(a.confidenceScore);
  const confB = displayConfidenceScore(b.confidenceScore);
  if (confA !== confB) return confB - confA;
  return b.modelEdge - a.modelEdge;
}

/** Same games / ranking as web `buildModelPredictionRows`, flattened for dashboard UI. */
export function buildDashboardPredictionRows(
  picks: LineShopPick[],
  predictions: Record<string, SportPredictionLookupResult | null | undefined>,
  now = new Date(),
  nowMs = now.getTime()
): DashboardPredictionRow[] {
  return buildModelPredictionRows(picks, predictions, now, nowMs).map((row) => ({
    eventId: row.pick.eventId,
    sportKey: row.pick.sportKey,
    sportTitle: row.pick.sportTitle,
    homeTeam: row.pick.homeTeam,
    awayTeam: row.pick.awayTeam,
    commenceTime: row.pick.commenceTime,
    favoriteTeam: row.favoriteTeam,
    winProb: row.winProb,
    confidenceScore: displayConfidenceScore(row.insights.confidenceScore),
    modelEdge: row.modelEdge,
  }));
}
