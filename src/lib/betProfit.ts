/** Mirrors web `lib/bets/betProfit` for dashboard / My Bets P/L. */

import { americanToDecimal } from "@/lib/odds/american";
import { parseLineShopFromNotes } from "@/lib/lineShopBetNotes";

export type BetLegForProfit = {
  stake: number;
  american: number;
};

export type BetForProfit = {
  notes: string | null;
  expectedProfit: number | null;
  result: "pending" | "won" | "lost" | "push" | "partial";
  legA: BetLegForProfit;
  legB: BetLegForProfit;
};

/** Shop-edge expected profit in dollars at log time. */
export function lineShopExpectedProfit(
  stake: number,
  edgePercent: number
): number {
  if (!Number.isFinite(stake) || stake <= 0) return 0;
  if (!Number.isFinite(edgePercent) || edgePercent <= 0) return 0;
  return Number(((stake * edgePercent) / 100).toFixed(2));
}

/** Expected profit — stored value or derived from line shop notes. */
export function effectiveExpectedProfit(bet: BetForProfit): number {
  if (bet.expectedProfit != null && Number.isFinite(bet.expectedProfit)) {
    return bet.expectedProfit;
  }
  const lineShop = parseLineShopFromNotes(bet.notes);
  if (lineShop?.edgePercent != null) {
    return lineShopExpectedProfit(bet.legA.stake, lineShop.edgePercent);
  }
  return 0;
}

function lineShopWinProfit(stake: number, american: number): number {
  const dec = americanToDecimal(american);
  return Number((stake * (dec - 1)).toFixed(2));
}

/** Settled P/L from result + odds (pending/push → 0). */
export function realizedProfitForBet(bet: BetForProfit): number {
  if (bet.result === "pending" || bet.result === "push") return 0;

  const lineShop = parseLineShopFromNotes(bet.notes) != null;

  if (lineShop) {
    const { stake, american } = bet.legA;
    if (bet.result === "lost") return Number((-stake).toFixed(2));
    const win = lineShopWinProfit(stake, american);
    if (bet.result === "partial") return Number((win * 0.5).toFixed(2));
    return win;
  }

  const totalStake = bet.legA.stake + bet.legB.stake;
  const expected = effectiveExpectedProfit(bet);
  if (bet.result === "won") return expected;
  if (bet.result === "lost") return Number((-totalStake).toFixed(2));
  if (bet.result === "partial") return Number((expected * 0.5).toFixed(2));
  return 0;
}
