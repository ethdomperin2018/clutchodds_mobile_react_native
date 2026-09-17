export type BookBrand = {
  bg: string;
  fg: string;
  short: string;
};

const BY_KEY: Record<string, BookBrand> = {
  betonlineag: { bg: "#F59E0B", fg: "#0a0a0a", short: "BO" },
  betmgm: { bg: "#B89267", fg: "#0a0a0a", short: "MG" },
  betrivers: { bg: "#0035A0", fg: "#ffffff", short: "RV" },
  betus: { bg: "#2563EB", fg: "#ffffff", short: "BU" },
  bovada: { bg: "#E72525", fg: "#ffffff", short: "BV" },
  williamhill_us: { bg: "#0D47A1", fg: "#ffffff", short: "CZ" },
  draftkings: { bg: "#53D337", fg: "#0a0a0a", short: "DK" },
  fanatics: { bg: "#0B1F3A", fg: "#ffffff", short: "FN" },
  fanduel: { bg: "#1496FF", fg: "#ffffff", short: "FD" },
  lowvig: { bg: "#0B1628", fg: "#ffffff", short: "LV" },
  mybookieag: { bg: "#DC2626", fg: "#ffffff", short: "MB" },
  ballybet: { bg: "#E31837", fg: "#ffffff", short: "BL" },
  betanysports: { bg: "#1B4D3E", fg: "#ffffff", short: "BA" },
  betparx: { bg: "#6B2D5C", fg: "#ffffff", short: "PX" },
  espnbet: { bg: "#111111", fg: "#ffffff", short: "TS" },
  fliff: { bg: "#00C2A0", fg: "#0a0a0a", short: "FL" },
  hardrockbet: { bg: "#C4A35A", fg: "#0a0a0a", short: "HR" },
  hardrockbet_az: { bg: "#C4A35A", fg: "#0a0a0a", short: "HR" },
  hardrockbet_fl: { bg: "#C4A35A", fg: "#0a0a0a", short: "HR" },
  hardrockbet_oh: { bg: "#C4A35A", fg: "#0a0a0a", short: "HR" },
  rebet: { bg: "#7C3AED", fg: "#ffffff", short: "RB" },
  kalshi: { bg: "#00D395", fg: "#0a0a0a", short: "KL" },
  novig: { bg: "#1E3A5F", fg: "#ffffff", short: "NV" },
  polymarket: { bg: "#2E5CFF", fg: "#ffffff", short: "PM" },
  pinnacle: { bg: "#000000", fg: "#ffffff", short: "PN" },
};

function initialsFromTitle(title: string): string {
  const words = title
    .replace(/\.(ag|com)$/i, "")
    .split(/[\s._-]+/)
    .filter(Boolean);
  if (words.length >= 2) {
    return (words[0]![0]! + words[1]![0]!).toUpperCase();
  }
  return title.slice(0, 2).toUpperCase();
}

export function getBookBrand(bookKey: string, bookTitle: string): BookBrand {
  const preset = BY_KEY[bookKey.toLowerCase()];
  if (preset) return preset;
  return {
    bg: "#3f3f46",
    fg: "#fafafa",
    short: initialsFromTitle(bookTitle),
  };
}
