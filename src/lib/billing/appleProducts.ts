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

export const APPLE_PRODUCT_SKUS: string[] = [
  APPLE_PRODUCT_IDS.pro.month,
  APPLE_PRODUCT_IDS.pro.year,
  APPLE_PRODUCT_IDS.elite.month,
  APPLE_PRODUCT_IDS.elite.year,
];

export function appleProductId(
  plan: CheckoutPlan,
  interval: BillingInterval
): string {
  return APPLE_PRODUCT_IDS[plan][interval];
}

export function appleProductPlan(
  productId: string
): { plan: CheckoutPlan; interval: BillingInterval } | null {
  for (const plan of ["pro", "elite"] as const) {
    for (const interval of ["month", "year"] as const) {
      if (APPLE_PRODUCT_IDS[plan][interval] === productId) {
        return { plan, interval };
      }
    }
  }
  return null;
}
