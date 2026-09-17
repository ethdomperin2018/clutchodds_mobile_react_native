import type { LineShopPick } from "@/lib/odds/types";
import type { SportPredictionLookupResult } from "@/lib/predictions/types";
import {
  engineTeamNamesMatch,
  favoriteModelEdge,
  favoriteWinPercent,
  hasVisibleEnginePrediction,
  isEnginePick,
  resolvePickEliteInsights,
  type PickEliteInsights,
} from "@/lib/valueBets/engineEliteInsights";
import { displayConfidenceScore } from "@/lib/valueBets/format";

export type ModelPredictionRow = {
  pick: LineShopPick;
  insights: PickEliteInsights;
  favoriteTeam: string;
  winProb: number;
  modelEdge: number;
  isLive: boolean;
};

/** Top Prediction / Best Prediction ranking: win % → confidence → model edge. */
export function compareModelPredictionRowsByTop(
  a: ModelPredictionRow,
  b: ModelPredictionRow
): number {
  if (a.winProb !== b.winProb) return b.winProb - a.winProb;
  const confA = displayConfidenceScore(a.insights.confidenceScore);
  const confB = displayConfidenceScore(b.insights.confidenceScore);
  if (confA !== confB) return confB - confA;
  return b.modelEdge - a.modelEdge;
}

export function pickTopModelPredictionRow(
  rows: ModelPredictionRow[]
): ModelPredictionRow | null {
  if (rows.length === 0) return null;
  return rows.reduce((best, row) =>
    compareModelPredictionRowsByTop(row, best) < 0 ? row : best
  );
}

export function groupEnginePicksByEvent(
  picks: LineShopPick[]
): Map<string, LineShopPick[]> {
  const map = new Map<string, LineShopPick[]>();
  for (const pick of picks) {
    if (!isEnginePick(pick)) continue;
    const list = map.get(pick.eventId);
    if (list) list.push(pick);
    else map.set(pick.eventId, [pick]);
  }
  return map;
}

export function uniqueEngineEventsForPredictionFetch(
  picks: LineShopPick[]
): LineShopPick[] {
  const seen = new Map<string, LineShopPick>();
  for (const pick of picks) {
    if (!isEnginePick(pick)) continue;
    if (!seen.has(pick.eventId)) seen.set(pick.eventId, pick);
  }
  return [...seen.values()];
}

/**
 * Prefer the line-shop pick on the model-favorite side so Best Line matches Pick.
 */
export function selectPickForModelPrediction(
  eventPicks: LineShopPick[],
  predictions: Record<string, SportPredictionLookupResult | null | undefined>,
  now: Date
): { pick: LineShopPick; insights: PickEliteInsights } | null {
  const candidates = eventPicks
    .map((pick) => ({
      pick,
      insights: resolvePickEliteInsights(pick, predictions, now),
    }))
    .filter(({ insights }) => hasVisibleEnginePrediction(insights));

  if (candidates.length === 0) return null;

  const favTeam = candidates[0]!.insights.aiFavoriteTeam;
  if (favTeam) {
    const favoritePick = candidates.find((c) =>
      engineTeamNamesMatch(c.pick.teamName, favTeam)
    );
    if (favoritePick) return favoritePick;
  }

  return candidates.reduce((best, cur) =>
    cur.insights.confidenceScore > best.insights.confidenceScore ? cur : best
  );
}

export function buildModelPredictionRows(
  picks: LineShopPick[],
  predictions: Record<string, SportPredictionLookupResult | null | undefined>,
  now: Date,
  nowMs: number
): ModelPredictionRow[] {
  const byEvent = groupEnginePicksByEvent(picks);
  const rows: ModelPredictionRow[] = [];

  for (const eventPicks of byEvent.values()) {
    const selected = selectPickForModelPrediction(eventPicks, predictions, now);
    if (!selected) continue;

    const { pick, insights } = selected;
    rows.push({
      pick,
      insights,
      favoriteTeam: insights.aiFavoriteTeam ?? pick.teamName,
      winProb: favoriteWinPercent(insights),
      modelEdge: favoriteModelEdge(insights),
      isLive: new Date(pick.commenceTime).getTime() <= nowMs,
    });
  }

  return rows;
}
