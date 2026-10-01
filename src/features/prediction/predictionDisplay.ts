import { displayConfidenceScore } from "@/lib/valueBets/format";

export function formatKickoffWhen(
  commenceTime: string,
  nowMs: number,
  settled = false
): string {
  const d = new Date(commenceTime);
  if (Number.isNaN(d.getTime())) return "—";
  if (!settled && d.getTime() <= nowMs) return "Live";
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

export function startsInLabel(commenceTime: string, nowMs: number): string {
  const delta = new Date(commenceTime).getTime() - nowMs;
  if (!Number.isFinite(delta)) return "—";
  if (delta <= 0) return "Live";
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
  nowMs: number
): string {
  if (outcome === "win") return "Win";
  if (outcome === "loss") return "Loss";
  if (outcome === "push") return "Push";
  return startsInLabel(commenceTime, nowMs);
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
