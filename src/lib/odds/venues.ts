import { TRACKED_BOOKMAKER_KEYS } from "@/lib/bookmakerDisplay";

export const EXCHANGE_BOOK_KEYS = new Set([
  "kalshi",
  "polymarket",
  "novig",
]);

export function isExchangeBook(bookKey: string): boolean {
  return EXCHANGE_BOOK_KEYS.has(bookKey.toLowerCase());
}

export type VenueLeg = {
  bookKey: string;
  bookTitle?: string;
};

export type ArbVenueKind =
  | "book-exchange"
  | "exchange-exchange"
  | "cross-book"
  | "same-book";

export function classifyArbVenue(legs: readonly VenueLeg[]): ArbVenueKind {
  const sportsbookKeys = new Set<string>();
  const exchangeKeys = new Set<string>();

  for (const leg of legs) {
    const key = leg.bookKey.toLowerCase();
    if (isExchangeBook(key)) exchangeKeys.add(key);
    else sportsbookKeys.add(key);
  }

  if (sportsbookKeys.size >= 1 && exchangeKeys.size >= 1) {
    return "book-exchange";
  }
  if (exchangeKeys.size >= 2) {
    return "exchange-exchange";
  }

  const uniqueBooks = sportsbookKeys.size + exchangeKeys.size;
  if (uniqueBooks >= 2) return "cross-book";
  return "same-book";
}

export function arbVenueKindLabel(kind: ArbVenueKind): string {
  switch (kind) {
    case "book-exchange":
      return "1 book · 1 exchange";
    case "exchange-exchange":
      return "2 exchanges";
    case "cross-book":
      return "2 books";
    case "same-book":
      return "Moneyline arb";
  }
}

export const TRACKED_SPORTSBOOK_KEYS = TRACKED_BOOKMAKER_KEYS.filter(
  (key) => !EXCHANGE_BOOK_KEYS.has(key)
);

export const TRACKED_EXCHANGE_KEYS = TRACKED_BOOKMAKER_KEYS.filter((key) =>
  EXCHANGE_BOOK_KEYS.has(key)
);
