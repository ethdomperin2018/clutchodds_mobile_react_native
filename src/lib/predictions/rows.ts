import type { LineShopPick } from "@/lib/odds/types";
import { isEligibleSportPredictionWindow } from "@/lib/predictions/window";
import { displayConfidenceScore, computeDisplayModelEdge } from "@/lib/valueBets/format";

export type SportPredictionLookupResult = {
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  result: string | null;
  lastUpdated: string | null;
};

export type EnginePredictionFetchItem = {
  key: string;
  homeTeam: string;
  awayTeam: string;
  commenceTime: string;
  sportKey: string;
};

export type DashboardPredictionRow = {
  eventId: string;
  sportKey: string;
  sportTitle: string;
  homeTeam: string;
  awayTeam: string;
  commenceTime: string;
  favoriteTeam: string;
  winProb: number;
  confidenceScore: number;
  modelEdge: number;
};

const ENGINE_SPORTS = new Set([
  "baseball_mlb",
  "basketball_nba",
  "americanfootball_nfl",
  "icehockey_nhl",
]);

function normalizeTeamLabel(value: string): string {
  return value
    .trim()
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function engineTeamNamesMatch(a: string, b: string): boolean {
  const left = normalizeTeamLabel(a);
  const right = normalizeTeamLabel(b);
  if (left === right) return true;
  if (left.endsWith(right) || right.endsWith(left)) return true;
  if (left.includes(right) || right.includes(left)) {
    const shorter = left.length < right.length ? left : right;
    return shorter.length >= 4;
  }
  return false;
}

export function parseEnginePredictionResult(result: string | null): {
  teamName: string;
  winPercent: number;
} | null {
  if (!result?.trim()) return null;
  const match = result.trim().match(/^(.+?)\s*:\s*(\d+(?:\.\d+)?)\s*%?\s*$/);
  if (!match) return null;
  const winPercent = Number(match[2]);
  if (!Number.isFinite(winPercent) || winPercent < 0 || winPercent > 100) {
    return null;
  }
  return { teamName: match[1]!.trim(), winPercent };
}

function modelConvictionScore(winPercent: number): number {
  const gap = Math.abs(winPercent - 50);
  return Math.max(4, Math.min(9.8, 4 + gap * 0.12));
}

export function isEnginePick(pick: LineShopPick): boolean {
  return ENGINE_SPORTS.has(pick.sportKey);
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

export function buildDashboardPredictionRows(
  picks: LineShopPick[],
  predictions: Record<string, SportPredictionLookupResult | null | undefined>,
  now = new Date()
): DashboardPredictionRow[] {
  const byEvent = new Map<string, LineShopPick>();
  for (const pick of uniqueEngineEventsForPredictionFetch(picks)) {
    if (!isEligibleSportPredictionWindow(pick.commenceTime, now)) continue;
    byEvent.set(pick.eventId, pick);
  }

  const rows: DashboardPredictionRow[] = [];
  for (const pick of byEvent.values()) {
    const prediction = predictions[pick.eventId];
    const parsed = parseEnginePredictionResult(prediction?.result ?? null);
    if (!parsed) continue;

    // Prefer matching home/away labels from the pick when possible.
    let favoriteTeam = parsed.teamName;
    if (engineTeamNamesMatch(parsed.teamName, pick.homeTeam)) {
      favoriteTeam = pick.homeTeam;
    } else if (engineTeamNamesMatch(parsed.teamName, pick.awayTeam)) {
      favoriteTeam = pick.awayTeam;
    }

    const pickSideMarket = pick.bestLine.impliedProb * 100;
    const alignsWithPick = engineTeamNamesMatch(favoriteTeam, pick.teamName);
    const favoriteMarket = alignsWithPick
      ? pickSideMarket
      : Math.max(0, Math.min(100, 100 - pickSideMarket));

    rows.push({
      eventId: pick.eventId,
      sportKey: pick.sportKey,
      sportTitle: pick.sportTitle,
      homeTeam: pick.homeTeam,
      awayTeam: pick.awayTeam,
      commenceTime: pick.commenceTime,
      favoriteTeam,
      winProb: parsed.winPercent,
      confidenceScore: displayConfidenceScore(
        modelConvictionScore(parsed.winPercent)
      ),
      modelEdge: computeDisplayModelEdge(parsed.winPercent, favoriteMarket),
    });
  }

  return rows;
}
