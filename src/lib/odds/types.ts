/** Minimal Odds API shapes used by the mobile dashboard. */

export type BookLine = {
  bookKey: string;
  bookTitle: string;
  american: number;
  decimalOdds: number;
  impliedProb: number;
  lastUpdate?: string;
  betLimit?: number;
  deepLink?: string;
};

export type RankedBookLine = BookLine & { rank: number };

export type ArbLegStake = {
  side: "home" | "away";
  teamName: string;
  bookKey: string;
  bookTitle: string;
  american: number;
  decimalOdds: number;
  stake: number;
  lastUpdate?: string;
  betLimit?: number;
  deepLink?: string;
};

export type ArbitrageOpportunity = {
  eventId: string;
  sportKey: string;
  sportTitle: string;
  commenceTime: string;
  matchup: string;
  homeTeam: string;
  awayTeam: string;
  impliedProbabilitySum: number;
  legs: ArbLegStake[];
  totalStake: number;
  guaranteedProfit: number;
};

export type LineShopPick = {
  eventId: string;
  sportKey: string;
  sportTitle: string;
  commenceTime: string;
  matchup: string;
  homeTeam: string;
  awayTeam: string;
  side: "home" | "away";
  teamName: string;
  bestLine: BookLine;
  secondBestLine: BookLine | null;
  consensusDecimal: number;
  edgePercent: number;
  fairConsensusDecimal: number | null;
  fairEdgePercent: number | null;
  fairReference: "sharp" | "consensus" | null;
  fairBookCount: number;
  bookCount: number;
  lines: RankedBookLine[];
};

export type PublicArbTeaser = Pick<
  ArbitrageOpportunity,
  | "eventId"
  | "matchup"
  | "sportKey"
  | "sportTitle"
  | "homeTeam"
  | "awayTeam"
  | "commenceTime"
  | "totalStake"
  | "guaranteedProfit"
>;

export type PublicLineShopTeaser = Pick<
  LineShopPick,
  | "eventId"
  | "matchup"
  | "sportKey"
  | "sportTitle"
  | "homeTeam"
  | "awayTeam"
  | "teamName"
  | "edgePercent"
  | "commenceTime"
> & {
  american: number;
  evPercent: number;
  confidenceScore: number;
};

export type GameLineSummary = {
  eventId: string;
  sportKey: string;
  sportTitle: string;
  commenceTime: string;
  matchup: string;
  homeTeam: string;
  awayTeam: string;
  homeBestLine: BookLine | null;
  awayBestLine: BookLine | null;
  impliedProbabilitySum: number;
  isArbitrage: boolean;
};

export type OddsLightFeedResponse = {
  fetchedAt?: string;
  lineShopPicks?: LineShopPick[];
  arbitrageOpportunities?: ArbitrageOpportunity[];
  games?: GameLineSummary[];
  error?: string;
  errorCode?: string;
  errorTitle?: string;
};
