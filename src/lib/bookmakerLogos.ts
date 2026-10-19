import { Platform, type ImageSourcePropType } from "react-native";

const LOGO_ALIASES: Record<string, string> = {
  williamhill_us: "caesars",
  hardrockbet_az: "hardrockbet",
  hardrockbet_fl: "hardrockbet",
  hardrockbet_oh: "hardrockbet",
};

const WORDMARK_LOGOS = new Set(["draftkings", "fanduel", "caesars"]);

const PNG_ASSETS: Record<string, ImageSourcePropType> = {
  ballybet: require("../../assets/bookmakers/ballybet.png"),
  betanysports: require("../../assets/bookmakers/betanysports.png"),
  betmgm: require("../../assets/bookmakers/betmgm.png"),
  betonlineag: require("../../assets/bookmakers/betonlineag.png"),
  betparx: require("../../assets/bookmakers/betparx.png"),
  betrivers: require("../../assets/bookmakers/betrivers.png"),
  betus: require("../../assets/bookmakers/betus.png"),
  bovada: require("../../assets/bookmakers/bovada.png"),
  "caesars-icon": require("../../assets/bookmakers/caesars-icon.png"),
  draftkings: require("../../assets/bookmakers/draftkings.png"),
  espnbet: require("../../assets/bookmakers/espnbet.png"),
  fanatics: require("../../assets/bookmakers/fanatics.png"),
  fanduel: require("../../assets/bookmakers/fanduel.png"),
  fliff: require("../../assets/bookmakers/fliff.png"),
  hardrockbet: require("../../assets/bookmakers/hardrockbet.png"),
  kalshi: require("../../assets/bookmakers/kalshi.png"),
  lowvig: require("../../assets/bookmakers/lowvig.png"),
  mybookieag: require("../../assets/bookmakers/mybookieag.png"),
  novig: require("../../assets/bookmakers/novig.png"),
  pinnacle: require("../../assets/bookmakers/pinnacle.png"),
  polymarket: require("../../assets/bookmakers/polymarket.png"),
  rebet: require("../../assets/bookmakers/rebet.png"),
};

const WEB_ICON_FILES: Record<string, string> = {
  caesars: "caesars-icon.png",
  draftkings: "draftkings-icon.svg",
  fanduel: "fanduel-icon.svg",
  lowvig: "lowvig-icon.svg",
};

function logoBasename(bookKey: string): string {
  const key = bookKey.toLowerCase();
  return LOGO_ALIASES[key] ?? key;
}

export function publicBookmakerUri(fileName: string): string {
  return `/bookmakers/${fileName}`;
}

function publicSource(fileName: string): ImageSourcePropType {
  return { uri: publicBookmakerUri(fileName) };
}

export function getBookLogoSource(bookKey: string): {
  source: ImageSourcePropType | null;
  variant: "icon" | "logo" | "initials";
} {
  const base = logoBasename(bookKey);

  if (Platform.OS === "web") {
    if (WEB_ICON_FILES[base]) {
      return { source: publicSource(WEB_ICON_FILES[base]!), variant: "icon" };
    }
    if (!WORDMARK_LOGOS.has(base)) {
      return { source: publicSource(`${base}.png`), variant: "logo" };
    }
    return { source: null, variant: "initials" };
  }

  if (PNG_ASSETS[`${base}-icon`]) {
    return { source: PNG_ASSETS[`${base}-icon`]!, variant: "icon" };
  }

  if (PNG_ASSETS[base]) {
    return {
      source: PNG_ASSETS[base]!,
      variant: WORDMARK_LOGOS.has(base) ? "icon" : "logo",
    };
  }

  return { source: null, variant: "initials" };
}
