import { displayConfidenceScore } from "@/lib/valueBets/format";

/** Keep in step with lib/modelPredictions/gameWindow.ts on the website. */
const LIVE_WINDOW_MS: Record<string, number> = {
  baseball_mlb: 4.5 * 60 * 60 * 1000,
  basketball_nba: 3 * 60 * 60 * 1000,
  icehockey_nhl: 3.5 * 60 * 60 * 1000,
  americanfootball_nfl: 4 * 60 * 60 * 1000,
};

const DEFAULT_LIVE_WINDOW_MS = 4 * 60 * 60 * 1000;

function isInsideLiveWindow(
  commenceTime: string,
  sportKey: string,
  nowMs: number
): boolean {
  const start = new Date(commenceTime).getTime();
  if (!Number.isFinite(start)) return false;
  const elapsed = nowMs - start;
  const windowMs = LIVE_WINDOW_MS[sportKey] ?? DEFAULT_LIVE_WINDOW_MS;
  return elapsed >= 0 && elapsed < windowMs;
}

export function formatKickoffWhen(
  commenceTime: string,
  nowMs: number,
  settled = false,
  sportKey = ""
): string {
  const d = new Date(commenceTime);
  if (Number.isNaN(d.getTime())) return "—";
  if (!settled && isInsideLiveWindow(commenceTime, sportKey, nowMs)) return "Live";
  const now = new Date(nowMs);
  const startOfDay = (x: Date) =>
    new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const dayDiff = Math.round((startOfDay(d) - startOfDay(now)) / 86_400_000);
  const time = d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  const day =
    dayDiff === 0
      ? "Today"
      : dayDiff === 1
        ? "Tomorrow"
        : d.toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
          });
  return `${day} ${time}`;
}

export function startsInLabel(
  commenceTime: string,
  nowMs: number,
  sportKey = ""
): string {
  const delta = new Date(commenceTime).getTime() - nowMs;
  if (!Number.isFinite(delta)) return "—";
  if (delta <= 0) {
    return isInsideLiveWindow(commenceTime, sportKey, nowMs) ? "Live" : "Final";
  }
  const min = Math.round(delta / 60_000);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  const rem = min % 60;
  if (hr < 48) return rem === 0 ? `${hr}h` : `${hr}h ${rem}m`;
  const days = Math.floor(hr / 24);
  return `${days}d`;
}

export function formatConfidence10(score: number): string {
  return `${displayConfidenceScore(score).toFixed(1)}/10`;
}

export type ModelEdgeTone = "pos" | "neg" | "flat";

export function outcomeLabel(
  outcome: "pending" | "win" | "loss" | "push",
  commenceTime: string,
  nowMs: number,
  sportKey = ""
): string {
  if (outcome === "win") return "Win";
  if (outcome === "loss") return "Loss";
  if (outcome === "push") return "Push";
  return startsInLabel(commenceTime, nowMs, sportKey);
}

export function scoreLabel(
  outcome: "pending" | "win" | "loss" | "push",
  awayScore: number | null,
  homeScore: number | null
): string | null {
  if (outcome === "pending") return null;
  if (awayScore == null || homeScore == null) return null;
  return `${awayScore}–${homeScore}`;
}

export function modelEdgeTone(edge: number): ModelEdgeTone {
  if (edge > 0) return "pos";
  if (edge < 0) return "neg";
  return "flat";
}
