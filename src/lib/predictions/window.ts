const MLB_TIMEZONE = "America/New_York";
export const MLB_LIVE_PREDICTION_GRACE_MS = 6 * 60 * 60 * 1000;

export function mlbMatchDateFromIso(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: MLB_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

function calendarDaysBetween(fromYmd: string, toYmd: string): number {
  const [fy, fm, fd] = fromYmd.split("-").map(Number);
  const [ty, tm, td] = toYmd.split("-").map(Number);
  const fromUtc = Date.UTC(fy!, fm! - 1, fd);
  const toUtc = Date.UTC(ty!, tm! - 1, td);
  return Math.round((toUtc - fromUtc) / 86_400_000);
}

export function isMlbGameWithinLivePredictionGrace(
  commenceTime: string,
  now = new Date(),
  graceMs = MLB_LIVE_PREDICTION_GRACE_MS
): boolean {
  const matchMs = new Date(commenceTime).getTime();
  const nowMs = now.getTime();
  if (!Number.isFinite(matchMs) || !Number.isFinite(nowMs)) return false;
  if (nowMs < matchMs) return false;
  return nowMs - matchMs <= graceMs;
}

/** Show AI predictions for today's ET slate (plus live grace after midnight). */
export function isEligibleSportPredictionWindow(
  commenceTime: string,
  now = new Date()
): boolean {
  const matchMs = new Date(commenceTime).getTime();
  if (!Number.isFinite(matchMs)) return false;

  const matchDate = mlbMatchDateFromIso(commenceTime);
  const todayDate = mlbMatchDateFromIso(now.toISOString());
  const daysUntil = calendarDaysBetween(todayDate, matchDate);

  if (daysUntil === 0) return true;
  if (
    daysUntil === -1 &&
    isMlbGameWithinLivePredictionGrace(commenceTime, now)
  ) {
    return true;
  }
  return false;
}
