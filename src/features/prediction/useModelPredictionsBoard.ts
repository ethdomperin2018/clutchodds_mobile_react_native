import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { oddsApi } from "@/lib/api/endpoints/odds";
import { refreshAuthIfProDenied } from "@/lib/auth/subscriptionRefresh";
import {
  buildModelPredictionRows,
  compareModelPredictionRowsByTop,
  pickTopModelPredictionRow,
  uniqueEngineEventsForPredictionFetch,
  type ModelPredictionRow,
} from "@/lib/modelPredictions/modelPredictionRows";
import {
  buildModelPredictionsFeaturedEmptyCopy,
  buildModelPredictionsListEmptyCopy,
} from "@/lib/modelPredictions/emptyCopy";
import { fetchEnginePredictionsWithCache } from "@/lib/predictions/fetchEnginePredictions";
import {
  lineShopPickToEnginePredictionInput,
} from "@/lib/predictions/rows";
import type { SportPredictionLookupResult } from "@/lib/predictions/types";
import { isEligibleSportPredictionWindow } from "@/lib/predictions/window";
import {
  DEFAULT_ARB_UI_REFRESH_SEC,
  parseIntervalSec,
} from "@/lib/odds/refreshInterval";
import type { LineShopPick } from "@/lib/odds/types";
import { isEnginePick } from "@/lib/valueBets/engineEliteInsights";
import type { AuthUser } from "@/types/auth";
import {
  displayConfidenceScore,
  meetsMinConfidence,
  meetsModelEdgeMin,
} from "@/lib/valueBets/format";

export const ALL_SPORTS = "all";
export const DEFAULT_MIN_EDGE = "all";
export const DEFAULT_MIN_CONFIDENCE = 0;

export type PredictionSortKey = "win" | "confidence" | "edge" | "start";

export const MIN_EDGE_OPTIONS = [
  { value: "all", label: "All" },
  { value: "0", label: "0%" },
  { value: "1", label: "1%" },
  { value: "2", label: "2%" },
  { value: "3", label: "3%" },
  { value: "4", label: "4%" },
  { value: "5", label: "5%" },
] as const;

export const MIN_CONFIDENCE_OPTIONS = [
  { value: "0", label: "0/10" },
  { value: "5", label: "5/10" },
  { value: "6", label: "6/10" },
  { value: "7", label: "7/10" },
  { value: "8", label: "8/10" },
  { value: "9", label: "9/10" },
] as const;

export const PREDICTION_SORT_OPTIONS = [
  { value: "win", label: "Best Matchup" },
  { value: "confidence", label: "Confidence" },
  { value: "edge", label: "Model Edge" },
  { value: "start", label: "Start Time" },
] as const satisfies ReadonlyArray<{
  value: PredictionSortKey;
  label: string;
}>;

export function defaultSortDirForKey(
  key: PredictionSortKey
): "asc" | "desc" {
  return key === "start" ? "asc" : "desc";
}

function formatUpdatedAgo(ms: number): string {
  const sec = Math.max(0, Math.floor(ms / 1000));
  if (sec === 0) return "just now";
  if (sec === 1) return "1 second ago";
  if (sec < 60) return `${sec} seconds ago`;
  const min = Math.floor(sec / 60);
  return min === 1 ? "1 minute ago" : `${min} minutes ago`;
}

export type FreshnessTone = "fresh" | "warm" | "stale" | "idle";

export function freshnessTone(ms: number): FreshnessTone {
  const sec = Math.max(0, Math.floor(ms / 1000));
  if (sec <= 10) return "fresh";
  if (sec <= 30) return "warm";
  return "stale";
}

