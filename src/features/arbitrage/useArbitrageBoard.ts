import { useCallback, useEffect, useMemo, useState } from "react";
import { router } from "expo-router";
import { betsApi } from "@/lib/api/endpoints/bets";
import { oddsApi } from "@/lib/api/endpoints/odds";
import { queryClient } from "@/lib/query/query-client";
import { parseArbEventIdFromNotes } from "@/lib/arbBetNotes";
import {
  computeArbitrageSummary,
  filterArbsByViewTab,
} from "@/lib/arbitrage/summary";
import {
  arbMatchesTimeRange,
  type ArbitrageTimeRange,
} from "@/lib/arbitrage/timeRange";
import { TRACKED_BOOKMAKER_KEYS } from "@/lib/bookmakerDisplay";
import { arbRoiPercent } from "@/lib/format";
import {
  quoteFromOpportunity,
  resolveEventQuote,
  type EventQuote,
} from "@/lib/odds/eventQuote";
import {
  filterArbsByBooks,
  filterArbsByQuoteSync,
  filterArbsBySports,
  normalizeBookKey,
} from "@/lib/odds/filterArbs";
import {
  getGameArbStatus,
  suggestStakeForTheoreticalGames,
} from "@/lib/odds/gameArbStatus";
import { DEFAULT_MAX_LEG_SKEW_MIN } from "@/lib/odds/oddsAge";
import {
  DEFAULT_ARB_UI_REFRESH_SEC,
  parseIntervalSec,
} from "@/lib/odds/refreshInterval";
import type { ArbitrageOpportunity, OddsLightFeedResponse } from "@/lib/odds/types";
import { SCANNER_SPORT_TABS } from "@/lib/scanner/sportTabs";
import { meetsMinPercent2 } from "@/lib/valueBets/format";

export type ArbSort = "roi_desc" | "roi_asc" | "start_asc" | "start_desc";
export type ViewTab = "live" | "upcoming";

export type ArbitrageSidebarFilters = {
  minRoi: string;
  maxLineAgeGapMin: string;
  timeRange: ArbitrageTimeRange;
};

export const DEFAULT_ARB_SIDEBAR_FILTERS: ArbitrageSidebarFilters = {
  minRoi: "0",
  maxLineAgeGapMin: String(DEFAULT_MAX_LEG_SKEW_MIN),
  timeRange: "all",
};

export const MIN_ROI_FILTER_OPTIONS = ["0", "1", "2", "3", "4", "5"] as const;
export const MAX_LINE_AGE_GAP_OPTIONS = ["all", "1", "2", "3", "4", "5"];
export const TIME_RANGE_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "all", label: "All" },
] as const;

export const ARB_SORT_OPTIONS: ReadonlyArray<{ value: ArbSort; label: string }> = [
  { value: "roi_desc", label: "ROI (high to low)" },
  { value: "roi_asc", label: "ROI (low to high)" },
  { value: "start_asc", label: "Start time (soonest)" },
  { value: "start_desc", label: "Start time (latest)" },
];

const ALL_SPORTS_TAB = "all";

type RecalcEntry = {
  quote?: EventQuote;
  error?: string;
};

function formatUpdatedAgo(ms: number): string {
  const sec = Math.max(0, Math.floor(ms / 1000));
  if (sec === 0) return "just now";
  if (sec === 1) return "1 second ago";
  if (sec < 60) return `${sec} seconds ago`;
  const min = Math.floor(sec / 60);
  return min === 1 ? "1 minute ago" : `${min} minutes ago`;
}

function sortArbs(list: ArbitrageOpportunity[], arbSort: ArbSort) {
  const next = [...list];
  next.sort((a, b) => {
    if (arbSort === "roi_desc") return arbRoiPercent(b) - arbRoiPercent(a);
    if (arbSort === "roi_asc") return arbRoiPercent(a) - arbRoiPercent(b);
    if (arbSort === "start_asc") {
      return new Date(a.commenceTime).getTime() - new Date(b.commenceTime).getTime();
    }
    return new Date(b.commenceTime).getTime() - new Date(a.commenceTime).getTime();
  });
  return next;
}

