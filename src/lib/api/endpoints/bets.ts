import { apiRequest } from "@/lib/api/client";
import type { BetsResponse } from "@/lib/api/types";

export const betsApi = {
  list: (limit = 50) => apiRequest<BetsResponse>(`/api/bets?limit=${limit}`),
};
