import { arbMatchesQuoteSyncFilter } from "@/lib/odds/oddsAge";
import type { ArbitrageOpportunity, LineShopPick } from "@/lib/odds/types";
import { arbRoiPercent } from "@/lib/format";
import { meetsMinPercent2, primaryEvPercent } from "@/lib/valueBets/format";

export function normalizeBookKey(bookKey: string): string {
  return bookKey.toLowerCase();
}

export function filterArbsByBooks(
  arbs: ArbitrageOpportunity[],
  allowedBooks: ReadonlySet<string>
): ArbitrageOpportunity[] {
  if (allowedBooks.size === 0) return arbs;
  return arbs.filter((arb) =>
    arb.legs.every((leg) => allowedBooks.has(normalizeBookKey(leg.bookKey)))
  );
}

export function filterArbsBySports(
  arbs: ArbitrageOpportunity[],
  sportKeys: ReadonlySet<string>
): ArbitrageOpportunity[] {
  if (sportKeys.size === 0) return arbs;
  return arbs.filter((arb) => sportKeys.has(arb.sportKey));
}

export function filterArbsByQuoteSync(
  arbs: ArbitrageOpportunity[],
  snapshotFetchedAt: string | undefined,
  maxSkewMs: number,
  enabled: boolean
): ArbitrageOpportunity[] {
  if (!enabled) return arbs;
  return arbs.filter((arb) =>
    arbMatchesQuoteSyncFilter(arb, snapshotFetchedAt, maxSkewMs)
  );
}

function filterLineShopByBooks(
  picks: LineShopPick[],
  allowedBooks: ReadonlySet<string>
): LineShopPick[] {
  if (allowedBooks.size === 0) return picks;
  return picks.filter((pick) =>
    allowedBooks.has(normalizeBookKey(pick.bestLine.bookKey))
  );
}

function filterLineShopByQuoteSync(
  picks: LineShopPick[],
  snapshotFetchedAt: string | undefined,
  maxSkewMs: number,
  enabled: boolean
): LineShopPick[] {
  if (!enabled) return picks;
  return picks.filter((pick) => {
    if (!pick.secondBestLine) return true;
    return arbMatchesQuoteSyncFilter(
      { legs: [pick.bestLine, pick.secondBestLine] },
      snapshotFetchedAt,
      maxSkewMs
    );
  });
}

function filterLineShopBySports(
  picks: LineShopPick[],
  sportKeys: ReadonlySet<string>
): LineShopPick[] {
  if (sportKeys.size === 0) return picks;
  return picks.filter((pick) => sportKeys.has(pick.sportKey));
}

function filterLineShopOnePerGame(
  picks: LineShopPick[],
  enabled: boolean
): LineShopPick[] {
  if (!enabled) return picks;
  const bestByEvent = new Map<string, LineShopPick>();
  for (const pick of picks) {
    const existing = bestByEvent.get(pick.eventId);
    const pickEv = pick.fairEdgePercent ?? pick.edgePercent;
    const existingEv = existing
      ? (existing.fairEdgePercent ?? existing.edgePercent)
      : Number.NEGATIVE_INFINITY;
    if (!existing || pickEv > existingEv) {
      bestByEvent.set(pick.eventId, pick);
    }
  }
  return picks.filter((pick) => bestByEvent.get(pick.eventId) === pick);
}

export function applyArbDisplayFilters(
  arbs: ArbitrageOpportunity[],
  options: {
    minRoi: number;
    selectedSports: ReadonlySet<string>;
    selectedBooks: ReadonlySet<string>;
    quoteSyncEnabled: boolean;
    maxLegSkewMs: number;
    fetchedAt: string | undefined;
  }
): ArbitrageOpportunity[] {
  const roiFiltered = arbs.filter((a) =>
    meetsMinPercent2(arbRoiPercent(a), options.minRoi)
  );
  const sportFiltered = filterArbsBySports(roiFiltered, options.selectedSports);
  const bookFiltered = filterArbsByBooks(sportFiltered, options.selectedBooks);
  return filterArbsByQuoteSync(
    bookFiltered,
    options.fetchedAt,
    options.maxLegSkewMs,
    options.quoteSyncEnabled
  );
}

export function applyLineShopDisplayFilters(
  picks: LineShopPick[],
  options: {
    minEdge: number;
    selectedSports: ReadonlySet<string>;
    selectedBooks: ReadonlySet<string>;
    fetchedAt: string | undefined;
    maxLegSkewMs: number;
    quoteSyncEnabled: boolean;
    onePickPerGame: boolean;
  }
): LineShopPick[] {
  const edgePicks = picks.filter((p) =>
    meetsMinPercent2(primaryEvPercent(p), options.minEdge)
  );
  const sportPicks = filterLineShopBySports(edgePicks, options.selectedSports);
  const bookPicks = filterLineShopByBooks(sportPicks, options.selectedBooks);
  const syncPicks = filterLineShopByQuoteSync(
    bookPicks,
    options.fetchedAt,
    options.maxLegSkewMs,
    options.quoteSyncEnabled
  );
  return filterLineShopOnePerGame(syncPicks, options.onePickPerGame);
}
