import { useCallback } from "react";
import {
  fetchProducts,
  finishTransaction,
  initConnection,
  isUserCancelledError,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
  type Purchase,
} from "expo-iap";
import { useSession } from "@/features/auth/SessionProvider";
import {
  billingApi,
  type CheckoutPlan,
} from "@/lib/api/endpoints/billing";
import { appleProductId } from "@/lib/billing/appleProducts";
import type { BillingInterval } from "@/lib/billing/plans";
import type { BillingBrowserResult } from "@/lib/billing/stripeBrowser";

/**
 * iOS App Store subscriptions. Android keeps the Stripe card sheet.
 */
export function useInAppSubscription() {
  const { user } = useSession();

  const start = useCallback(
    (plan: CheckoutPlan, interval: BillingInterval) => {
      return new Promise<BillingBrowserResult>((resolve, reject) => {
        const userId = user?.id;
        if (!userId) {
          reject(new Error("Sign in to subscribe."));
          return;
        }

        const sku = appleProductId(plan, interval);
        let settled = false;
        let purchaseSub: { remove: () => void } | null = null;
        let errorSub: { remove: () => void } | null = null;
        const finish = (
          result: BillingBrowserResult | { status: "error"; message: string }
        ) => {
          if (settled) return;
          settled = true;
          purchaseSub?.remove();
          errorSub?.remove();
          if (result.status === "error") {
            reject(new Error(result.message));
            return;
          }
          resolve(result);
        };

        purchaseSub = purchaseUpdatedListener((purchase) => {
          if (purchase.productId !== sku) return;
          void (async () => {
            try {
              const signedTransaction = purchase.purchaseToken?.trim();
              if (!signedTransaction) {
                throw new Error("App Store did not return a signed purchase.");
              }
              await billingApi.completeAppStorePurchase(
                signedTransaction,
                plan,
                interval
              );
              await finishTransaction({
                purchase: purchase as Purchase,
                isConsumable: false,
              });
              finish({ status: "success" });
            } catch (error) {
              finish({
                status: "error",
                message:
                  error instanceof Error
                    ? error.message
                    : "Could not finish the App Store purchase.",
              });
            }
          })();
        });

        errorSub = purchaseErrorListener((error) => {
          if (isUserCancelledError(error)) {
            finish({ status: "cancel" });
            return;
          }
          finish({
            status: "error",
            message: error.message || "App Store purchase failed.",
          });
        });

        void (async () => {
          try {
            await initConnection();
            const products = await fetchProducts({ skus: [sku], type: "subs" });
            if (!products || products.length === 0) {
              throw new Error(
                `App Store product ${sku} is not available yet. Create it in App Store Connect.`
              );
            }
            await requestPurchase({
              request: {
                apple: { sku, appAccountToken: userId },
              },
              type: "subs",
            });
          } catch (error) {
            if (isUserCancelledError(error)) {
              finish({ status: "cancel" });
              return;
            }
            finish({
              status: "error",
              message:
                error instanceof Error
                  ? error.message
                  : "Could not start the App Store purchase.",
            });
          }
        })();
      });
    },
    [user?.id]
  );

  return { start, host: null as null };
}
