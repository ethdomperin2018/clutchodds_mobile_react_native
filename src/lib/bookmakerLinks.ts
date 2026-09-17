const BOOK_SPORTSBOOK_HOME: Record<string, string> = {
  betonlineag: "https://www.betonline.ag/sportsbook",
  betmgm: "https://sports.betmgm.com/en/sports",
  betrivers: "https://www.betrivers.com/",
  betus: "https://www.betus.com.pa/sportsbook",
  bovada: "https://www.bovada.lv/sports",
  williamhill_us: "https://www.caesars.com/sportsbook",
  draftkings: "https://sportsbook.draftkings.com/",
  fanatics: "https://sportsbook.fanatics.com/",
  fanduel: "https://sportsbook.fanduel.com/",
  lowvig: "https://www.lowvig.ag/",
  mybookieag: "https://www.mybookie.ag/sportsbook",
  ballybet: "https://www.ballybet.com/",
  betanysports: "https://betanything.com/",
  betparx: "https://www.betparx.com/",
  espnbet: "https://www.thescore.bet/",
  fliff: "https://www.fliff.com/",
  hardrockbet: "https://www.hardrock.bet/",
  hardrockbet_az: "https://az.hardrock.bet/",
  hardrockbet_fl: "https://fl.hardrock.bet/",
  hardrockbet_oh: "https://oh.hardrock.bet/",
  rebet: "https://rebet.app/",
  kalshi: "https://kalshi.com/",
  novig: "https://www.novig.com/",
  polymarket: "https://polymarket.com/",
  pinnacle: "https://www.pinnacle.com/en/sports/",
};

export function getBookSportsbookUrl(
  bookKey: string,
  _sportKey?: string,
  deepLink?: string | null
): string | null {
  if (typeof deepLink === "string" && deepLink.startsWith("http")) {
    return deepLink;
  }
  return BOOK_SPORTSBOOK_HOME[bookKey.toLowerCase()] ?? null;
}
