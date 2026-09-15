import { apiRequest } from "@/lib/api/client";
import type { BetsResponse } from "@/lib/api/types";

export const BET_LOG_LIST_LIMIT = 200;

export const betsApi = {
  list: (limit = BET_LOG_LIST_LIMIT) =>
    apiRequest<BetsResponse>(`/api/bets?limit=${limit}`),
};
