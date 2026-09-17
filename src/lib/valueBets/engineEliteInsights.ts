import type { LineShopPick } from "@/lib/odds/types";
import type { SportPredictionLookupResult } from "@/lib/predictions/types";
import { isEligibleSportPredictionWindow } from "@/lib/predictions/window";
import {
  computeDisplayModelEdge,
  displayConfidenceScore,
} from "@/lib/valueBets/format";
import { predictionLeagueFromSportKey } from "@/lib/valueBets/predictionLeague";

export type EngineSource =
  | "mlb_engine"
  | "nba_engine"
  | "nfl_engine"
  | "nhl_engine"
  | "derived";

export type PickEliteInsights = {
  modelWinProbability: number;
  marketImpliedProbability: number;
  modelEdge: number;
  confidenceScore: number;
  source: EngineSource;
  predictionLabel: string | null;
  lastUpdated: string | null;
  pickTeamName: string;
  aiFavoriteTeam: string | null;
  aiFavoriteWinPercent: number | null;
  modelAlignsWithPick: boolean;
};

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function modelConvictionScore(favoriteWinPercent: number): number {
  return clamp(4 + Math.abs(favoriteWinPercent - 50) * 0.12, 4, 9.8);
}

function engineSourceForPick(pick: LineShopPick): Exclude<EngineSource, "derived"> | null {
  const league = predictionLeagueFromSportKey(pick.sportKey);
  if (league === "mlb") return "mlb_engine";
  if (league === "nba") return "nba_engine";
  if (league === "nfl") return "nfl_engine";
  if (league === "nhl") return "nhl_engine";
  return null;
}

export function enginePredictionPickKey(pick: LineShopPick): string {
  return pick.eventId;
}

export function isEnginePick(pick: LineShopPick): boolean {
  return engineSourceForPick(pick) != null;
}

function normalizeTeamLabel(value: string): string {
  return value
    .trim()
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function engineTeamNamesMatch(a: string, b: string): boolean {
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

  return {
    teamName: match[1]!.trim(),
    winPercent,
  };
}

function emptyEngineInsights(pick: LineShopPick): PickEliteInsights {
  return {
    modelWinProbability: 0,
    marketImpliedProbability: pick.bestLine.impliedProb * 100,
    modelEdge: 0,
    confidenceScore: 0,
    source: "derived",
    predictionLabel: null,
    lastUpdated: null,
    pickTeamName: pick.teamName,
    aiFavoriteTeam: null,
    aiFavoriteWinPercent: null,
    modelAlignsWithPick: false,
  };
}

function buildEngineEliteInsights(
  pick: LineShopPick,
  prediction: SportPredictionLookupResult | null | undefined,
  source: Exclude<EngineSource, "derived">
): PickEliteInsights | null {
  if (!prediction?.result) return null;

  const parsed = parseEnginePredictionResult(prediction.result);
  if (!parsed) return null;

  const marketImpliedProbability = pick.bestLine.impliedProb * 100;
  const pickFavored = engineTeamNamesMatch(pick.teamName, parsed.teamName);
  const modelWinProbability = pickFavored
    ? parsed.winPercent
    : clamp(100 - parsed.winPercent, 0, 100);
  const modelEdge = computeDisplayModelEdge(
    modelWinProbability,
    marketImpliedProbability
  );

  return {
    modelWinProbability,
    marketImpliedProbability,
    modelEdge,
    confidenceScore: displayConfidenceScore(
      modelConvictionScore(parsed.winPercent)
    ),
    source,
    predictionLabel: prediction.result,
    lastUpdated: prediction.lastUpdated,
    pickTeamName: pick.teamName,
    aiFavoriteTeam: parsed.teamName,
    aiFavoriteWinPercent: parsed.winPercent,
    modelAlignsWithPick: pickFavored,
  };
}

export function resolvePickEliteInsights(
  pick: LineShopPick,
  predictions: Record<string, SportPredictionLookupResult | null | undefined>,
  now = new Date()
): PickEliteInsights {
  const engineSource = engineSourceForPick(pick);

  if (
    engineSource &&
    isEligibleSportPredictionWindow(pick.commenceTime, now)
  ) {
    const fromEngine = buildEngineEliteInsights(
      pick,
      predictions[enginePredictionPickKey(pick)],
      engineSource
    );
    if (fromEngine) return fromEngine;

    return {
      ...emptyEngineInsights(pick),
      source: engineSource,
    };
  }

  if (engineSource) {
    return {
      ...emptyEngineInsights(pick),
      source: engineSource,
    };
  }

  return emptyEngineInsights(pick);
}

export function hasVisibleEnginePrediction(insights: PickEliteInsights): boolean {
  return (
    (insights.source === "mlb_engine" ||
      insights.source === "nba_engine" ||
      insights.source === "nfl_engine" ||
      insights.source === "nhl_engine") &&
    insights.predictionLabel != null
  );
}

function blendedFavoriteWinPercent(insights: {
  modelWinProbability: number;
  modelAlignsWithPick?: boolean;
}): number {
  const pickSide = insights.modelWinProbability;
  if (insights.modelAlignsWithPick !== false) return pickSide;
  return clamp(100 - pickSide, 0, 100);
}

export function favoriteWinPercent(insights: PickEliteInsights): number {
  if (insights.aiFavoriteWinPercent != null) {
    return insights.aiFavoriteWinPercent;
  }
  return blendedFavoriteWinPercent(insights);
}

export function favoriteModelEdge(insights: PickEliteInsights): number {
  const favoriteWin = favoriteWinPercent(insights);
  const favoriteMarket = insights.modelAlignsWithPick
    ? insights.marketImpliedProbability
    : clamp(100 - insights.marketImpliedProbability, 0, 100);
  return computeDisplayModelEdge(favoriteWin, favoriteMarket);
}
