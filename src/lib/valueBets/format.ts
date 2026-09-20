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

/** True when displayed confidence meets a minimum threshold (≥). */
export function meetsMinConfidence(score: number, min: number): boolean {
  if (min <= 0) return true;
  return displayConfidenceScore(score) >= min;
}

/** Model / value edge filter: All, 0% (+ only), or ≥ N%. */
export function meetsModelEdgeMin(edge: number, min: string): boolean {
  if (min === "all") return true;
  const threshold = Number(min);
  if (threshold === 0) return displayPercent2(edge) >= 0;
  return meetsMinPercent2(edge, threshold);
}

export function computeDisplayModelEdge(
  modelWinProbability: number,
  marketImpliedProbability: number
): number {
  return (
    Math.round(modelWinProbability) - Math.round(marketImpliedProbability)
  );
}

export function formatSignedPercent(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

/** Short confidence label for gauges (High / Med-High / Med / Low). */
export function displayConfidenceShortLabel(score: number): string {
  const clamped = displayConfidenceScore(score);
  if (clamped >= 7) return "High";
  if (clamped >= 6.5) return "Med-High";
  if (clamped >= 5) return "Med";
  return "Low";
}

export function sportLeagueLabel(sportTitle: string): string {
  const parts = sportTitle.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 4).toUpperCase();
  return parts
    .map((p) => p[0])
    .join("")
    .slice(0, 4)
    .toUpperCase();
}
