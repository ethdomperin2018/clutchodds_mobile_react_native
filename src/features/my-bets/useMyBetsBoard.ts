import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { betsApi } from "@/lib/api/endpoints/bets";
import type { ManualBetResult, ManualBetRow } from "@/lib/api/types";
import { refreshAuthIfProDenied } from "@/lib/auth/subscriptionRefresh";
import type { AuthUser } from "@/types/auth";

function formatResultLabel(result: string): string {
  return result.charAt(0).toUpperCase() + result.slice(1);
}

export function useMyBetsBoard(options: {
  enabled: boolean;
  refresh?: () => Promise<AuthUser | null>;
}) {
  const { enabled, refresh } = options;
  const [bets, setBets] = useState<ManualBetRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingBetId, setUpdatingBetId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    variant: "success" | "error";
  } | null>(null);

  const dismissToast = useCallback(() => setToast(null), []);

  const load = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const res = await betsApi.list();
      setBets(res.bets ?? []);
    } catch (e) {
      if (refresh && (await refreshAuthIfProDenied(e, refresh))) return;
      setBets([]);
      setError(
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Failed to load bets"
      );
    } finally {
      setLoading(false);
      setInitialLoadComplete(true);
    }
  }, [enabled, refresh]);

  useEffect(() => {
    if (!enabled) {
      setBets([]);
      setLoading(false);
      setInitialLoadComplete(false);
      setError(null);
      setToast(null);
      return;
    }
    void load();
  }, [enabled, load]);

  const updateResult = useCallback(
    async (id: string, result: ManualBetResult): Promise<boolean> => {
      if (updatingBetId) return false;
      const previous = bets.find((b) => b.id === id)?.result;
      if (previous === result) return false;

      setUpdatingBetId(id);
      setBets((current) =>
        current.map((b) => (b.id === id ? { ...b, result } : b))
      );

      try {
        await betsApi.updateResult(id, result);
        setToast({
          message: `Result updated to ${formatResultLabel(result)}.`,
          variant: "success",
        });
        return true;
      } catch (e) {
        setBets((current) =>
          current.map((b) =>
            b.id === id && previous != null ? { ...b, result: previous } : b
          )
        );
        if (refresh && (await refreshAuthIfProDenied(e, refresh))) return false;
        setToast({
          message:
            e instanceof ApiError
              ? e.message
              : e instanceof Error
                ? e.message
                : "Failed to update result. Please try again.",
          variant: "error",
        });
        return false;
      } finally {
        setUpdatingBetId(null);
      }
    },
    [bets, refresh, updatingBetId]
  );

  return {
    bets,
    loading,
    initialLoadComplete,
    error,
    updatingBetId,
    toast,
    dismissToast,
    reload: load,
    updateResult,
  };
}
