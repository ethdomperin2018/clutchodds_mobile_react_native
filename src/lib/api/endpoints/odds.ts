import { apiRequest } from "@/lib/api/client";
import type { OddsSnapshotResponse } from "@/lib/api/types";

export const oddsApi = {
  getSnapshot: (totalStake = 1000) =>
    apiRequest<OddsSnapshotResponse>(
      `/api/odds?snapshot=1&totalStake=${totalStake}`
    ),
  getArbitrageFeed: (totalStake = 1000, minEdge = 0) =>
    apiRequest(
      `/api/odds?light=1&totalStake=${totalStake}&minEdge=${minEdge}`
    ),
};
