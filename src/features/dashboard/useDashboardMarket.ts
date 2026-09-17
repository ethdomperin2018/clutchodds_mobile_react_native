import { useEffect, useMemo, useState } from "react";
import { oddsApi } from "@/lib/api/endpoints/odds";
import { ApiError } from "@/lib/api/client";
import type {
  PublicArbTeaser,
  PublicLineShopTeaser,
} from "@/lib/api/types";
import { refreshAuthIfProDenied } from "@/lib/auth/subscriptionRefresh";
import {
  buildDashboardMarketFromOdds,
  DASHBOARD_LINE_SHOP_LIMIT,
} from "@/lib/odds/dashboardMarket";
import type { LineShopPick } from "@/lib/odds/types";
import { fetchEnginePredictionsWithCache } from "@/lib/predictions/fetchEnginePredictions";
import {
  buildDashboardPredictionRows,
  compareDashboardPredictionRows,
  lineShopPickToEnginePredictionInput,
  uniqueEngineEventsForPredictionFetch,
  type DashboardPredictionRow,
  type SportPredictionLookupResult,
} from "@/lib/predictions/rows";
import { isEligibleSportPredictionWindow } from "@/lib/predictions/window";
import { usePollingQuery } from "@/lib/query/use-polling-query";
import type { AuthUser } from "@/types/auth";

const REFRESH_MS = 30_000;

export type DashboardMarketView = {
  fetchedAt?: string;
  liveArbCount: number;
  upcomingArbCount: number;
  lineShopPickCount: number;
  lineShopTeasers: PublicLineShopTeaser[];
  bestArbitrageOpportunities: PublicArbTeaser[];
  error?: string;
  errorCode?: string;
  errorTitle?: string;
};

function uniqueEligiblePredictionPicks(picks: LineShopPick[], now: Date) {
  return uniqueEngineEventsForPredictionFetch(picks).filter((pick) =>
    isEligibleSportPredictionWindow(pick.commenceTime, now)
  );
}

async function fetchLightFeedWithAuthRefresh(
  totalStake: number,
  minEdge: number,
  refresh?: () => Promise<AuthUser | null>
) {
  try {
    return await oddsApi.getLightFeed(totalStake, minEdge);
  } catch (error) {
    if (refresh && (await refreshAuthIfProDenied(error, refresh))) {
      throw error instanceof ApiError
        ? error
        : new Error("Pro subscription required.");
    }
    throw error;
  }
}

