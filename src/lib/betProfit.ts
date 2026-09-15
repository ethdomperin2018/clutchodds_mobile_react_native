/** Mirrors web `lib/bets/betProfit` for dashboard performance cells. */

type BetLegForProfit = {
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

function americanToDecimal(american: number): number {
  if (american >= 100) return 1 + american / 100;
  if (american <= -100) return 1 + 100 / Math.abs(american);
  return 1;
}

export function effectiveExpectedProfit(bet: BetForProfit): number {
  if (bet.expectedProfit != null && Number.isFinite(bet.expectedProfit)) {
    return bet.expectedProfit;
  }
  return 0;
}

export function realizedProfitForBet(bet: BetForProfit): number {
  if (bet.result === "pending" || bet.result === "push") return 0;

  const totalStake = bet.legA.stake + bet.legB.stake;
  const expected = effectiveExpectedProfit(bet);

  if (bet.result === "won") {
    const hasLineShopNote =
      typeof bet.notes === "string" && bet.notes.includes("lineShop");
    if (hasLineShopNote) {
      const dec = americanToDecimal(bet.legA.american);
      return Number((bet.legA.stake * (dec - 1)).toFixed(2));
    }
    return expected;
  }

  if (bet.result === "lost") {
    const hasLineShopNote =
      typeof bet.notes === "string" && bet.notes.includes("lineShop");
    if (hasLineShopNote) return Number((-bet.legA.stake).toFixed(2));
    return Number((-totalStake).toFixed(2));
  }

  if (bet.result === "partial") {
    return Number((expected * 0.5).toFixed(2));
  }

  return 0;
}
