export const DEFAULT_MAX_LEG_SKEW_MS = 5 * 60_000;

export function legTimestampMs(
  leg: { lastUpdate?: string },
  snapshotFetchedAt: string | undefined
): number | null {
  const ts = leg.lastUpdate ?? snapshotFetchedAt;
  if (!ts) return null;
  const t = new Date(ts).getTime();
  return Number.isFinite(t) ? t : null;
}

export function arbLegSkewMs(
  arb: { legs: { lastUpdate?: string }[] },
  snapshotFetchedAt: string | undefined
): number | null {
  const times = arb.legs
    .map((leg) => legTimestampMs(leg, snapshotFetchedAt))
    .filter((t): t is number => t !== null);
  if (times.length < 2) return null;
  return Math.max(...times) - Math.min(...times);
}

export function arbMatchesQuoteSyncFilter(
  arb: { legs: { lastUpdate?: string }[] },
  snapshotFetchedAt: string | undefined,
  maxSkewMs: number
): boolean {
  const skew = arbLegSkewMs(arb, snapshotFetchedAt);
  if (skew === null) return true;
  return skew <= maxSkewMs;
}
