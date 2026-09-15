import type { LineShopPick } from "@/lib/odds/types";
import { displayConfidenceScore } from "@/lib/valueBets/format";

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function modelConvictionScore(winPercent: number): number {
  return clamp(4 + Math.abs(winPercent - 50) * 0.12, 4, 9.8);
}

/** Derived confidence for public/Pro teasers when no engine prediction is attached. */
export function deriveTeaserConfidence(pick: LineShopPick): number {
  const marketImpliedProbability = pick.bestLine.impliedProb * 100;
  const modelWinProbability =
    pick.fairConsensusDecimal != null
      ? (1 / pick.fairConsensusDecimal) * 100
      : clamp(marketImpliedProbability + pick.edgePercent * 0.65, 5, 95);

  return displayConfidenceScore(modelConvictionScore(modelWinProbability));
}
