import type { AuthUser } from "@/types/auth";

export type ApiErrorPayload = {
  error?: string;
  code?: string;
  email?: string;
};

export type ApiResponse<T> = T;

export type AuthResponse = {
  user: AuthUser | null;
  sessionToken?: string;
};

export type SignupResponse =
  | {
      requiresVerification: true;
      email: string;
      message?: string;
    }
  | AuthResponse;

export type OddsSnapshotResponse = {
  fetchedAt: string;
  liveArbCount: number;
  upcomingArbCount: number;
  lineShopPickCount: number;
  lineShopTeasers: PublicLineShopTeaser[];
  arbitrageOpportunities: PublicArbTeaser[];
  bestArbitrageOpportunities: PublicArbTeaser[];
  snapshot?: true;
  error?: string;
  errorCode?: string;
  errorTitle?: string;
};

export type PublicArbTeaser = {
  eventId: string;
  matchup: string;
  sportKey: string;
  sportTitle: string;
  homeTeam: string;
  awayTeam: string;
  commenceTime: string;
  totalStake: number;
  guaranteedProfit: number;
};

export type PublicLineShopTeaser = {
  eventId: string;
  matchup: string;
  sportKey: string;
  sportTitle: string;
  homeTeam: string;
  awayTeam: string;
  teamName: string;
  edgePercent: number;
  commenceTime: string;
  american: number;
  evPercent: number;
  confidenceScore: number;
};

export type ManualBetLeg = {
  bookKey?: string;
  bookTitle: string;
  teamName: string;
  american: number;
  stake: number;
};

export type ManualBetResult = "pending" | "won" | "lost" | "push" | "partial";

export type ManualBetRow = {
  id: string;
  betDate: string;
  matchup: string;
  sportKey: string | null;
  legA: ManualBetLeg;
  legB: ManualBetLeg;
  expectedProfit: number | null;
  result: ManualBetResult;
  notes: string | null;
  createdAt?: string;
};

export type BetsResponse = {
  bets: ManualBetRow[];
};
