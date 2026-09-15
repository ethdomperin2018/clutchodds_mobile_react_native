import AsyncStorage from "@react-native-async-storage/async-storage";
import { mlbMatchDateFromIso } from "@/lib/predictions/window";
import type {
  EnginePredictionFetchItem,
  SportPredictionLookupResult,
} from "@/lib/predictions/rows";

const STORAGE_KEY = "clutch.enginePredictions.v1";

export type CachedEnginePrediction = {
  matchDate: string;
  prediction: SportPredictionLookupResult | null;
};

export type EnginePredictionCache = Record<string, CachedEnginePrediction>;

type StoredEnginePredictionCache = {
  userId?: string;
  entries: EnginePredictionCache;
};

function daysBetween(fromYmd: string, toYmd: string): number {
  const [fy, fm, fd] = fromYmd.split("-").map(Number);
  const [ty, tm, td] = toYmd.split("-").map(Number);
  return Math.round(
    (Date.UTC(ty!, tm! - 1, td) - Date.UTC(fy!, fm! - 1, fd)) / 86_400_000
  );
}

export function isUsableEnginePrediction(
  prediction: SportPredictionLookupResult | null | undefined
): prediction is SportPredictionLookupResult {
  return (
    prediction != null &&
    typeof prediction.result === "string" &&
    prediction.result.trim().length > 0
  );
}

export function pruneEnginePredictionCache(
  cache: EnginePredictionCache,
  now = new Date()
): EnginePredictionCache {
  const today = mlbMatchDateFromIso(now.toISOString());
  const next: EnginePredictionCache = {};

  for (const [key, entry] of Object.entries(cache)) {
    if (!entry?.matchDate) continue;
    if (!isUsableEnginePrediction(entry.prediction)) continue;
    const daysUntil = daysBetween(today, entry.matchDate);
    if (daysUntil >= -2 && daysUntil <= 2) {
      next[key] = entry;
    }
  }

  return next;
}

export async function loadEnginePredictionCache(
  userId: string | null
): Promise<EnginePredictionCache> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw) as StoredEnginePredictionCache;
    if (parsed.userId && userId && parsed.userId !== userId) {
      return {};
    }

    const entries =
      parsed.entries && typeof parsed.entries === "object"
        ? parsed.entries
        : {};

    return pruneEnginePredictionCache(entries);
  } catch {
    return {};
  }
}

export async function saveEnginePredictionCache(
  userId: string | null,
  cache: EnginePredictionCache
): Promise<void> {
  try {
    const pruned = pruneEnginePredictionCache(cache);
    const payload: StoredEnginePredictionCache = {
      userId: userId ?? undefined,
      entries: pruned,
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore quota / private mode
  }
}

export function partitionCachedPredictionItems(
  cache: EnginePredictionCache,
  items: EnginePredictionFetchItem[]
): {
  cached: Record<string, SportPredictionLookupResult | null>;
  missingItems: EnginePredictionFetchItem[];
} {
  const cached: Record<string, SportPredictionLookupResult | null> = {};
  const missingItems: EnginePredictionFetchItem[] = [];

  for (const item of items) {
    const entry = cache[item.key];
    if (!entry) {
      missingItems.push(item);
      continue;
    }

    const matchDate = mlbMatchDateFromIso(item.commenceTime);
    if (entry.matchDate !== matchDate) {
      missingItems.push(item);
      continue;
    }

    if (!isUsableEnginePrediction(entry.prediction)) {
      missingItems.push(item);
      continue;
    }

    cached[item.key] = entry.prediction;
  }

  return { cached, missingItems };
}

export function mergePredictionItemsIntoCache(
  cache: EnginePredictionCache,
  items: EnginePredictionFetchItem[],
  fresh: Record<string, SportPredictionLookupResult | null | undefined>
): EnginePredictionCache {
  const next = { ...cache };

  for (const item of items) {
    if (!Object.prototype.hasOwnProperty.call(fresh, item.key)) continue;
    const prediction = fresh[item.key];
    if (!isUsableEnginePrediction(prediction)) {
      delete next[item.key];
      continue;
    }
    next[item.key] = {
      matchDate: mlbMatchDateFromIso(item.commenceTime),
      prediction,
    };
  }

  return pruneEnginePredictionCache(next);
}
