import { useCallback } from "react";
import type { CheckoutPlan } from "@/lib/api/endpoints/billing";
import type { BillingInterval } from "@/lib/billing/plans";
import type { BillingBrowserResult } from "@/lib/billing/stripeBrowser";

/**
 * Web preview has no Stripe Payment Sheet. iOS and Android use inAppPayment.tsx.
 */
export function useInAppSubscription() {
  const start = useCallback(
    async (
      _plan: CheckoutPlan,
      _interval: BillingInterval
    ): Promise<BillingBrowserResult> => {
      throw new Error("Card checkout runs in the iOS and Android app.");
    },
    []
  );

  return { start, host: null as null };
}
