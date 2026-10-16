import { useCallback } from "react";
import { Platform } from "react-native";
import type { CheckoutPlan } from "@/lib/api/endpoints/billing";
import { appleProductId } from "@/lib/billing/appleProducts";
import { useAppStorePrices } from "@/lib/billing/inAppPayment";
import { getPlanPriceLabel, type BillingInterval } from "@/lib/billing/plans";
import type { AuthUser } from "@/types/auth";

/**
 * Price label for a plan. On iOS, new and App Store plans use the localized
 * App Store price; plans already billed through Stripe keep the Stripe price.
 */
export function usePlanPriceLabel(billingProvider?: AuthUser["billingProvider"]) {
  const storePrices = useAppStorePrices();
  const appStore = Platform.OS === "ios" && billingProvider !== "stripe";

  const label = useCallback(
    (plan: CheckoutPlan, interval: BillingInterval): string => {
      if (!appStore) return getPlanPriceLabel(plan, interval);
      if (!storePrices) return "…";
      const price = storePrices[appleProductId(plan, interval)];
      if (!price) return "Unavailable";
      return `${price}${interval === "year" ? "/yr" : "/mo"}`;
    },
    [appStore, storePrices]
  );

  return { label, appStore };
}
