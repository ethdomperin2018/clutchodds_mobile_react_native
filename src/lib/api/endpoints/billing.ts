import { apiRequest } from "@/lib/api/client";
import type { BillingInterval } from "@/lib/billing/plans";

export type CheckoutPlan = "pro" | "elite";

export type BillingClientOptions = {
  /** Deep-link / Expo URL Stripe redirects back to. */
  returnUrl: string;
};

export const billingApi = {
  portal: (options?: BillingClientOptions) =>
    apiRequest<{ url?: string }>("/api/billing/portal", {
      method: "POST",
      body: options
        ? { client: "mobile", returnUrl: options.returnUrl }
        : {},
    }),

  paymentSheet: (plan: CheckoutPlan, interval: BillingInterval = "month") =>
    apiRequest<{
      upgraded?: boolean;
      publishableKey?: string;
      customerId?: string;
      ephemeralKey?: string;
      setupIntentId?: string;
      setupIntentClientSecret?: string;
    }>("/api/billing/payment-sheet", {
      method: "POST",
      body: { plan, interval },
    }),

  completePaymentSheet: (
    setupIntentId: string,
    plan: CheckoutPlan,
    interval: BillingInterval = "month"
  ) =>
    apiRequest<{
      status: "ready" | "payment_required";
      subscriptionId?: string;
      paymentIntentClientSecret?: string;
      ephemeralKey?: string;
      customerId?: string;
    }>("/api/billing/payment-sheet/complete", {
      method: "POST",
      body: { setupIntentId, plan, interval },
    }),

  completeAppStorePurchase: (
    signedTransaction: string,
    plan: CheckoutPlan,
    interval: BillingInterval = "month"
  ) =>
    apiRequest<{ status: "ready" }>("/api/billing/app-store", {
      method: "POST",
      body: { signedTransaction, plan, interval },
    }),

  confirmPaymentSheet: (subscriptionId: string) =>
    apiRequest<{ status: "ready" }>("/api/billing/payment-sheet/confirm", {
      method: "POST",
      body: { subscriptionId },
    }),
};
