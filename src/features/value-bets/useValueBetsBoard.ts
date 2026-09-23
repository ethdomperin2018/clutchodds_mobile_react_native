import { useCallback, useEffect, useMemo, useState } from "react";
import { router } from "expo-router";
import { ApiError } from "@/lib/api/client";
import { betsApi } from "@/lib/api/endpoints/bets";
import { oddsApi } from "@/lib/api/endpoints/odds";
import { refreshAuthIfProDenied } from "@/lib/auth/subscriptionRefresh";
import {
  countValueBetsSidebarFilters,
  DEFAULT_SIDEBAR_FILTERS,
  type ValueBetsSidebarFilters,
} from "@/features/value-bets/valueBetsFilters";
import { lineShopPickLogKey } from "@/lib/lineShopBetNotes";
import { applyLineShopDisplayFilters } from "@/lib/odds/filterArbs";
import { DEFAULT_MAX_LEG_SKEW_MIN } from "@/lib/odds/oddsAge";
import {
  DEFAULT_ARB_UI_REFRESH_SEC,
  parseIntervalSec,
} from "@/lib/odds/refreshInterval";
import type { LineShopPick } from "@/lib/odds/types";
import { fetchEnginePredictionsWithCache } from "@/lib/predictions/fetchEnginePredictions";
import { lineShopPickToEnginePredictionInput } from "@/lib/predictions/rows";
import type { SportPredictionLookupResult } from "@/lib/predictions/types";
import { isEligibleSportPredictionWindow } from "@/lib/predictions/window";
import { queryClient } from "@/lib/query/query-client";
import {
  isEnginePick,
  resolvePickEliteInsights,
  type PickEliteInsights,
} from "@/lib/valueBets/engineEliteInsights";
import {
  displayConfidenceScore,
  meetsMinConfidence,
  meetsModelEdgeMin,
  primaryEvPercent,
} from "@/lib/valueBets/format";
import { computeValueBetsSummary } from "@/lib/valueBets/summary";
import type { AuthUser } from "@/types/auth";

/** Same default as web `DEFAULT_MIN_EDGE_PERCENT`. */
const DEFAULT_API_MIN_EDGE = 0;
/** Same as web `DEFAULT_LINE_SHOP_LOG_STAKE`. */
const DEFAULT_LOG_STAKE = "100";

export type ValueBetsViewTab = "live" | "upcoming";

export type ValueBetsBoardTab = "all" | "start" | "trending" | "today";

export type FreshnessTone = "fresh" | "warm" | "stale" | "idle";

function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isPickLive(pick: LineShopPick, nowMs: number): boolean {
  return new Date(pick.commenceTime).getTime() <= nowMs;
}

function filterPicksByBoardTab(
  picks: LineShopPick[],
  boardTab: ValueBetsBoardTab,
  nowMs: number
): LineShopPick[] {
  if (boardTab === "today") {
    const now = new Date(nowMs);
    return picks.filter((pick) =>
      isSameLocalDay(new Date(pick.commenceTime), now)
    );
  }
  return picks;
}

function formatUpdatedAgo(ms: number): string {
  const sec = Math.max(0, Math.floor(ms / 1000));
  if (sec === 0) return "just now";
  if (sec === 1) return "1 second ago";
  if (sec < 60) return `${sec} seconds ago`;
  const min = Math.floor(sec / 60);
  return min === 1 ? "1 minute ago" : `${min} minutes ago`;
}

export function freshnessTone(ms: number): FreshnessTone {
  const sec = Math.max(0, Math.floor(ms / 1000));
  if (sec <= 10) return "fresh";
  if (sec <= 30) return "warm";
  return "stale";
}

function sidebarMinEdgeNumber(minEdge: string): number {
  if (minEdge === "all") return 0;
  const n = Number(minEdge);
  return Number.isFinite(n) ? n : DEFAULT_API_MIN_EDGE;
}

/**
 * Odds feed + sidebar filters + Elite engine predictions + log pick.
 */
