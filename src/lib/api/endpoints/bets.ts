import { apiRequest } from "@/lib/api/client";
import type { BetsResponse, ManualBetResult } from "@/lib/api/types";
import type { ArbitrageOpportunity, LineShopPick } from "@/lib/odds/types";

export const betsApi = {
  list: () => apiRequest<BetsResponse>("/api/bets"),
  updateResult: (id: string, result: ManualBetResult) =>
    apiRequest<{ bet?: unknown }>(`/api/bets/${id}`, {
      method: "PATCH",
      body: { result },
    }),
  logFromArb: (arb: ArbitrageOpportunity) =>
    apiRequest<{ ok?: boolean }>(`/api/bets/from-arb`, {
      method: "POST",
      body: arb,
    }),
  logFromLineShop: (pick: LineShopPick, stake: number) =>
    apiRequest<{ ok?: boolean }>(`/api/bets/from-line-shop`, {
      method: "POST",
      body: { pick, stake },
    }),
};
