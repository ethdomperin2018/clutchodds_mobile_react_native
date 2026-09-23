/** Mirrors web `lib/db/lineShopBetNotes` for P/L calc parity. */

export const LINE_SHOP_NOTE_PREFIX = "lineShop:";
export const LINE_SHOP_PLACEHOLDER_BOOK_KEY = "line_shop_single";

export type ParsedLineShopBetNote = {
  eventId: string;
  side: "home" | "away";
  edgePercent: number | null;
};

export function lineShopPickLogKey(
  eventId: string,
  side: "home" | "away"
): string {
  return `${eventId}:${side}`;
}

export function parseLineShopFromNotes(
  notes: string | null
): ParsedLineShopBetNote | null {
  if (!notes?.startsWith(LINE_SHOP_NOTE_PREFIX)) return null;
  const rest = notes.slice(LINE_SHOP_NOTE_PREFIX.length);
  const [eventId, side, edgeRaw] = rest.split(":");
  if (!eventId || (side !== "home" && side !== "away")) return null;
  const edgePercent = edgeRaw != null ? Number(edgeRaw) : null;
  return {
    eventId,
    side,
    edgePercent: Number.isFinite(edgePercent) ? edgePercent : null,
  };
}

export function isLineShopPlaceholderLeg(leg: { bookKey?: string }): boolean {
  return leg.bookKey === LINE_SHOP_PLACEHOLDER_BOOK_KEY;
}
