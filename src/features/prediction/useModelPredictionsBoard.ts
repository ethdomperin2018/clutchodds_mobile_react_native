import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { predictionsApi } from "@/lib/api/endpoints/predictions";
import { buildModelPredictionsListEmptyCopy } from "@/lib/modelPredictions/emptyCopy";
import {
  predictionSlateToday,
  shiftSlateDate,
  summarizePredictionRecord,
  type PredictionHistoryRecord,
  type PredictionHistoryRow,
} from "@/lib/predictions/history";
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

function comparePredictionRows(
  a: PredictionHistoryRow,
  b: PredictionHistoryRow
): number {
  if (a.winProb !== b.winProb) return b.winProb - a.winProb;
  const confA = displayConfidenceScore(a.confidenceScore);
  const confB = displayConfidenceScore(b.confidenceScore);
  if (confA !== confB) return confB - confA;
  return (b.modelEdge ?? -Infinity) - (a.modelEdge ?? -Infinity);
}

const EMPTY_RECORD: PredictionHistoryRecord = {
  wins: 0,
  losses: 0,
  pushes: 0,
  pending: 0,
  winRate: null,
};

export function useModelPredictionsBoard(options: {
  enabled?: boolean;
  earliestDate?: string | null;
}) {
  const { enabled = true, earliestDate = null } = options;

  const [slateDate, setSlateDate] = useState(predictionSlateToday);
  const [today, setToday] = useState(predictionSlateToday);
  const [historyRows, setHistoryRows] = useState<PredictionHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | undefined>();
  const [sportTab, setSportTab] = useState(ALL_SPORTS);
  const [minEdge, setMinEdge] = useState<string>(DEFAULT_MIN_EDGE);
  const [minConfidence, setMinConfidence] = useState(DEFAULT_MIN_CONFIDENCE);
  const [search, setSearch] = useState("");
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [sort, setSort] = useState<PredictionSortKey>("win");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const loadSeqRef = useRef(0);

  const load = useCallback(
    async (date: string) => {
      if (!enabled) return;
      const seq = ++loadSeqRef.current;
      const isCurrent = () => loadSeqRef.current === seq;

      setLoading(true);
      setHistoryRows([]);
      try {
        const json = await predictionsApi.history(date);
        if (!isCurrent()) return;
        setError(null);
        setErrorCode(undefined);
        setToday(json.today);
        setHistoryRows(json.rows);
      } catch (e) {
        if (!isCurrent()) return;
        setHistoryRows([]);
        setError(e instanceof Error ? e.message : "Failed to load predictions");
        setErrorCode(e instanceof ApiError ? e.code : undefined);
      } finally {
        if (!isCurrent()) return;
        setLoading(false);
        setInitialLoadComplete(true);
      }
    },
    [enabled]
  );

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      setInitialLoadComplete(false);
      return;
    }
    void load(slateDate);
  }, [enabled, load, slateDate]);

  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, [enabled]);

  const sportScopedRows = useMemo(() => {
    if (sportTab === ALL_SPORTS) return historyRows;
    return historyRows.filter((row) => row.sportKey === sportTab);
  }, [historyRows, sportTab]);

  const visibleRecord = useMemo(
    () => summarizePredictionRecord(sportScopedRows),
    [sportScopedRows]
  );

  const filteredRows = useMemo(() => {
    return sportScopedRows.filter((row) => {
      if (!meetsMinConfidence(row.confidenceScore, minConfidence)) return false;
      if (minEdge === "all") return true;
      if (row.modelEdge == null) return false;
      return meetsModelEdgeMin(row.modelEdge, minEdge);
    });
  }, [sportScopedRows, minConfidence, minEdge]);

  const featuredEmptyMessage =
    slateDate === today
      ? "No engine predictions for today."
      : "No engine predictions saved for this date.";

  const featuredTitle =
    slateDate === today ? "Top Prediction Right Now" : "Top Prediction";

  const top = useMemo(() => {
    const upcoming =
      slateDate === today
        ? filteredRows.filter((row) => row.outcome === "pending")
        : [];
    const pool = upcoming.length > 0 ? upcoming : filteredRows;
    if (pool.length === 0) return null;
    return pool.reduce((best, row) =>
      comparePredictionRows(row, best) < 0 ? row : best
    );
  }, [filteredRows, slateDate, today]);

  const rows = useMemo(() => {
    const sorted = [...filteredRows];
    sorted.sort((a, b) => {
      let cmp = 0;
      if (sort === "win") {
        cmp = comparePredictionRows(a, b);
        return sortDir === "desc" ? cmp : -cmp;
      }
      if (sort === "edge") {
        if (a.modelEdge == null && b.modelEdge == null) cmp = 0;
        else if (a.modelEdge == null) return 1;
        else if (b.modelEdge == null) return -1;
        else cmp = a.modelEdge - b.modelEdge;
      } else if (sort === "start") {
        cmp =
          new Date(a.commenceTime).getTime() - new Date(b.commenceTime).getTime();
      } else {
        cmp =
          displayConfidenceScore(a.confidenceScore) -
          displayConfidenceScore(b.confidenceScore);
      }
      return sortDir === "desc" ? -cmp : cmp;
    });
    return sorted;
  }, [filteredRows, sort, sortDir]);

  const searched = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => {
      const hay =
        `${row.awayTeam} ${row.homeTeam} ${row.favoriteTeam} ${row.sportTitle}`.toLowerCase();
      return hay.includes(q);
    });
  }, [rows, search]);

  const listEmptyMessage = useMemo(() => {
    const q = search.trim();
    if (q && rows.length > 0) {
      return buildModelPredictionsListEmptyCopy({
        searchQuery: search,
        preSearchCount: rows.length,
      });
    }
    return slateDate === today
      ? "No predictions for today."
      : "No predictions saved for this date.";
  }, [search, rows.length, slateDate, today]);

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

  const stepSlateDate = useCallback(
    (days: number) => {
      setSlateDate((current) => {
        const next = shiftSlateDate(current, days);
        if (days > 0 && next > today) return current;
        if (earliestDate && next < earliestDate) return current;
        return next;
      });
    },
    [earliestDate, today]
  );

  const selectSlateDate = useCallback(
    (next: string) => {
      if (next > today) return;
      if (earliestDate && next < earliestDate) return;
      setSlateDate(next);
    },
    [earliestDate, today]
  );

  return {
    loading,
    initialLoadComplete,
    error,
    errorCode,
    nowMs,
    slateDate,
    earliestDate,
    setSlateDate: selectSlateDate,
    today,
    stepSlateDate,
    visibleRecord: loading ? EMPTY_RECORD : visibleRecord,
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
    top,
    searched,
    featuredEmptyMessage,
    featuredTitle,
    listEmptyMessage,
  };
}

export type ModelPredictionsBoard = ReturnType<typeof useModelPredictionsBoard>;
