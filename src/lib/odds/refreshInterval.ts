export const DEFAULT_ARB_UI_REFRESH_SEC = 30;

/** Default worker / Telegram poll interval (5 minutes) — same as web. */
export const DEFAULT_POLL_INTERVAL_SEC = 300;

export function parseIntervalSec(
  raw: string | undefined,
  fallback: number
): number {
  const n = raw ? Number(raw) : fallback;
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.floor(n);
}

export function isLiveCommenceTime(
  commenceTime: string,
  nowMs = Date.now()
): boolean {
  return new Date(commenceTime).getTime() <= nowMs;
}
