import { formatAmerican } from "@/lib/format";
import { shortTeamName } from "@/lib/teamDisplay";
import type { LineShopPick } from "@/lib/odds/types";
import type { PickEliteInsights } from "@/lib/valueBets/engineEliteInsights";
import { formatSignedPercent } from "@/lib/valueBets/format";

/** One-line rationale under the pick — same as web `valueBetTableBlurb`. */
export function valueBetTableBlurb(
  pick: LineShopPick,
  insights: PickEliteInsights,
  ev: number,
  isLive: boolean,
  showEngineInsights: boolean
): string {
  const team = shortTeamName(pick.teamName);
  const modelPct = insights.modelWinProbability;
  const marketPct = insights.marketImpliedProbability;
  const gap = modelPct - marketPct;
  const isFavorite = pick.bestLine.american < 0;

  if (isLive) {
    return `${team} offers the best live price right now (${formatSignedPercent(ev)} EV vs sharp fair odds).`;
  }

  if (!showEngineInsights || modelPct <= 0) {
    return `Best available price beats fair value by ${formatSignedPercent(ev)}.`;
  }

  if (isFavorite && modelPct >= 58 && gap >= 12) {
    return "Model projects dominant win probability.";
  }

  if (isFavorite && modelPct > marketPct && gap >= 3) {
    return "Model projects higher win rate than market implied.";
  }

  if (!isFavorite && modelPct > 0 && modelPct < marketPct) {
    return `Market is too low on ${team} chance to win.`;
  }

  return `Market is undervaluing the ${team}. Our model gives them a ${modelPct.toFixed(1)}% chance to win.`;
}

/** Three checkmark bullets — same as web `valueBetWhyBullets`. */
export function valueBetWhyBullets(
  pick: LineShopPick,
  insights: PickEliteInsights,
  ev: number,
  isLive: boolean,
  showEngineInsights: boolean
): string[] {
  const team = shortTeamName(pick.teamName);
  const odds = formatAmerican(pick.bestLine.american);
  const modelPct = insights.modelWinProbability;
  const marketPct = insights.marketImpliedProbability;
  const gap = modelPct - marketPct;

  if (isLive) {
    return [
      `Best live price on ${team} is ${odds} at ${pick.bestLine.bookTitle}.`,
      `That line implies about ${marketPct.toFixed(1)}% win chance vs sharp fair odds.`,
      `Expected value at this price is ${formatSignedPercent(ev)}.`,
    ];
  }

  if (showEngineInsights && modelPct > 0) {
    return [
      `Our model projects the ${team} to win ${modelPct.toFixed(1)}% of the time.`,
      `The implied probability of ${odds} is ${marketPct.toFixed(1)}%.`,
      `That's a ${gap >= 0 ? "+" : ""}${gap.toFixed(1)}% difference, which creates ${formatSignedPercent(ev)} expected value.`,
    ];
  }

  return [
    "Best available price is better than our fair value.",
    `The implied probability of ${odds} is ${marketPct.toFixed(1)}%.`,
    `Value edge ${formatSignedPercent(ev)}.`,
  ];
}
