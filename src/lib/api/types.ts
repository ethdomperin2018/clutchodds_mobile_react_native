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

export type ManualBetRow = {
  id: string;
  expectedProfit: number | null;
  result: "pending" | "won" | "lost" | "push" | "partial";
  createdAt: string;
  notes: string | null;
  sportKey?: string | null;
  matchup?: string;
  legA: { bookTitle: string; stake: number; american: number };
  legB: { bookTitle: string; stake: number; american: number };
};

export type BetsResponse = {
  bets: ManualBetRow[];
};
