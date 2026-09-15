import { predictionsApi } from "@/lib/api/endpoints/predictions";
import {
  loadEnginePredictionCache,
  mergePredictionItemsIntoCache,
  partitionCachedPredictionItems,
  saveEnginePredictionCache,
} from "@/lib/predictions/enginePredictionStorage";
import type {
  EnginePredictionFetchItem,
  SportPredictionLookupResult,
} from "@/lib/predictions/rows";

export type FetchEnginePredictionsOptions = {
  userId: string | null;
  /** Called when cached hits are available (before network). */
  onCached?: (
    cached: Record<string, SportPredictionLookupResult | null>
  ) => void;
};

/**
 * Same flow as web: paint AsyncStorage hits immediately, fetch only misses.
 */
export async function fetchEnginePredictionsWithCache(
  items: EnginePredictionFetchItem[],
  options: FetchEnginePredictionsOptions
): Promise<Record<string, SportPredictionLookupResult | null>> {
  if (items.length === 0) return {};

  const cache = await loadEnginePredictionCache(options.userId);
  const { cached, missingItems } = partitionCachedPredictionItems(cache, items);

  if (Object.keys(cached).length > 0) {
    options.onCached?.(cached);
  }

  if (missingItems.length === 0) {
    return cached;
  }

  const response = await predictionsApi.fetchBatch(missingItems);
  const fresh = response.predictions ?? {};
  const mergedCache = mergePredictionItemsIntoCache(cache, missingItems, fresh);
  await saveEnginePredictionCache(options.userId, mergedCache);

  return { ...cached, ...fresh };
}