export function useArbitrageBoard() {
  const [totalStake, setTotalStake] = useState("1000");
  const [data, setData] = useState<OddsLightFeedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshIntervalSec, setRefreshIntervalSec] = useState(
    String(DEFAULT_ARB_UI_REFRESH_SEC)
  );
  const [sidebarFilters, setSidebarFilters] = useState<ArbitrageSidebarFilters>(
    DEFAULT_ARB_SIDEBAR_FILTERS
  );
  const [arbSort, setArbSort] = useState<ArbSort>("roi_desc");
  const [viewTab, setViewTab] = useState<ViewTab>("live");
  const [selectedBooks, setSelectedBooks] = useState<Set<string>>(() => new Set());
  const [selectedSports, setSelectedSports] = useState<Set<string>>(() => new Set());
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [originalByEvent, setOriginalByEvent] = useState<Record<string, EventQuote>>({});
  const [recalcByEvent, setRecalcByEvent] = useState<Record<string, RecalcEntry>>({});
  const [recalculatingId, setRecalculatingId] = useState<string | null>(null);
  const [loggingEventId, setLoggingEventId] = useState<string | null>(null);
  const [loggedEventIds, setLoggedEventIds] = useState<Set<string>>(() => new Set());
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [logError, setLogError] = useState<{
    eventId: string;
    message: string;
  } | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    variant: "success" | "error" | "info";
  } | null>(null);

  const minRoiPercent = sidebarFilters.minRoi;
  const timeRange = sidebarFilters.timeRange;
  const maxLegSkewMin = sidebarFilters.maxLineAgeGapMin;

  const stakeNum = useMemo(() => {
    const n = Number(totalStake);
    return Number.isFinite(n) && n > 0 ? n : 1000;
  }, [totalStake]);

  const pollIntervalSec = useMemo(
    () => parseIntervalSec(refreshIntervalSec, DEFAULT_ARB_UI_REFRESH_SEC),
    [refreshIntervalSec]
  );

  const minRoi = useMemo(() => {
    const n = Number(minRoiPercent);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  }, [minRoiPercent]);

  const maxLegSkewMs = useMemo(() => {
    if (maxLegSkewMin === "all") {
      return DEFAULT_MAX_LEG_SKEW_MIN * 60_000;
    }
    const n = Number(maxLegSkewMin);
    return Number.isFinite(n) && n >= 1
      ? Math.floor(n) * 60_000
      : DEFAULT_MAX_LEG_SKEW_MIN * 60_000;
  }, [maxLegSkewMin]);

  const dismissToast = useCallback(() => setToast(null), []);

  const lineAgeGapFilterActive = maxLegSkewMin !== "all";

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedBooks.size > 0) count += 1;
    if (sidebarFilters.minRoi !== DEFAULT_ARB_SIDEBAR_FILTERS.minRoi) count += 1;
    if (maxLegSkewMin !== DEFAULT_ARB_SIDEBAR_FILTERS.maxLineAgeGapMin) count += 1;
    if (sidebarFilters.timeRange !== DEFAULT_ARB_SIDEBAR_FILTERS.timeRange) {
      count += 1;
    }
    return count;
  }, [selectedBooks.size, sidebarFilters.minRoi, sidebarFilters.timeRange, maxLegSkewMin]);

  const toggleBook = useCallback((bookKey: string) => {
    setSelectedBooks((prev) => {
      const next = new Set(prev);
      const key = normalizeBookKey(bookKey);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const selectAllBooks = useCallback(
    () => setSelectedBooks(new Set(TRACKED_BOOKMAKER_KEYS.map((k) => normalizeBookKey(k)))),
    []
  );
  const clearAllBooks = useCallback(() => setSelectedBooks(new Set()), []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const json = await betsApi.list();
        const ids = new Set<string>();
        for (const bet of json.bets ?? []) {
          const eventId = parseArbEventIdFromNotes(bet.notes);
          if (eventId) ids.add(eventId);
        }
        if (!cancelled) setLoggedEventIds(ids);
      } catch {
        // Non-fatal
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const load = useCallback(async (options?: { light?: boolean }) => {
    setLoading(true);
    try {
      const json = await oddsApi.getArbFeed(stakeNum, options?.light !== false);
      setData(json);
      setRecalcByEvent({});
      const fetchedAt = json.fetchedAt ?? new Date().toISOString();
      setOriginalByEvent(
        Object.fromEntries(
          (json.arbitrageOpportunities ?? []).map((arb) => [
            arb.eventId,
            quoteFromOpportunity(arb, fetchedAt),
          ])
        )
      );
      setLastUpdatedAt(Date.now());
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to load odds";
      const code = e instanceof ApiError ? e.code : undefined;
      setData({ error: message, errorCode: code });
    } finally {
      setLoading(false);
    }
  }, [stakeNum]);

  useEffect(() => {
    void load({ light: true });
  }, [load]);

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => {
      void load({ light: true });
    }, pollIntervalSec * 1000);
    return () => clearInterval(id);
  }, [autoRefresh, pollIntervalSec, load]);

  const allArbs = useMemo(
    () => data?.arbitrageOpportunities ?? [],
    [data?.arbitrageOpportunities]
  );
  const roiArbs = useMemo(
    () => allArbs.filter((a) => meetsMinPercent2(arbRoiPercent(a), minRoi)),
    [allArbs, minRoi]
  );
  const timeArbs = useMemo(() => {
    if (timeRange === "all") return roiArbs;
    return roiArbs.filter((a) =>
      arbMatchesTimeRange(a.commenceTime, timeRange, nowMs)
    );
  }, [roiArbs, timeRange, nowMs]);
  const sportArbs = useMemo(
    () => filterArbsBySports(timeArbs, selectedSports),
    [timeArbs, selectedSports]
  );
  const bookArbs = useMemo(
    () => filterArbsByBooks(sportArbs, selectedBooks),
    [sportArbs, selectedBooks]
  );
  const bookArbsForSummary = useMemo(
    () => filterArbsByBooks(timeArbs, selectedBooks),
    [timeArbs, selectedBooks]
  );
  const arbs = useMemo(
    () =>
      filterArbsByQuoteSync(
        bookArbs,
        data?.fetchedAt,
        maxLegSkewMs,
        lineAgeGapFilterActive
      ),
    [bookArbs, data?.fetchedAt, maxLegSkewMs, lineAgeGapFilterActive]
  );
  const arbsForSummary = useMemo(
    () =>
      filterArbsByQuoteSync(
        bookArbsForSummary,
        data?.fetchedAt,
        maxLegSkewMs,
        lineAgeGapFilterActive
      ),
    [bookArbsForSummary, data?.fetchedAt, maxLegSkewMs, lineAgeGapFilterActive]
  );

  const hiddenByQuoteSync = bookArbs.length - arbs.length;
  const bookFilterActive = selectedBooks.size > 0;
  const sportFilterActive = selectedSports.size > 0;
  const games = data?.games ?? [];

  const liveArbs = useMemo(
    () => filterArbsByViewTab(arbs, "live", nowMs),
    [arbs, nowMs]
  );
  const upcomingArbs = useMemo(
    () => filterArbsByViewTab(arbs, "upcoming", nowMs),
    [arbs, nowMs]
  );
  const sortedLiveArbs = useMemo(
    () => sortArbs(liveArbs, arbSort),
    [liveArbs, arbSort]
  );
  const sortedUpcomingArbs = useMemo(
    () => sortArbs(upcomingArbs, arbSort),
    [upcomingArbs, arbSort]
  );

  const summary = useMemo(
    () => computeArbitrageSummary(arbsForSummary, nowMs),
    [arbsForSummary, nowMs]
  );

  const theoreticalStakeHint = useMemo(() => {
    if (!data?.fetchedAt) return null;
    const theoretical = games.filter(
      (g) => getGameArbStatus(g, stakeNum, data.fetchedAt!).status === "theoretical"
    );
    if (theoretical.length === 0) return null;
    const suggested = suggestStakeForTheoreticalGames(
      theoretical,
      data.fetchedAt,
      stakeNum
    );
    return { count: theoretical.length, suggested };
  }, [games, data?.fetchedAt, stakeNum]);

  const currentQuote = useCallback(
    (arb: ArbitrageOpportunity): EventQuote => {
      const entry = recalcByEvent[arb.eventId];
      if (entry?.quote) return entry.quote;
      return quoteFromOpportunity(
        arb,
        data?.fetchedAt ?? new Date().toISOString()
      );
    },
    [recalcByEvent, data?.fetchedAt]
  );

  const originalQuote = useCallback(
    (arb: ArbitrageOpportunity): EventQuote =>
      originalByEvent[arb.eventId] ??
      quoteFromOpportunity(arb, data?.fetchedAt ?? new Date().toISOString()),
    [originalByEvent, data?.fetchedAt]
  );

  const recalculateArb = useCallback(async (eventId: string) => {
    setRecalculatingId(eventId);
    try {
      const json = await oddsApi.getArbFeed(stakeNum, true);
      const fetchedAt = json.fetchedAt ?? new Date().toISOString();
      const quote = resolveEventQuote({
        eventId,
        totalStake: stakeNum,
        fetchedAt,
        opportunities: json.arbitrageOpportunities ?? [],
        games: json.games ?? [],
      });
      if (!quote) {
        setRecalcByEvent((prev) => ({
          ...prev,
          [eventId]: { error: "Game not found in latest odds feed." },
        }));
        return;
      }
      setRecalcByEvent((prev) => ({ ...prev, [eventId]: { quote } }));
      setData(json);
      setLastUpdatedAt(Date.now());
    } catch (e) {
      setRecalcByEvent((prev) => ({
        ...prev,
        [eventId]: {
          error: e instanceof Error ? e.message : "Recalculate failed",
        },
      }));
    } finally {
      setRecalculatingId(null);
    }
  }, [stakeNum]);

  const logBet = useCallback(async (arb: ArbitrageOpportunity): Promise<boolean> => {
    if (loggingEventId || loggedEventIds.has(arb.eventId)) return false;
    setLogError(null);
    setLoggingEventId(arb.eventId);
    try {
      await betsApi.logFromArb(arb);
      setLoggedEventIds((prev) => new Set(prev).add(arb.eventId));
      await queryClient.invalidateQueries({ queryKey: ["bets"] });
      setToast({ message: "Bet logged — opening My Bets.", variant: "success" });
      setTimeout(() => {
        router.push("/(app)/(tabs)/my-bets");
      }, 400);
      return true;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to log bet.";
      if (message.includes("already in your bet log")) {
        setLoggedEventIds((prev) => new Set(prev).add(arb.eventId));
        setLogError({
          eventId: arb.eventId,
          message: "Already logged — this arb is in My Bets.",
        });
        setToast({
          message: "Already logged — this arb is in My Bets.",
          variant: "info",
        });
        return false;
      }
      setLogError({ eventId: arb.eventId, message });
      setToast({ message, variant: "error" });
      return false;
    } finally {
      setLoggingEventId(null);
    }
  }, [loggingEventId, loggedEventIds]);

  const emptyArbCopy = useMemo(() => {
    if (bookArbs.length > 0 && hiddenByQuoteSync > 0) {
      return `${bookArbs.length} arb(s) found but none have legs updated within ${maxLegSkewMs / 60_000} minutes of each other. Widen max line age gap or refresh.`;
    }
    if (sportArbs.length > 0 && bookFilterActive) {
      return `${sportArbs.length} arb(s) found but none use only your selected sportsbooks. Adjust the book filter or clear it.`;
    }
    if (timeArbs.length > 0 && sportFilterActive) {
      return `${timeArbs.length} arb(s) found but none match your selected sports. Adjust the sport filter or clear it.`;
    }
    if (roiArbs.length > 0 && timeRange !== "all") {
      return `${roiArbs.length} arb(s) found but none are live or scheduled today. Switch Time Range to All or refresh.`;
    }
    if (allArbs.length > 0 && minRoi > 0) {
      return `${allArbs.length} arb(s) found but none meet ROI ≥ ${minRoi}%. Lower the filter or refresh.`;
    }
    return `No cross-book arb on this snapshot (${games.length} games). Arbs are rare — try full refresh after line moves.`;
  }, [
    bookArbs.length,
    hiddenByQuoteSync,
    maxLegSkewMs,
    sportArbs.length,
    bookFilterActive,
    timeArbs.length,
    sportFilterActive,
    roiArbs.length,
    timeRange,
    allArbs.length,
    minRoi,
    games.length,
  ]);

  const activeSportTab =
    selectedSports.size === 1 ? [...selectedSports][0]! : ALL_SPORTS_TAB;

  const onSportTabChange = useCallback((key: string) => {
    setSelectedSports(key === ALL_SPORTS_TAB ? new Set() : new Set([key]));
  }, []);

  const resetArbFilters = useCallback(() => {
    setSidebarFilters(DEFAULT_ARB_SIDEBAR_FILTERS);
    setSelectedBooks(new Set());
  }, []);

  const updatedAgoLabel =
    lastUpdatedAt === null ? null : formatUpdatedAgo(nowMs - lastUpdatedAt);
  const staleUpdate =
    lastUpdatedAt !== null &&
    Math.floor((nowMs - lastUpdatedAt) / 1000) > 30;

  const listedArbs = viewTab === "live" ? sortedLiveArbs : sortedUpcomingArbs;

  return {
    totalStake,
    setTotalStake,
    loading,
    autoRefresh,
    setAutoRefresh,
    refreshIntervalSec,
    setRefreshIntervalSec,
    sidebarFilters,
    setSidebarFilters,
    arbSort,
    setArbSort,
    viewTab,
    setViewTab,
    selectedBooks,
    toggleBook,
    selectAllBooks,
    clearAllBooks,
    selectedSports,
    stakeNum,
    nowMs,
    data,
    summary,
    theoreticalStakeHint,
    liveArbs,
    upcomingArbs,
    listedArbs,
    emptyArbCopy,
    arbsCount: arbs.length,
    loadingInitial: loading && data === null,
    refreshing: loading && data !== null,
    currentQuote,
    originalQuote,
    recalculateArb,
    logBet,
    logError,
    toast,
    dismissToast,
    recalculatingId,
    recalcByEvent,
    loggingEventId,
    loggedEventIds,
    expandedEventId,
    setExpandedEventId,
    filtersOpen,
    setFiltersOpen,
    activeFilterCount,
    activeSportTab,
    onSportTabChange,
    sportTabs: SCANNER_SPORT_TABS,
    resetArbFilters,
    updatedAgoLabel,
    staleUpdate,
    load,
  };
}
