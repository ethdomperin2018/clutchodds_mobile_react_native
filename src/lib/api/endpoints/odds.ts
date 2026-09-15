import { apiRequest } from "@/lib/api/client";
import type { OddsSnapshotResponse } from "@/lib/api/types";
import type { OddsLightFeedResponse } from "@/lib/odds/types";
import { DASHBOARD_DEFAULTS } from "@/lib/odds/dashboardMarket";

export const oddsApi = {
  getSnapshot: (totalStake = 1000) =>
    apiRequest<OddsSnapshotResponse>(
      `/api/odds?snapshot=1&totalStake=${totalStake}`
    ),
  getLightFeed: (totalStake = 1000, minEdge = 0) => {
    const q = new URLSearchParams({
      totalStake: String(totalStake),
      minEdge: String(minEdge),
      light: "1",
      strictLive: DASHBOARD_DEFAULTS.strictLive ? "1" : "0",
    });
    return apiRequest<OddsLightFeedResponse>(`/api/odds?${q}`);
  },
};
