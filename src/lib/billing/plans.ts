import { env } from "@/config/env";

export type PlanId = "free" | "pro" | "elite";
export type BillingInterval = "month" | "year";

/** Same defaults as web `lib/billing/plans.ts` (env without leading $). */
export const PRO_PRICE_AMOUNT = env.proPriceAmount;
export const ELITE_PRICE_AMOUNT = env.elitePriceAmount;
export const PRO_PRICE_LABEL = `$${PRO_PRICE_AMOUNT}/mo`;
export const ELITE_PRICE_LABEL = `$${ELITE_PRICE_AMOUNT}/mo`;
export const PRO_ANNUAL_PRICE_LABEL = `$${env.proAnnualPriceAmount}/yr`;
export const ELITE_ANNUAL_PRICE_LABEL = `$${env.eliteAnnualPriceAmount}/yr`;

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
