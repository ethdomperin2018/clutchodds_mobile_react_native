import { useCallback, useEffect, useRef, useState } from "react";
import * as Linking from "expo-linking";
import { StripeProvider, useStripe } from "@stripe/stripe-react-native";
import {
  billingApi,
  type CheckoutPlan,
} from "@/lib/api/endpoints/billing";
import type { BillingInterval } from "@/lib/billing/plans";
import type { BillingBrowserResult } from "@/lib/billing/stripeBrowser";

type SheetSession = {
  publishableKey: string;
  customerId: string;
  ephemeralKey: string;
  setupIntentId: string;
  setupIntentClientSecret: string;
  plan: CheckoutPlan;
  interval: BillingInterval;
};

type Finish = (result: BillingBrowserResult | { status: "error"; message: string }) => void;

/**
 * In-app card collection. Stripe Checkout (checkout.stripe.com) is not used.
 */
export function useInAppSubscription() {
  const [session, setSession] = useState<SheetSession | null>(null);
  const finishRef = useRef<Finish | null>(null);

  const start = useCallback(
    (plan: CheckoutPlan, interval: BillingInterval) => {
      return new Promise<BillingBrowserResult>((resolve, reject) => {
        void (async () => {
          try {
            const data = await billingApi.paymentSheet(plan, interval);
            if (data.upgraded) {
              resolve({ status: "upgraded" });
              return;
            }

            const publishableKey =
              data.publishableKey?.trim() ||
              process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ||
              "";
            if (
              !publishableKey ||
              !data.customerId ||
              !data.ephemeralKey ||
              !data.setupIntentId ||
              !data.setupIntentClientSecret
            ) {
              reject(
                new Error(
                  "In-app checkout is not configured. Add STRIPE_PUBLISHABLE_KEY on the server."
                )
              );
              return;
            }

            finishRef.current = (result) => {
              finishRef.current = null;
              setSession(null);
              if (result.status === "error") {
                reject(new Error(result.message));
                return;
              }
              resolve(result);
            };

            setSession({
              publishableKey,
              customerId: data.customerId,
              ephemeralKey: data.ephemeralKey,
              setupIntentId: data.setupIntentId,
              setupIntentClientSecret: data.setupIntentClientSecret,
              plan,
              interval,
            });
          } catch (error) {
            reject(error);
          }
        })();
      });
    },
    []
  );

  const host = session ? (
    <StripeProvider
      publishableKey={session.publishableKey}
      urlScheme="clutchodds"
    >
      <PaymentSheetRunner
        session={session}
        onFinish={(result) => finishRef.current?.(result)}
      />
    </StripeProvider>
  ) : null;

  return { start, host };
}

/** App Store sync runs on iOS only. */
export function useAppStoreSync() {}

/** App Store prices and restore exist on iOS only. */
export function useAppStorePrices(): Record<string, string> | null {
  return null;
}

export const restoreAppStorePurchases: (() => Promise<number | null>) | null = null;

function PaymentSheetRunner({
  session,
  onFinish,
}: {
  session: SheetSession;
  onFinish: Finish;
}) {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    async function present(input: {
      customerId: string;
      ephemeralKey: string;
      setupIntentClientSecret?: string;
      paymentIntentClientSecret?: string;
    }) {
      const base = {
        merchantDisplayName: "Clutch Odds",
        customerId: input.customerId,
        customerEphemeralKeySecret: input.ephemeralKey,
        returnURL: Linking.createURL("pricing"),
        style: "alwaysDark" as const,
        allowsDelayedPaymentMethods: false,
      };
      const { error: initError } = input.paymentIntentClientSecret
        ? await initPaymentSheet({
            ...base,
            paymentIntentClientSecret: input.paymentIntentClientSecret,
          })
        : await initPaymentSheet({
            ...base,
            setupIntentClientSecret: input.setupIntentClientSecret ?? "",
          });
      if (initError) {
        throw new Error(initError.message);
      }
      const { error } = await presentPaymentSheet();
      if (error) {
        if (error.code === "Canceled") return "cancel" as const;
        throw new Error(error.message);
      }
      return "success" as const;
    }

    async function run() {
      try {
        const setupResult = await present({
          customerId: session.customerId,
          ephemeralKey: session.ephemeralKey,
          setupIntentClientSecret: session.setupIntentClientSecret,
        });
        if (setupResult === "cancel") {
          onFinish({ status: "cancel" });
          return;
        }

        const completed = await billingApi.completePaymentSheet(
          session.setupIntentId,
          session.plan,
          session.interval
        );

        if (
          completed.status === "payment_required" &&
          completed.subscriptionId &&
          completed.paymentIntentClientSecret &&
          completed.customerId &&
          completed.ephemeralKey
        ) {
          const payResult = await present({
            customerId: completed.customerId,
            ephemeralKey: completed.ephemeralKey,
            paymentIntentClientSecret: completed.paymentIntentClientSecret,
          });
          if (payResult === "cancel") {
            onFinish({ status: "cancel" });
            return;
          }
          await billingApi.confirmPaymentSheet(completed.subscriptionId);
        }

        onFinish({ status: "success" });
      } catch (error) {
        onFinish({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "Could not start checkout.",
        });
      }
    }

    void run();
  }, [initPaymentSheet, onFinish, presentPaymentSheet, session]);

  return null;
}
