export const STALE_LINE_MS = 30_000;
export const FRESH_LINE_MS = 10_000;
export const DEFAULT_MAX_LEG_SKEW_MIN = 5;
export const DEFAULT_MAX_LEG_SKEW_MS = DEFAULT_MAX_LEG_SKEW_MIN * 60_000;

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

export function legOddsAgeMs(
  leg: { lastUpdate?: string },
  snapshotFetchedAt: string | undefined,
  nowMs: number
): number {
  const t = legTimestampMs(leg, snapshotFetchedAt);
  if (t === null) return Number.POSITIVE_INFINITY;
  return Math.max(0, nowMs - t);
}

export type OddsAgeTone = "fresh" | "warning" | "stale" | "unknown";

export function legOddsAgeTone(
  leg: { lastUpdate?: string },
  snapshotFetchedAt: string | undefined,
  nowMs: number
): OddsAgeTone {
  const ageMs = legOddsAgeMs(leg, snapshotFetchedAt, nowMs);
  if (!Number.isFinite(ageMs)) return "unknown";
  const sec = Math.floor(ageMs / 1000);
  if (sec <= 10) return "fresh";
  if (sec <= 30) return "warning";
  return "stale";
}

export function legOddsAgeLabel(
  leg: { lastUpdate?: string },
  snapshotFetchedAt: string | undefined,
  nowMs: number
): string {
  const ageMs = legOddsAgeMs(leg, snapshotFetchedAt, nowMs);
  if (!Number.isFinite(ageMs)) return "age unknown";
  const sec = Math.floor(ageMs / 1000);
  if (sec < 60) return `updated ${sec}s ago`;
  const min = Math.floor(sec / 60);
  return `updated ${min}m ago`;
}
