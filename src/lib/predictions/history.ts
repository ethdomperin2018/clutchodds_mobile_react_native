export type PredictionOutcome = "pending" | "win" | "loss" | "push";

export const PREDICTION_SLATE_TIME_ZONE = "America/New_York";

export type PredictionHistoryRow = {
  id: string;
  sportKey: string;
  sportTitle: string;
  homeTeam: string;
  awayTeam: string;
  favoriteTeam: string;
  winProb: number;
  confidenceScore: number;
  modelEdge: number | null;
  commenceTime: string;
  outcome: PredictionOutcome;
  awayScore: number | null;
  homeScore: number | null;
};

export type PredictionHistoryRecord = {
  wins: number;
  losses: number;
  pushes: number;
  pending: number;
  winRate: number | null;
};

export type PredictionHistoryResponse = {
  date: string;
  today: string;
  rows: PredictionHistoryRow[];
  record: PredictionHistoryRecord;
};

export function predictionSlateToday(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: PREDICTION_SLATE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function shiftSlateDate(ymd: string, days: number): string {
  const [year, month, day] = ymd.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function summarizePredictionRecord(
  rows: Pick<PredictionHistoryRow, "outcome">[]
): PredictionHistoryRecord {
  let wins = 0;
  let losses = 0;
  let pushes = 0;
  let pending = 0;
  for (const row of rows) {
    if (row.outcome === "win") wins += 1;
    else if (row.outcome === "loss") losses += 1;
    else if (row.outcome === "push") pushes += 1;
    else pending += 1;
  }
  const decided = wins + losses;
  return {
    wins,
    losses,
    pushes,
    pending,
    winRate: decided === 0 ? null : (wins / decided) * 100,
  };
}

export function formatSlateButton(ymd: string): string {
  const [year, month, day] = ymd.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatSlateLabel(ymd: string, today: string): string {
  if (ymd === today) return "Today";
  const [year, month, day] = ymd.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatWinRate(winRate: number | null): string {
  if (winRate == null) return "—";
  return `${winRate.toFixed(1)}%`;
}

export function formatPredictionRecord(
  record: PredictionHistoryRecord,
  options?: { date?: string; today?: string }
): string {
  const finished = record.wins + record.losses + record.pushes;
  if (finished === 0) {
    if (
      options?.date &&
      options.today &&
      options.date < options.today &&
      record.pending > 0
    ) {
      return "Final scores not in yet";
    }
    return "No finished games";
  }
  const base = `${record.wins}–${record.losses}`;
  if (record.pushes === 0) return base;
  const pushLabel = record.pushes === 1 ? "1 push" : `${record.pushes} pushes`;
  return `${base}, ${pushLabel}`;
}

export function slateDateFromUtcParts(year: number, monthIndex: number, day: number): string {
  const date = new Date(Date.UTC(year, monthIndex, day));
  return date.toISOString().slice(0, 10);
}
