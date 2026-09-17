export const BOOK_DISPLAY_NAMES: Record<string, string> = {
  betonlineag: "BetOnline",
  betmgm: "BetMGM",
  betrivers: "BetRivers",
  betus: "BetUS",
  bovada: "Bovada",
  williamhill_us: "Caesars",
  draftkings: "DraftKings",
  fanatics: "Fanatics",
  fanduel: "FanDuel",
  lowvig: "LowVig",
  mybookieag: "MyBookie",
  ballybet: "Bally Bet",
  betanysports: "BetAnything",
  betparx: "betPARX",
  espnbet: "theScore Bet",
  fliff: "Fliff",
  hardrockbet: "Hard Rock Bet",
  hardrockbet_az: "Hard Rock Bet (AZ)",
  hardrockbet_fl: "Hard Rock Bet (FL)",
  hardrockbet_oh: "Hard Rock Bet (OH)",
  rebet: "ReBet",
  kalshi: "Kalshi",
  novig: "Novig",
  polymarket: "Polymarket",
  pinnacle: "Pinnacle",
};

export const TRACKED_BOOKMAKER_KEYS = Object.keys(BOOK_DISPLAY_NAMES).sort();
export const TRACKED_BOOKMAKER_KEY_SET = new Set(TRACKED_BOOKMAKER_KEYS);
export const TRACKED_BOOKMAKER_COUNT = TRACKED_BOOKMAKER_KEYS.length;

export function getBookDisplayName(bookKey: string): string {
  const k = bookKey.toLowerCase();
  return BOOK_DISPLAY_NAMES[k] ?? k;
}
