import { apiRequest } from "@/lib/api/client";
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
};
