import { apiRequest } from "@/lib/api/client";
import type { BetsResponse } from "@/lib/api/types";
import type { ArbitrageOpportunity, LineShopPick } from "@/lib/odds/types";

export const betsApi = {
  list: () => apiRequest<BetsResponse>("/api/bets"),
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
