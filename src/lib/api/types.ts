import type { AuthUser } from "@/types/auth";

export type ApiErrorPayload = {
  error?: string;
};

export type ApiResponse<T> = T;

export type AuthResponse = {
  user: AuthUser | null;
};

export type OddsSnapshotResponse = {
  fetchedAt: string;
  arbitrageCount: number;
  lineShopCount: number;
  topArbitrageOpportunities: Array<{
    id: string;
    matchup: string;
    sportLabel: string;
    edgePercent: number;
    expectedProfit: number;
  }>;
};

export type BetsResponse = {
  bets: Array<{
    id: string;
    matchup: string;
    sportKey: string | null;
    betDate: string | null;
    expectedProfit: number | null;
  }>;
};
