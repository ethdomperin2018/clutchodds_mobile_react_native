import { env } from "@/config/env";
import {
  getProTrialLabel,
  getProTrialPriceNote,
} from "@/lib/billing/trial";

export type PlanId = "free" | "pro" | "elite";
export type BillingInterval = "month" | "year";

export type PlanDefinition = {
  id: PlanId;
  name: string;
  priceLabel: string;
  priceNote: string;
  description: string;
  perks: string[];
  cta: string;
  highlighted?: boolean;
};

/** Same defaults as web `lib/billing/plans.ts` (env without leading $). */
export const PRO_PRICE_AMOUNT = env.proPriceAmount;
export const ELITE_PRICE_AMOUNT = env.elitePriceAmount;
export const PRO_PRICE_LABEL = `$${PRO_PRICE_AMOUNT}/mo`;
export const ELITE_PRICE_LABEL = `$${ELITE_PRICE_AMOUNT}/mo`;
export const PRO_ANNUAL_PRICE_LABEL = `$${env.proAnnualPriceAmount}/yr`;
export const ELITE_ANNUAL_PRICE_LABEL = `$${env.eliteAnnualPriceAmount}/yr`;
export const ANNUAL_SAVINGS_NOTE = "2 months free · billed annually";

/**
 * Monthly/annual toggle. Same prices as web ($290 / $990, or EXPO_PUBLIC overrides).
 * Set EXPO_PUBLIC_ANNUAL_BILLING=0 to hide it.
 */
export function isAnnualPricingUiEnabled(): boolean {
  if (process.env.EXPO_PUBLIC_ANNUAL_BILLING?.trim() === "0") return false;
  return Boolean(
    env.proAnnualPriceAmount.trim() && env.eliteAnnualPriceAmount.trim()
  );
}

export function getPlanPriceLabel(
  planId: PlanId,
  interval: BillingInterval = "month"
): string {
  if (planId === "free") return "$0";
  if (planId === "pro") {
    return interval === "year" ? PRO_ANNUAL_PRICE_LABEL : PRO_PRICE_LABEL;
  }
  return interval === "year" ? ELITE_ANNUAL_PRICE_LABEL : ELITE_PRICE_LABEL;
}

export function getPlanPriceNote(
  planId: PlanId,
  interval: BillingInterval = "month"
): string {
  if (planId === "free") return "forever";
  if (interval === "year") return ANNUAL_SAVINGS_NOTE;
  if (planId === "pro") return getProTrialPriceNote();
  return "billed monthly";
}

export const PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: "free",
    name: "Free",
    priceLabel: "$0",
    priceNote: "forever",
    description: "Explore the market and create your account.",
    perks: [
      "Email or Google sign-in",
      "Dashboard market snapshot",
      "Public arb overview (read-only pulse)",
      "+EV Value Bets preview (top picks, no book names)",
      "Upgrade anytime to unlock the full scanners",
    ],
    cta: "Get started free",
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceLabel: PRO_PRICE_LABEL,
    priceNote: getProTrialPriceNote(),
    description: `Full scanners, bet log, and performance analytics. ${getProTrialLabel()} with card — cancel anytime before you're charged.`,
    perks: [
      `${getProTrialLabel()} with full Pro access`,
      "Live + upcoming Arbitrage scanner",
      "Value Bets — best book prices and value edge (+EV)",
      "Auto-refresh & filters (sport, books, ROI/edge, quote sync)",
      "One-click bet log from arb or value bet cards",
      "Private PNL dashboard — expected & realized, book attribution",
      "Telegram alerts on new arbs",
    ],
    cta: "Start free trial",
    highlighted: true,
  },
  elite: {
    id: "elite",
    name: "Elite",
    priceLabel: ELITE_PRICE_LABEL,
    priceNote: "billed monthly",
    description:
      "Everything in Pro, plus Model Predictions and model overlays on Value Bets.",
    perks: [
      "Everything in Pro",
      "Model Predictions board — win %, model favorite, confidence, model edge",
      "Value Bets Elite overlays — Our Fair Odds, confidence, model %, market %, edge (pre-game)",
      "Why-this-pick breakdown on Elite opportunities",
      "Pre-game model lock on live games (predictions stay pre-tip)",
      "Best for +EV bettors who want model-backed line shopping",
    ],
    cta: "Get Elite",
  },
};
