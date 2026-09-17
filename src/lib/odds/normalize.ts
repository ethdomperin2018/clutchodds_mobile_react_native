export function allocateTwoWayArb(
  decimals: readonly [number, number],
  totalStake: number
): [number, number] {
  const [d0, d1] = decimals;
  const inv = [1 / d0, 1 / d1] as const;
  const denom = inv[0] + inv[1];
  return [(totalStake * inv[0]) / denom, (totalStake * inv[1]) / denom];
}

export function stakeRoundStepForTotal(totalStake: number): number {
  const base = 5;
  if (totalStake < 300) return 1;
  if (totalStake < 750) return Math.min(base, 5);
  return base;
}

function roundStakeToStep(amount: number, step: number): number {
  return Math.max(step, Math.round(amount / step) * step);
}

export function guaranteedReturn(decimalOdds: number, stake: number): number {
  return stake * decimalOdds;
}

export function allocateTwoWayArbRounded(
  decimals: readonly [number, number],
  totalStake: number,
  step?: number
): {
  homeStake: number;
  awayStake: number;
  actualTotal: number;
  guaranteedProfit: number;
} {
  const roundStep = step ?? stakeRoundStepForTotal(totalStake);
  const [rawHome, rawAway] = allocateTwoWayArb(decimals, totalStake);
  const homeStake = roundStakeToStep(rawHome, roundStep);
  const awayStake = roundStakeToStep(rawAway, roundStep);
  const actualTotal = homeStake + awayStake;
  const minReturn = Math.min(
    guaranteedReturn(decimals[0], homeStake),
    guaranteedReturn(decimals[1], awayStake)
  );
  return {
    homeStake,
    awayStake,
    actualTotal,
    guaranteedProfit: minReturn - actualTotal,
  };
}
