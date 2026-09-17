import { quoteFromGame } from "@/lib/odds/eventQuote";
import type { GameLineSummary } from "@/lib/odds/types";

const ARB_EPS = 1e-9;

export type GameArbStatus = "executable" | "theoretical" | "none";

export function hasTheoreticalEdge(game: GameLineSummary): boolean {
  return (
    Boolean(game.homeBestLine && game.awayBestLine) &&
    game.impliedProbabilitySum < 1 - ARB_EPS
  );
}

export function getGameArbStatus(
  game: GameLineSummary,
  totalStake: number,
  fetchedAt: string
): {
  status: GameArbStatus;
  guaranteedProfit: number | null;
} {
  const quote = quoteFromGame(game, totalStake, fetchedAt);
  if (quote?.stillArbitrage) {
    return { status: "executable", guaranteedProfit: quote.guaranteedProfit };
  }
  if (hasTheoreticalEdge(game)) {
    return {
      status: "theoretical",
      guaranteedProfit: quote?.guaranteedProfit ?? null,
    };
  }
  return { status: "none", guaranteedProfit: null };
}

export function findMinExecutableStake(
  game: GameLineSummary,
  fetchedAt: string,
  options?: { from?: number; max?: number; step?: number }
): number | null {
  const from = options?.from ?? 100;
  const max = options?.max ?? 10_000;
  const step = options?.step ?? 50;

  for (let stake = from; stake <= max; stake += step) {
    if (quoteFromGame(game, stake, fetchedAt)?.stillArbitrage) {
      return stake;
    }
  }
  return null;
}

export function suggestStakeForTheoreticalGames(
  games: GameLineSummary[],
  fetchedAt: string,
  currentStake: number
): number | null {
  const tryFrom = Math.max(currentStake + 50, 200);
  let best: number | null = null;

  for (const game of games) {
    if (getGameArbStatus(game, currentStake, fetchedAt).status !== "theoretical") {
      continue;
    }
    const min = findMinExecutableStake(game, fetchedAt, {
      from: tryFrom,
      step: 25,
    });
    if (min !== null && (best === null || min < best)) {
      best = min;
    }
  }

  return best;
}