export function useDashboardMarket(options: {
  ready: boolean;
  pro: boolean;
  elite: boolean;
  userId: string | null;
  refresh?: () => Promise<AuthUser | null>;
}) {
  const { ready, pro, elite, userId, refresh } = options;
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [predictions, setPredictions] = useState<
    Record<string, SportPredictionLookupResult | null>
  >({});
  const [predictionsLoading, setPredictionsLoading] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const snapshotQuery = usePollingQuery({
    queryKey: ["odds", "snapshot", "dashboard"],
    queryFn: () => oddsApi.getSnapshot(1000),
    pollMs: REFRESH_MS,
    enabled: ready && !pro,
  });

  const lightQuery = usePollingQuery({
    queryKey: ["odds", "light", "dashboard"],
    queryFn: () => fetchLightFeedWithAuthRefresh(1000, 0, refresh),
    pollMs: REFRESH_MS,
    enabled: ready && pro,
  });

  const proMarket = useMemo(() => {
    if (!pro || !lightQuery.data) return null;
    const fetchedAt = lightQuery.data.fetchedAt ?? new Date().toISOString();
    return buildDashboardMarketFromOdds(
      fetchedAt,
      lightQuery.data.arbitrageOpportunities ?? [],
      lightQuery.data.lineShopPicks ?? [],
      nowMs
    );
  }, [pro, lightQuery.data, nowMs]);

  const market: DashboardMarketView | null = useMemo(() => {
    if (pro) {
      if (!proMarket) return null;
      return {
        fetchedAt: proMarket.fetchedAt,
        liveArbCount: proMarket.liveArbCount,
        upcomingArbCount: proMarket.upcomingArbCount,
        lineShopPickCount: proMarket.lineShopPickCount,
        lineShopTeasers: proMarket.lineShopTeasers,
        bestArbitrageOpportunities: proMarket.bestArbitrageOpportunities,
        error: lightQuery.data?.error,
        errorCode: lightQuery.data?.errorCode,
        errorTitle: lightQuery.data?.errorTitle,
      };
    }
    if (!snapshotQuery.data) return null;
    return {
      fetchedAt: snapshotQuery.data.fetchedAt,
      liveArbCount: snapshotQuery.data.liveArbCount ?? 0,
      upcomingArbCount: snapshotQuery.data.upcomingArbCount ?? 0,
      lineShopPickCount: snapshotQuery.data.lineShopPickCount ?? 0,
      lineShopTeasers: snapshotQuery.data.lineShopTeasers ?? [],
      bestArbitrageOpportunities:
        snapshotQuery.data.bestArbitrageOpportunities ??
        snapshotQuery.data.arbitrageOpportunities ??
        [],
      error: snapshotQuery.data.error,
      errorCode: snapshotQuery.data.errorCode,
      errorTitle: snapshotQuery.data.errorTitle,
    };
  }, [pro, proMarket, lightQuery.data, snapshotQuery.data]);

  const rawPicks = lightQuery.data?.lineShopPicks ?? [];

  const predictionItems = useMemo(() => {
    if (!elite || !pro) return [];
    return uniqueEligiblePredictionPicks(rawPicks, new Date(nowMs)).map(
      lineShopPickToEnginePredictionInput
    );
  }, [elite, pro, rawPicks, nowMs]);

  const predictionItemsKey = predictionItems.map((item) => item.key).join(",");

  useEffect(() => {
    if (!elite || !pro) {
      setPredictions({});
      setPredictionsLoading(false);
      return;
    }

    if (predictionItems.length === 0) {
      setPredictions({});
      setPredictionsLoading(false);
      return;
    }

    let cancelled = false;
    setPredictionsLoading(true);

    void (async () => {
      try {
        const next = await fetchEnginePredictionsWithCache(predictionItems, {
          userId,
          refresh,
          onCached: (cached) => {
            if (!cancelled) {
              setPredictions(cached);
              setPredictionsLoading(false);
            }
          },
        });
        if (!cancelled) {
          setPredictions(next);
        }
      } catch {
        // Keep whatever cache painted; don't wipe the KPI.
      } finally {
        if (!cancelled) setPredictionsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // predictionItemsKey captures identity without re-running every nowMs tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elite, pro, userId, predictionItemsKey, rawPicks.length, refresh]);

  const allPredictionRows: DashboardPredictionRow[] = useMemo(() => {
    if (!elite || !pro) return [];
    const rows = buildDashboardPredictionRows(
      rawPicks,
      predictions,
      new Date(nowMs),
      nowMs
    );
    return [...rows].sort(compareDashboardPredictionRows);
  }, [elite, pro, rawPicks, predictions, nowMs]);

  /** Best Prediction tab shows top N; KPI uses the full count (same as web). */
  const predictionRows = useMemo(
    () => allPredictionRows.slice(0, DASHBOARD_LINE_SHOP_LIMIT),
    [allPredictionRows]
  );

  const loading =
    (pro ? lightQuery.isLoading : snapshotQuery.isLoading) && !market;
  const refreshing =
    (pro ? lightQuery.isFetching : snapshotQuery.isFetching) && Boolean(market);

  const networkError =
    pro
      ? lightQuery.error instanceof Error
        ? lightQuery.error.message
        : null
      : snapshotQuery.error instanceof Error
        ? snapshotQuery.error.message
        : null;

  const error = market?.error ?? networkError;
  const errorCode = market?.errorCode;
  const errorTitle = market?.errorTitle;

  const showPredictionSkeleton =
    elite &&
    predictionItems.length > 0 &&
    predictionsLoading &&
    allPredictionRows.length === 0;

  return {
    nowMs,
    market,
    loading,
    refreshing,
    error,
    errorCode,
    errorTitle,
    predictionRows,
    predictionsLoading: showPredictionSkeleton,
    modelPredictionCount: allPredictionRows.length,
  };
}
