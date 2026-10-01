import { apiRequest } from "@/lib/api/client";
import type { PredictionHistoryResponse } from "@/lib/predictions/history";
import type {
  EnginePredictionFetchItem,
  SportPredictionLookupResult,
} from "@/lib/predictions/rows";

export type PredictionsResponse = {
  predictions: Record<string, SportPredictionLookupResult | null>;
};

export const predictionsApi = {
  fetchBatch: (picks: EnginePredictionFetchItem[]) =>
    apiRequest<PredictionsResponse>("/api/value-bets/predictions", {
      method: "POST",
      body: { picks },
    }),
  history: (date: string) =>
    apiRequest<PredictionHistoryResponse>(
      `/api/model-predictions?date=${encodeURIComponent(date)}`,
      { timeoutMs: 45_000 }
    ),
};
