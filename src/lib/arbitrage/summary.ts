import type { ArbitrageOpportunity } from "@/lib/odds/types";
import { arbRoiPercent } from "@/lib/format";

export type ArbitrageViewTab = "live" | "upcoming";

export type ArbitrageSummary = {
  liveCount: number;
  upcomingCount: number;
  averageRoiPercent: number;
  totalProfitPotential: number;
  opportunityCount: number;
};

function isLiveArb(arb: ArbitrageOpportunity, nowMs: number): boolean {
  return new Date(arb.commenceTime).getTime() <= nowMs;
}

export function filterArbsByViewTab(
  arbs: ArbitrageOpportunity[],
  viewTab: ArbitrageViewTab,
  nowMs: number
): ArbitrageOpportunity[] {
  return arbs.filter((arb) =>
    viewTab === "live" ? isLiveArb(arb, nowMs) : !isLiveArb(arb, nowMs)
  );
}

export function computeArbitrageSummary(
  arbs: ArbitrageOpportunity[],
  nowMs: number
): ArbitrageSummary {
  let liveCount = 0;
  let upcomingCount = 0;

  for (const arb of arbs) {
    if (isLiveArb(arb, nowMs)) liveCount += 1;
    else upcomingCount += 1;
  }

  if (arbs.length === 0) {
    return {
      liveCount,
      upcomingCount,
      averageRoiPercent: 0,
      totalProfitPotential: 0,
      opportunityCount: 0,
    };
  }

  let roiSum = 0;
  let totalProfit = 0;
  for (const arb of arbs) {
    roiSum += arbRoiPercent(arb);
    totalProfit += arb.guaranteedProfit;
  }

  return {
    liveCount,
    upcomingCount,
    averageRoiPercent: roiSum / arbs.length,
    totalProfitPotential: totalProfit,
    opportunityCount: arbs.length,
  };
}
