export function americanToDecimal(american: number): number {
  if (american === 0 || !Number.isFinite(american)) {
    throw new Error("Invalid American odds");
  }
  if (american > 0) {
    return 1 + american / 100;
  }
  return 1 + 100 / Math.abs(american);
}

/**
 * Win probability (0–100) → American fair odds.
 * Returns 0 when probability is invalid or at the extremes.
 */
export function probabilityToAmerican(probPercent: number): number {
  if (!Number.isFinite(probPercent)) return 0;
  const p = Math.max(0.001, Math.min(0.999, probPercent / 100));
  if (p >= 0.5) {
    return Math.round((-100 * p) / (1 - p));
  }
  return Math.round((100 * (1 - p)) / p);
}

/** Profit on a winning stake at American odds (excludes stake). */
export function americanProfit(stake: number, american: number): number {
  if (
    !Number.isFinite(stake) ||
    stake <= 0 ||
    !Number.isFinite(american) ||
    american === 0
  ) {
    return 0;
  }
  if (american > 0) return (stake * american) / 100;
  return (stake * 100) / Math.abs(american);
}

/** Total return if the bet wins (stake + profit). */
export function americanPayout(stake: number, american: number): number {
  return stake + americanProfit(stake, american);
}
