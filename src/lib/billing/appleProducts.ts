import type { BillingInterval } from "@/lib/billing/plans";
import type { CheckoutPlan } from "@/lib/api/endpoints/billing";

/** Keep in sync with lib/billing/appleProducts.ts on the server. */
export const APPLE_PRODUCT_IDS = {
  pro: {
    month: "com.clutchodds.app.pro.monthly",
    year: "com.clutchodds.app.pro.annual",
  },
  elite: {
    month: "com.clutchodds.app.elite.monthly",
    year: "com.clutchodds.app.elite.annual",
  },
} as const;

export function appleProductId(
  plan: CheckoutPlan,
  interval: BillingInterval
): string {
  return APPLE_PRODUCT_IDS[plan][interval];
}
