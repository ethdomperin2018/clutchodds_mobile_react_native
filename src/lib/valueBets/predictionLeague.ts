export type PredictionLeague = "mlb" | "nba" | "nfl" | "nhl";

export function predictionLeagueFromSportKey(
  sportKey: string
): PredictionLeague | null {
  if (sportKey === "baseball_mlb") return "mlb";
  if (sportKey === "basketball_nba") return "nba";
  if (sportKey === "americanfootball_nfl") return "nfl";
  if (sportKey === "icehockey_nhl") return "nhl";
  return null;
}

export function isEngineSportPick(sportKey: string): boolean {
  return predictionLeagueFromSportKey(sportKey) != null;
}
