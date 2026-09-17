import { isExchangeBook } from "@/lib/odds/venues";

export function isExchangeBetLimitBook(bookKey: string): boolean {
  return isExchangeBook(bookKey);
}

export function formatExchangeBetLimit(
  limit: number,
  options?: { compact?: boolean }
): string {
  const display =
    limit >= 100
      ? Math.round(limit).toLocaleString("en-US")
      : limit.toLocaleString("en-US", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        });
  if (options?.compact) {
    return `max $${display}`;
  }
  return `max $${display} at that price`;
}

export function stakeExceedsBetLimit(
  stake: number | undefined,
  betLimit: number | undefined
): boolean {
  return (
    typeof stake === "number" &&
    typeof betLimit === "number" &&
    betLimit > 0 &&
    stake > betLimit
  );
}

export function exchangeBetLimitCaption(input: {
  bookKey: string;
  betLimit?: number;
  stake?: number;
  compact?: boolean;
}): string | null {
  if (
    !isExchangeBetLimitBook(input.bookKey) ||
    input.betLimit == null ||
    input.betLimit <= 0
  ) {
    return null;
  }
  const base = formatExchangeBetLimit(input.betLimit, {
    compact: input.compact,
  });
  return stakeExceedsBetLimit(input.stake, input.betLimit)
    ? input.compact
      ? `${base} · over stake`
      : `${base} · stake may not fill`
    : base;
}
