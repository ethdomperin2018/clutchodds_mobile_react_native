export type SportPredictionLookupResult = {
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  result: string | null;
  lastUpdated: string | null;
};

export type EnginePredictionFetchItem = {
  key: string;
  homeTeam: string;
  awayTeam: string;
  commenceTime: string;
  sportKey: string;
};

export type DashboardPredictionRow = {
  eventId: string;
  sportKey: string;
  sportTitle: string;
  homeTeam: string;
  awayTeam: string;
  commenceTime: string;
  favoriteTeam: string;
  winProb: number;
  confidenceScore: number;
  modelEdge: number;
};