export function useModelPredictionsBoard(options: {
  userId: string | null;
  enabled?: boolean;
  refresh?: () => Promise<AuthUser | null>;
}) {
  const { userId, enabled = true, refresh } = options;

  const [picks, setPicks] = useState<LineShopPick[]>([]);
  const [predictions, setPredictions] = useState<
    Record<string, SportPredictionLookupResult | null>
  >({});
  const [loading, setLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [predictionsWarning, setPredictionsWarning] = useState<string | null>(
    null
  );
  const [errorCode, setErrorCode] = useState<string | undefined>();
  const [errorTitle, setErrorTitle] = useState<string | undefined>();
  const [sportTab, setSportTab] = useState(ALL_SPORTS);
  const [minEdge, setMinEdge] = useState<string>(DEFAULT_MIN_EDGE);
  const [minConfidence, setMinConfidence] = useState(DEFAULT_MIN_CONFIDENCE);
  const [search, setSearch] = useState("");
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [sort, setSort] = useState<PredictionSortKey>("win");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshIntervalSec, setRefreshIntervalSec] = useState(
    String(DEFAULT_ARB_UI_REFRESH_SEC)
  );
  const loadSeqRef = useRef(0);

  const pollIntervalSec = useMemo(
    () => parseIntervalSec(refreshIntervalSec, DEFAULT_ARB_UI_REFRESH_SEC),
    [refreshIntervalSec]
  );

  const load = useCallback(async () => {
    if (!enabled) return;
    const seq = ++loadSeqRef.current;
    const isCurrent = () => loadSeqRef.current === seq;

    setLoading(true);
    try {
      const json = await oddsApi.getLightFeed(1000, 0);
      if (!isCurrent()) return;
      if (json.error) {
        setError(json.error);
        setErrorCode(json.errorCode);
        setErrorTitle(json.errorTitle);
        return;
      }

      setError(null);
      setErrorCode(undefined);
      setErrorTitle(undefined);
      setPredictionsWarning(null);

      const next = (json.lineShopPicks ?? []).filter(isEnginePick);
      setPicks(next);

      const eligible = uniqueEngineEventsForPredictionFetch(next).filter((p) =>
        isEligibleSportPredictionWindow(p.commenceTime, new Date())
      );
      if (eligible.length === 0) {
        setPredictions({});
        setLastUpdatedAt(Date.now());
        return;
      }

      const items = eligible.map((p) => {
        const input = lineShopPickToEnginePredictionInput(p);
        return {
          key: input.key,
          homeTeam: input.homeTeam,
          awayTeam: input.awayTeam,
          commenceTime: p.commenceTime,
          sportKey: input.sportKey,
        };
      });

      try {
        const nextPredictions = await fetchEnginePredictionsWithCache(items, {
          userId,
          refresh,
          onCached: (cached) => {
            if (!isCurrent()) return;
            if (Object.keys(cached).length > 0) {
              // Merge — never replace the whole map with a partial cache hit set.
              setPredictions((prev) => ({ ...prev, ...cached }));
              // Refresh should reset "Updated Xs ago" as soon as the board can paint.
              setLastUpdatedAt(Date.now());
              // Board can paint from cache; don't keep the Refresh button spinning
              // while the remaining prediction network fetch finishes.
              setLoading(false);
              setInitialLoadComplete(true);
            }
          },
        });
        if (!isCurrent()) return;
        setPredictions((prev) => {
          const merged = { ...prev };
          for (const [key, value] of Object.entries(nextPredictions)) {
            if (value != null) merged[key] = value;
            else if (!(key in merged)) merged[key] = null;
          }
          return merged;
        });
      } catch (e) {
        if (!isCurrent()) return;
        const message =
          e instanceof Error
            ? e.message
            : "Could not load model predictions from the sports data database.";
        const planDenied =
          /elite|pro subscription|subscription required/i.test(message);
        setPredictionsWarning(
          planDenied
            ? "Elite access is required for model predictions. Your plan may have expired — upgrade or renew to continue."
            : message
        );
      }
      if (!isCurrent()) return;
      setLastUpdatedAt(Date.now());
    } catch (e) {
      if (!isCurrent()) return;
      if (refresh && (await refreshAuthIfProDenied(e, refresh))) return;
      const message =
        e instanceof Error ? e.message : "Failed to load predictions";
      setError(message);
      setErrorCode(e instanceof ApiError ? e.code : undefined);
    } finally {
      if (!isCurrent()) return;
      setLoading(false);
      setInitialLoadComplete(true);
    }
  }, [enabled, userId, refresh]);

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

  const allPredictionRows = useMemo(
    () =>
      buildModelPredictionRows(picks, predictions, new Date(nowMs), nowMs),
    [picks, predictions, nowMs]
  );

  const sportScopedRows = useMemo(() => {
    if (sportTab === ALL_SPORTS) return allPredictionRows;
    return allPredictionRows.filter((row) => row.pick.sportKey === sportTab);
  }, [allPredictionRows, sportTab]);

  const filteredRows = useMemo(() => {
    return sportScopedRows.filter((row) => {
      if (!meetsMinConfidence(row.insights.confidenceScore, minConfidence)) {
        return false;
      }
      if (!meetsModelEdgeMin(row.modelEdge, minEdge)) return false;
      return true;
    });
  }, [sportScopedRows, minConfidence, minEdge]);

  const featuredEmptyMessage = buildModelPredictionsFeaturedEmptyCopy();

  const top = useMemo(
    () => pickTopModelPredictionRow(filteredRows),
    [filteredRows]
  );

  const rows = useMemo(() => {
    const sorted = [...filteredRows];
    sorted.sort((a, b) => {
      let cmp = 0;
      if (sort === "win") {
        cmp = compareModelPredictionRowsByTop(a, b);
        return sortDir === "desc" ? cmp : -cmp;
      }
      if (sort === "edge") {
        cmp = a.modelEdge - b.modelEdge;
      } else if (sort === "start") {
        cmp =
          new Date(a.pick.commenceTime).getTime() -
          new Date(b.pick.commenceTime).getTime();
      } else {
        cmp =
          displayConfidenceScore(a.insights.confidenceScore) -
          displayConfidenceScore(b.insights.confidenceScore);
      }
      return sortDir === "desc" ? -cmp : cmp;
    });
    return sorted;
  }, [filteredRows, sort, sortDir]);

  const searched = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const hay =
        `${r.pick.matchup} ${r.favoriteTeam} ${r.pick.sportTitle}`.toLowerCase();
      return hay.includes(q);
    });
  }, [rows, search]);

  const listEmptyMessage = useMemo(
    () =>
      buildModelPredictionsListEmptyCopy({
        searchQuery: search,
        preSearchCount: rows.length,
      }),
    [search, rows.length]
  );

  const updatedAgoLabel =
    lastUpdatedAt === null ? null : formatUpdatedAgo(nowMs - lastUpdatedAt);
  const updatedTone: FreshnessTone =
    lastUpdatedAt === null ? "idle" : freshnessTone(nowMs - lastUpdatedAt);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (minEdge !== DEFAULT_MIN_EDGE) count += 1;
    if (minConfidence !== DEFAULT_MIN_CONFIDENCE) count += 1;
    return count;
  }, [minEdge, minConfidence]);

  const resetFilters = useCallback(() => {
    setMinEdge(DEFAULT_MIN_EDGE);
    setMinConfidence(DEFAULT_MIN_CONFIDENCE);
  }, []);

  const setSortKey = useCallback((key: PredictionSortKey) => {
    setSort(key);
    setSortDir(defaultSortDirForKey(key));
  }, []);

  const toggleSortDir = useCallback(() => {
    setSortDir((prev) => (prev === "desc" ? "asc" : "desc"));
  }, []);

  return {
    loading,
    refreshing: loading && initialLoadComplete,
    initialLoadComplete,
    error,
    errorCode,
    errorTitle,
    predictionsWarning,
    nowMs,
    lastUpdatedAt,
    updatedAgoLabel,
    updatedTone,
    pollIntervalSec,
    autoRefresh,
    setAutoRefresh,
    refreshIntervalSec,
    setRefreshIntervalSec,
    reload: load,
    sportTab,
    setSportTab,
    minEdge,
    setMinEdge,
    minConfidence,
    setMinConfidence,
    activeFilterCount,
    resetFilters,
    search,
    setSearch,
    sort,
    sortDir,
    setSortKey,
    toggleSortDir,
    allPredictionRows,
    filteredRows,
    top,
    searched,
    featuredEmptyMessage,
    listEmptyMessage,
  };
}

export type ModelPredictionsBoard = ReturnType<typeof useModelPredictionsBoard>;
