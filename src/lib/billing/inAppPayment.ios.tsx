import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";
import {
  fetchProducts,
  finishTransaction,
  getAvailablePurchases,
  initConnection,
  isUserCancelledError,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
  restorePurchases,
  type Purchase,
} from "expo-iap";
import { useSession } from "@/features/auth/SessionProvider";
import {
  billingApi,
  type CheckoutPlan,
} from "@/lib/api/endpoints/billing";
import {
  APPLE_PRODUCT_SKUS,
  appleProductId,
  appleProductPlan,
} from "@/lib/billing/appleProducts";
import { isProUser } from "@/lib/planAccess";
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
        if (user?.billingProvider === "stripe" && isProUser(user) && !user.isAdmin) {
          reject(
            new Error(
              "Your plan is billed through Stripe. Change it from Settings instead of the App Store."
            )
          );
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
    [user]
  );

  return { start, host: null as null };
}

/**
 * Sends each active App Store subscription on this device to the server and
 * finishes it. Returns how many the server accepted.
 */
async function syncActiveAppStorePurchases(): Promise<number> {
  await initConnection();
  const purchases = await getAvailablePurchases({
    onlyIncludeActiveItemsIOS: true,
  });
  let synced = 0;
  for (const purchase of purchases ?? []) {
    const product = appleProductPlan(purchase.productId);
    const signedTransaction = purchase.purchaseToken?.trim();
    if (!product || !signedTransaction) continue;
    try {
      await billingApi.completeAppStorePurchase(
        signedTransaction,
        product.plan,
        product.interval
      );
    } catch {
      // Another account's purchase, or a plan billed through Stripe.
      continue;
    }
    synced += 1;
    await finishTransaction({
      purchase: purchase as Purchase,
      isConsumable: false,
    }).catch(() => undefined);
  }
  return synced;
}

/** Restore Purchases button. Asks the App Store to re-sync, then sends results to the server. */
export async function restoreAppStorePurchases(): Promise<number> {
  await initConnection();
  await restorePurchases();
  return syncActiveAppStorePurchases();
}

/** Localized App Store price per product id, e.g. "$29.99". Null until loaded. */
export function useAppStorePrices(): Record<string, string> | null {
  const [prices, setPrices] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await initConnection();
        const products = await fetchProducts({
          skus: APPLE_PRODUCT_SKUS,
          type: "subs",
        });
        const next: Record<string, string> = {};
        for (const product of products ?? []) {
          if (product.displayPrice) next[product.id] = product.displayPrice;
        }
        if (!cancelled) setPrices(next);
      } catch {
        if (!cancelled) setPrices({});
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return prices;
}

/**
 * Sends the device's active App Store subscription to the server on launch and
 * when the app returns to the foreground. Records renewals and finishes any
 * purchase whose first server call failed.
 */
export function useAppStoreSync() {
  const { user, refresh } = useSession();
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    let running = false;

    const run = async () => {
      if (running) return;
      running = true;
      try {
        const synced = await syncActiveAppStorePurchases();
        if (synced > 0 && !cancelled) await refresh();
      } catch {
        // Store unavailable — try again next time the app is active.
      } finally {
        running = false;
      }
    };

    void run();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void run();
    });
    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, [userId, refresh]);
}
