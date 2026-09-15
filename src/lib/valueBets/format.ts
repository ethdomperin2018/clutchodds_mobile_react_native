import type { LineShopPick } from "@/lib/odds/types";

export function primaryEvPercent(pick: LineShopPick): number {
  return pick.fairEdgePercent ?? pick.edgePercent;
}

export function displayPercent2(value: number): number {
  if (!Number.isFinite(value)) return value;
  return Number(value.toFixed(2));
}

export function meetsMinPercent2(value: number, min: number): boolean {
  if (min <= 0) return true;
  return displayPercent2(value) >= min;
}

export function displayConfidenceScore(value: number): number {
  if (!Number.isFinite(value)) return value;
  const clamped = Math.max(0, Math.min(10, value));
  return Number(clamped.toFixed(1));
}

export function computeDisplayModelEdge(
  modelWinProbability: number,
  marketImpliedProbability: number
): number {
  return (
    Math.round(modelWinProbability) - Math.round(marketImpliedProbability)
  );
}
