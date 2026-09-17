export type ArbitrageTimeRange = "today" | "all";

function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function arbMatchesTimeRange(
  commenceTime: string,
  timeRange: ArbitrageTimeRange,
  nowMs: number
): boolean {
  if (timeRange === "all") return true;
  const kickoff = new Date(commenceTime);
  if (kickoff.getTime() <= nowMs) return true;
  return isSameLocalDay(kickoff, new Date(nowMs));
}
