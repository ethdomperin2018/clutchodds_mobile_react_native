import type { LineShopPick } from "@/lib/odds/types";
import { primaryEvPercent, sportLeagueLabel } from "@/lib/valueBets/format";

export type ValueBetsSummary = {
  opportunityCount: number;
  averageEvPercent: number;
  topEvPercent: number;
  topEvLabel: string;
  bestLineDiff: number;
  bestLineBooks: string;
  /** Share of board with EV > 0 (0–100). */
  positiveEvPercent: number;
  positiveEvCount: number;
  topSportKey: string | null;
  topSportTitle: string | null;
  topSportAvgEv: number;
  bestPick: LineShopPick | null;
};

export function lineDiffAmerican(pick: LineShopPick): number {
  if (!pick.secondBestLine) return 0;
  return Math.abs(pick.bestLine.american - pick.secondBestLine.american);
}

/** Same as web `computeValueBetsSummary`. */
export function computeValueBetsSummary(picks: LineShopPick[]): ValueBetsSummary {
  if (picks.length === 0) {
    return {
      opportunityCount: 0,
      averageEvPercent: 0,
      topEvPercent: 0,
      topEvLabel: "—",
      bestLineDiff: 0,
      bestLineBooks: "—",
      positiveEvPercent: 0,
      positiveEvCount: 0,
      topSportKey: null,
      topSportTitle: null,
      topSportAvgEv: 0,
      bestPick: null,
    };
  }

  const evValues = picks.map(primaryEvPercent);
  const averageEvPercent =
    evValues.reduce((sum, v) => sum + v, 0) / evValues.length;

  let topPick = picks[0]!;
  let topEv = primaryEvPercent(topPick);
  for (const pick of picks) {
    const ev = primaryEvPercent(pick);
    if (ev > topEv) {
      topEv = ev;
      topPick = pick;
    }
  }

  let bestDiffPick = picks[0]!;
  let bestDiff = lineDiffAmerican(bestDiffPick);
  for (const pick of picks) {
    const diff = lineDiffAmerican(pick);
    if (diff > bestDiff) {
      bestDiff = diff;
      bestDiffPick = pick;
    }
  }

  const bestLineBooks =
    bestDiffPick.secondBestLine != null
      ? `${bestDiffPick.bestLine.bookTitle} vs ${bestDiffPick.secondBestLine.bookTitle}`
      : bestDiffPick.bestLine.bookTitle;

  const positiveEvCount = evValues.filter((v) => v > 0).length;
  const positiveEvPercent = (positiveEvCount / picks.length) * 100;

  const bySport = new Map<
    string,
    { title: string; sum: number; count: number }
  >();
  for (const pick of picks) {
    const key = pick.sportKey || "unknown";
    const cur = bySport.get(key) ?? {
      title: pick.sportTitle || sportLeagueLabel(pick.sportKey),
      sum: 0,
      count: 0,
    };
    cur.sum += primaryEvPercent(pick);
    cur.count += 1;
    bySport.set(key, cur);
  }

  let topSportKey: string | null = null;
  let topSportTitle: string | null = null;
  let topSportAvgEv = -Infinity;
  for (const [key, row] of bySport) {
    const avg = row.sum / row.count;
    if (avg > topSportAvgEv) {
      topSportAvgEv = avg;
      topSportKey = key;
      topSportTitle = row.title;
    }
  }

  return {
    opportunityCount: picks.length,
    averageEvPercent,
    topEvPercent: topEv,
    topEvLabel: `${topPick.matchup} — ${topPick.teamName} ML`,
    bestLineDiff: bestDiff,
    bestLineBooks,
    positiveEvPercent,
    positiveEvCount,
    topSportKey,
    topSportTitle,
    topSportAvgEv: Number.isFinite(topSportAvgEv) ? topSportAvgEv : 0,
    bestPick: topPick,
  };
}