export function useValueBetsBoard(options: {
  enabled?: boolean;
  elite?: boolean;
  userId?: string | null;
  refresh?: () => Promise<AuthUser | null>;
}) {
  const { enabled = true, elite = false, userId = null, refresh } = options;

  const [allPicks, setAllPicks] = useState<LineShopPick[]>([]);
  const [fetchedAt, setFetchedAt] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | undefined>();
  const [errorTitle, setErrorTitle] = useState<string | undefined>();
  const [sidebarFilters, setSidebarFilters] = useState<ValueBetsSidebarFilters>(
    DEFAULT_SIDEBAR_FILTERS
  );
  const [viewTab, setViewTab] = useState<ValueBetsViewTab>("live");
  const [boardTab, setBoardTab] = useState<ValueBetsBoardTab>("all");
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshIntervalSec, setRefreshIntervalSec] = useState(
    String(DEFAULT_ARB_UI_REFRESH_SEC)
  );
  const [logStake, setLogStake] = useState(DEFAULT_LOG_STAKE);
  const [strictLive, setStrictLive] = useState(true);
  const [onePickPerGame] = useState(true);
  const [enginePredictions, setEnginePredictions] = useState<
    Record<string, SportPredictionLookupResult | null>
  >({});
  const [predictionsLoading, setPredictionsLoading] = useState(false);
  const [loggingPickKey, setLoggingPickKey] = useState<string | null>(null);
  const [loggedPickKeys, setLoggedPickKeys] = useState<Set<string>>(
    () => new Set()
  );
  const [toast, setToast] = useState<{
    message: string;
    variant: "success" | "error" | "info";
  } | null>(null);
  const dismissToast = useCallback(() => setToast(null), []);

  const pollIntervalSec = useMemo(
    () => parseIntervalSec(refreshIntervalSec, DEFAULT_ARB_UI_REFRESH_SEC),
    [refreshIntervalSec]
  );

  const apiMinEdge = useMemo(
    () => sidebarMinEdgeNumber(sidebarFilters.minEdge),
    [sidebarFilters.minEdge]
  );

  const maxLegSkewMs = useMemo(() => {
    if (sidebarFilters.maxLineAgeGapMin === "all") {
      return DEFAULT_MAX_LEG_SKEW_MIN * 60_000;
    }
    const n = Number(sidebarFilters.maxLineAgeGapMin);
    return Number.isFinite(n) && n >= 1
      ? Math.floor(n) * 60_000
      : DEFAULT_MAX_LEG_SKEW_MIN * 60_000;
  }, [sidebarFilters.maxLineAgeGapMin]);

  const lineAgeGapFilterActive = sidebarFilters.maxLineAgeGapMin !== "all";

  const selectedSports = useMemo(() => {
    if (sidebarFilters.sportKey === "all") return new Set<string>();
    return new Set([sidebarFilters.sportKey]);
  }, [sidebarFilters.sportKey]);

  const minConfidence = useMemo(() => {
    const n = Number(sidebarFilters.minConfidence);
    return Number.isFinite(n) ? n : 0;
  }, [sidebarFilters.minConfidence]);

  const load = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const json = await oddsApi.getLightFeed(1000, apiMinEdge, {
        strictLive,
      });
      if (json.error) {
        setError(json.error);
        setErrorCode(json.errorCode);
        setErrorTitle(json.errorTitle);
        setAllPicks([]);
        setFetchedAt(json.fetchedAt);
        return;
      }

      setError(null);
      setErrorCode(undefined);
      setErrorTitle(undefined);
      setAllPicks(json.lineShopPicks ?? []);
      setFetchedAt(json.fetchedAt);
      setLastUpdatedAt(Date.now());
    } catch (e) {
      if (refresh && (await refreshAuthIfProDenied(e, refresh))) return;
      const message =
        e instanceof Error ? e.message : "Failed to load Value Bets";
      setError(message);
      setErrorCode(e instanceof ApiError ? e.code : undefined);
      setAllPicks([]);
    } finally {
      setLoading(false);
      setInitialLoadComplete(true);
    }
  }, [enabled, apiMinEdge, strictLive, refresh]);

  const loadPredictions = useCallback(
    async (pickList: LineShopPick[]) => {
      if (!elite) {
        setEnginePredictions({});
        setPredictionsLoading(false);
        return;
      }

      const byEvent = new Map<string, LineShopPick>();
      for (const pick of pickList) {
        if (!isEnginePick(pick)) continue;
        if (!isEligibleSportPredictionWindow(pick.commenceTime, new Date())) {
          continue;
        }
        if (!byEvent.has(pick.eventId)) {
          byEvent.set(pick.eventId, pick);
        }
      }

      if (byEvent.size === 0) {
        setEnginePredictions({});
        setPredictionsLoading(false);
        return;
      }

      const items = [...byEvent.values()].map((pick) => {
        const input = lineShopPickToEnginePredictionInput(pick);
        return {
          key: input.key,
          homeTeam: input.homeTeam,
          awayTeam: input.awayTeam,
          commenceTime: pick.commenceTime,
          sportKey: input.sportKey,
        };
      });

      setPredictionsLoading(true);
      try {
        const predictions = await fetchEnginePredictionsWithCache(items, {
          userId,
          refresh,
          onCached: (cached) => {
            if (Object.keys(cached).length > 0) {
              setEnginePredictions((prev) => ({ ...prev, ...cached }));
            }
          },
        });
        setEnginePredictions((prev) => ({ ...prev, ...predictions }));
      } catch {
        // Keep any cache that painted; don't wipe the board.
      } finally {
        setPredictionsLoading(false);
      }
    },
    [elite, userId, refresh]
  );

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      setInitialLoadComplete(false);
      return;
    }
    void load();
  }, [enabled, load]);

  useEffect(() => {
    if (!enabled || !autoRefresh) return;
    const id = setInterval(() => void load(), pollIntervalSec * 1000);
    return () => clearInterval(id);
  }, [enabled, autoRefresh, pollIntervalSec, load]);

  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, [enabled]);

  const basePicks = useMemo(() => {
    // Edge floor uses meetsModelEdgeMin (string): All / 0% (+EV) / ≥ N% —
    // same as web sidebar. Pass 0 into display filters so "0%" is not treated
    // like "all" via meetsMinPercent2(min <= 0 → true).
    const filtered = applyLineShopDisplayFilters(allPicks, {
      minEdge: 0,
      selectedSports,
      selectedBooks: new Set(),
      fetchedAt,
      maxLegSkewMs,
      quoteSyncEnabled: lineAgeGapFilterActive,
      onePickPerGame,
    });
    return filtered.filter((pick) =>
      meetsModelEdgeMin(primaryEvPercent(pick), sidebarFilters.minEdge)
    );
  }, [
    allPicks,
    selectedSports,
    fetchedAt,
    maxLegSkewMs,
    lineAgeGapFilterActive,
    onePickPerGame,
    sidebarFilters.minEdge,
  ]);

  useEffect(() => {
    if (!enabled) return;
    void loadPredictions(basePicks);
  }, [enabled, loadPredictions, basePicks]);

  const resolvePickInsights = useCallback(
    (pick: LineShopPick): PickEliteInsights =>
      resolvePickEliteInsights(pick, enginePredictions, new Date(nowMs)),
    [enginePredictions, nowMs]
  );

  const picks = useMemo(() => {
    // Same as web `filterPicksBySidebarFilters`: apply confidence to every pick.
    // Derived / missing engine scores are 0, so min > 0 hides them.
    if (minConfidence <= 0) return basePicks;
    return basePicks.filter((pick) =>
      meetsMinConfidence(
        resolvePickInsights(pick).confidenceScore,
        minConfidence
      )
    );
  }, [basePicks, minConfidence, resolvePickInsights]);

  const summary = useMemo(() => computeValueBetsSummary(picks), [picks]);

  const boardTabFilteredPicks = useMemo(
    () => filterPicksByBoardTab(picks, boardTab, nowMs),
    [picks, boardTab, nowMs]
  );

  const livePicks = useMemo(
    () => boardTabFilteredPicks.filter((p) => isPickLive(p, nowMs)),
    [boardTabFilteredPicks, nowMs]
  );
  const upcomingPicks = useMemo(
    () => boardTabFilteredPicks.filter((p) => !isPickLive(p, nowMs)),
    [boardTabFilteredPicks, nowMs]
  );

  /** Live/Upcoming badges ignore board categories (All / Trending / Start / Today). */
  const liveCount = useMemo(
    () => picks.filter((p) => isPickLive(p, nowMs)).length,
    [picks, nowMs]
  );
  const upcomingCount = useMemo(
    () => picks.filter((p) => !isPickLive(p, nowMs)).length,
    [picks, nowMs]
  );

  const visiblePicks = useMemo(() => {
    const filtered =
      viewTab === "live" ? livePicks : upcomingPicks;
    const sorted = [...filtered];
    if (boardTab === "trending") {
      sorted.sort((a, b) => {
        const aInsights = resolvePickInsights(a);
        const bInsights = resolvePickInsights(b);
        const confDiff =
          displayConfidenceScore(bInsights.confidenceScore) -
          displayConfidenceScore(aInsights.confidenceScore);
        if (confDiff !== 0) return confDiff;
        return primaryEvPercent(b) - primaryEvPercent(a);
      });
    } else if (boardTab === "start") {
      sorted.sort(
        (a, b) =>
          new Date(a.commenceTime).getTime() -
          new Date(b.commenceTime).getTime()
      );
    } else {
      sorted.sort((a, b) => primaryEvPercent(b) - primaryEvPercent(a));
    }
    return sorted;
  }, [
    viewTab,
    livePicks,
    upcomingPicks,
    boardTab,
    resolvePickInsights,
  ]);

  const activeFilterCount = useMemo(
    () => countValueBetsSidebarFilters(sidebarFilters),
    [sidebarFilters]
  );

  const resetFilters = useCallback(() => {
    setSidebarFilters(DEFAULT_SIDEBAR_FILTERS);
  }, []);

  const logPick = useCallback(
    async (pick: LineShopPick, stake: number): Promise<boolean> => {
      const key = lineShopPickLogKey(pick.eventId, pick.side);
      if (loggingPickKey || loggedPickKeys.has(key)) return false;

      if (!Number.isFinite(stake) || stake <= 0) {
        setToast({ message: "Enter a stake greater than $0.", variant: "error" });
        return false;
      }

      setLoggingPickKey(key);
      try {
        await betsApi.logFromLineShop(pick, stake);
        setLoggedPickKeys((prev) => new Set(prev).add(key));
        await queryClient.invalidateQueries({ queryKey: ["bets"] });
        setToast({
          message: "Pick logged — opening My Bets.",
          variant: "success",
        });
        setTimeout(() => {
          router.push("/(app)/(tabs)/my-bets");
        }, 400);
        return true;
      } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to log pick.";
        if (message.includes("already in your bet log")) {
          setLoggedPickKeys((prev) => new Set(prev).add(key));
          setToast({
            message: "Already logged — this pick is in My Bets.",
            variant: "info",
          });
          return true;
        }
        setToast({ message, variant: "error" });
        throw e;
      } finally {
        setLoggingPickKey(null);
      }
    },
    [loggingPickKey, loggedPickKeys]
  );

  const updatedAgoLabel =
    lastUpdatedAt === null ? null : formatUpdatedAgo(nowMs - lastUpdatedAt);
  const updatedTone: FreshnessTone =
    lastUpdatedAt === null ? "idle" : freshnessTone(nowMs - lastUpdatedAt);

  return {
    allPicks,
    picks,
    summary,
    livePicks,
    upcomingPicks,
    visiblePicks,
    liveCount,
    upcomingCount,
    viewTab,
    setViewTab,
    boardTab,
    setBoardTab,
    sidebarFilters,
    setSidebarFilters,
    activeFilterCount,
    resetFilters,
    loading,
    initialLoadComplete,
    error,
    errorCode,
    errorTitle,
    fetchedAt,
    nowMs,
    autoRefresh,
    setAutoRefresh,
    refreshIntervalSec,
    setRefreshIntervalSec,
    pollIntervalSec,
    logStake,
    setLogStake,
    strictLive,
    setStrictLive,
    reload: load,
    updatedAgoLabel,
    updatedTone,
    elite,
    predictionsLoading,
    resolvePickInsights,
    logPick,
    loggingPickKey,
    loggedPickKeys,
    toast,
    dismissToast,
    primaryEvPercent,
  };
}
