import { americanToDecimal } from "@/lib/odds/american";
import { allocateTwoWayArbRounded } from "@/lib/odds/normalize";
import type {
  ArbitrageOpportunity,
  ArbLegStake,
  GameLineSummary,
} from "@/lib/odds/types";

export type EventQuote = {
  eventId: string;
  sportKey: string;
  sportTitle: string;
  commenceTime: string;
  matchup: string;
  impliedProbabilitySum: number;
  stillArbitrage: boolean;
  legs: ArbLegStake[];
  totalStake: number;
  guaranteedProfit: number;
  fetchedAt: string;
};

function isStillArbitrage(
  impliedSum: number,
  guaranteedProfit: number
): boolean {
  return impliedSum < 1 - 1e-9 && guaranteedProfit > 0;
}

export function quoteFromGame(
  game: GameLineSummary,
  totalStake: number,
  fetchedAt: string
): EventQuote | null {
  const home = game.homeBestLine;
  const away = game.awayBestLine;
  if (!home || !away) return null;

  const decimals: [number, number] = [home.decimalOdds, away.decimalOdds];
  const rounded = allocateTwoWayArbRounded(decimals, totalStake);

  const legs: ArbLegStake[] = [
    {
      side: "home",
      teamName: game.homeTeam,
      bookKey: home.bookKey,
      bookTitle: home.bookTitle,
      american: home.american,
      decimalOdds: home.decimalOdds,
      stake: rounded.homeStake,
      lastUpdate: home.lastUpdate,
      betLimit: home.betLimit,
      deepLink: home.deepLink,
    },
    {
      side: "away",
      teamName: game.awayTeam,
      bookKey: away.bookKey,
      bookTitle: away.bookTitle,
      american: away.american,
      decimalOdds: away.decimalOdds,
      stake: rounded.awayStake,
      lastUpdate: away.lastUpdate,
      betLimit: away.betLimit,
      deepLink: away.deepLink,
    },
  ];

  return {
    eventId: game.eventId,
    sportKey: game.sportKey,
    sportTitle: game.sportTitle,
    commenceTime: game.commenceTime,
    matchup: game.matchup,
    impliedProbabilitySum: game.impliedProbabilitySum,
    stillArbitrage: isStillArbitrage(
      game.impliedProbabilitySum,
      rounded.guaranteedProfit
    ),
    legs,
    totalStake: rounded.actualTotal,
    guaranteedProfit: rounded.guaranteedProfit,
    fetchedAt,
  };
}

export function quoteFromOpportunity(
  opp: ArbitrageOpportunity,
  fetchedAt: string
): EventQuote {
  return {
    eventId: opp.eventId,
    sportKey: opp.sportKey,
    sportTitle: opp.sportTitle,
    commenceTime: opp.commenceTime,
    matchup: opp.matchup,
    impliedProbabilitySum: opp.impliedProbabilitySum,
    stillArbitrage: true,
    legs: opp.legs,
    totalStake: opp.totalStake,
    guaranteedProfit: opp.guaranteedProfit,
    fetchedAt,
  };
}

export function resolveEventQuote(input: {
  eventId: string;
  totalStake: number;
  fetchedAt: string;
  opportunities: ArbitrageOpportunity[];
  games: GameLineSummary[];
}): EventQuote | null {
  const opp = input.opportunities.find((o) => o.eventId === input.eventId);
  if (opp) return quoteFromOpportunity(opp, input.fetchedAt);

  const game = input.games.find((g) => g.eventId === input.eventId);
  if (game) return quoteFromGame(game, input.totalStake, input.fetchedAt);

  return null;
}

export function quoteRoiPercent(quote: EventQuote): number {
  if (quote.totalStake <= 0) return 0;
  return (quote.guaranteedProfit / quote.totalStake) * 100;
}

export function parseAmericanInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const normalized = trimmed.startsWith("+") ? trimmed.slice(1) : trimmed;
  const n = Number(normalized);
  if (!Number.isFinite(n) || n === 0) return null;
  return n;
}

export function quoteFromManualOdds(
  base: EventQuote,
  americans: { home: number; away: number },
  targetTotalStake: number
): { quote: EventQuote } | { error: string } {
  let homeDec: number;
  let awayDec: number;
  try {
    homeDec = americanToDecimal(americans.home);
    awayDec = americanToDecimal(americans.away);
  } catch {
    return { error: "Enter valid American odds for both legs (non-zero)." };
  }

  const homeLeg = base.legs.find((l) => l.side === "home");
  const awayLeg = base.legs.find((l) => l.side === "away");
  if (!homeLeg || !awayLeg) {
    return { error: "Missing home/away legs on this card." };
  }

  const impliedSum = 1 / homeDec + 1 / awayDec;
  const rounded = allocateTwoWayArbRounded(
    [homeDec, awayDec],
    targetTotalStake
  );

  const legs: ArbLegStake[] = [
    {
      ...homeLeg,
      american: americans.home,
      decimalOdds: homeDec,
      stake: rounded.homeStake,
    },
    {
      ...awayLeg,
      american: americans.away,
      decimalOdds: awayDec,
      stake: rounded.awayStake,
    },
  ];

  return {
    quote: {
      ...base,
      impliedProbabilitySum: impliedSum,
      stillArbitrage: isStillArbitrage(impliedSum, rounded.guaranteedProfit),
      legs,
      totalStake: rounded.actualTotal,
      guaranteedProfit: rounded.guaranteedProfit,
      fetchedAt: new Date().toISOString(),
    },
  };
}
