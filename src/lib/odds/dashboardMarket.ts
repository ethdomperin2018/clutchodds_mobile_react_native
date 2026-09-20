import {
  applyArbDisplayFilters,
  applyLineShopDisplayFilters,
} from "@/lib/odds/filterArbs";
import { DEFAULT_MAX_LEG_SKEW_MS } from "@/lib/odds/oddsAge";
import type {
  ArbitrageOpportunity,
  LineShopPick,
  PublicArbTeaser,
  PublicLineShopTeaser,
} from "@/lib/odds/types";
import { arbRoiPercent } from "@/lib/format";
import { deriveTeaserConfidence } from "@/lib/valueBets/eliteInsights";
import { primaryEvPercent } from "@/lib/valueBets/format";

export const DASHBOARD_LINE_SHOP_LIMIT = 4;
export const DASHBOARD_ARB_LIMIT = 6;

export const DASHBOARD_DEFAULTS = {
  minEdge: 0,
  minRoi: 0,
  onePickPerGame: true,
  strictLive: true,
  quoteSyncEnabled: true,
  maxLegSkewMs: DEFAULT_MAX_LEG_SKEW_MS,
} as const;

export function lineShopPickToTeaser(p: LineShopPick): PublicLineShopTeaser {
  return {
    eventId: p.eventId,
    matchup: p.matchup,
    sportKey: p.sportKey,
    sportTitle: p.sportTitle,
    homeTeam: p.homeTeam,
    awayTeam: p.awayTeam,
    teamName: p.teamName,
    edgePercent: p.edgePercent,
    commenceTime: p.commenceTime,
    american: p.bestLine.american,
    evPercent: primaryEvPercent(p),
    confidenceScore: deriveTeaserConfidence(p),
  };
}

export function arbToTeaser(a: ArbitrageOpportunity): PublicArbTeaser {
  return {
    eventId: a.eventId,
    matchup: a.matchup,
    sportKey: a.sportKey,
    sportTitle: a.sportTitle,
    homeTeam: a.homeTeam,
    awayTeam: a.awayTeam,
    commenceTime: a.commenceTime,
    totalStake: a.totalStake,
    guaranteedProfit: a.guaranteedProfit,
  };
}

export function filterPicksLikeValueBets(
  picks: LineShopPick[],
  fetchedAt: string | undefined
): LineShopPick[] {
  return applyLineShopDisplayFilters(picks, {
    minEdge: DASHBOARD_DEFAULTS.minEdge,
    selectedSports: new Set(),
    selectedBooks: new Set(),
    fetchedAt,
    maxLegSkewMs: DASHBOARD_DEFAULTS.maxLegSkewMs,
    quoteSyncEnabled: DASHBOARD_DEFAULTS.quoteSyncEnabled,
    onePickPerGame: DASHBOARD_DEFAULTS.onePickPerGame,
  });
}

export function filterArbsLikeScanner(
  arbs: ArbitrageOpportunity[],
  fetchedAt: string | undefined,
  minRoi = DASHBOARD_DEFAULTS.minRoi
): ArbitrageOpportunity[] {
  return applyArbDisplayFilters(arbs, {
    minRoi,
    selectedSports: new Set(),
    selectedBooks: new Set(),
    quoteSyncEnabled: DASHBOARD_DEFAULTS.quoteSyncEnabled,
    maxLegSkewMs: DASHBOARD_DEFAULTS.maxLegSkewMs,
    fetchedAt,
  });
}

export function buildDashboardMarketFromOdds(
  fetchedAt: string,
  opportunities: ArbitrageOpportunity[],
  lineShopPicks: LineShopPick[],
  nowMs = Date.now()
) {
  const picks = filterPicksLikeValueBets(lineShopPicks, fetchedAt);
  const arbs = filterArbsLikeScanner(opportunities, fetchedAt);
  const liveArbCount = arbs.filter(
    (a) => new Date(a.commenceTime).getTime() <= nowMs
  ).length;

  const lineShopTeasers = [...picks]
    .sort((a, b) => primaryEvPercent(b) - primaryEvPercent(a))
    .slice(0, DASHBOARD_LINE_SHOP_LIMIT)
    .map(lineShopPickToTeaser);

  const bestArbitrageOpportunities = [...arbs]
    .sort((a, b) => arbRoiPercent(b) - arbRoiPercent(a))
    .slice(0, DASHBOARD_LINE_SHOP_LIMIT)
    .map(arbToTeaser);

  const arbitrageOpportunities = [...arbs]
    .sort(
      (a, b) =>
        new Date(a.commenceTime).getTime() - new Date(b.commenceTime).getTime()
    )
    .slice(0, DASHBOARD_ARB_LIMIT)
    .map(arbToTeaser);

  return {
    fetchedAt,
    liveArbCount,
    upcomingArbCount: arbs.length - liveArbCount,
    lineShopPickCount: picks.length,
    lineShopTeasers,
    arbitrageOpportunities,
    bestArbitrageOpportunities,
    filteredPicks: picks,
    filteredArbs: arbs,
  };
}
