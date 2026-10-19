import { Linking, Platform } from "react-native";
import type { AuthUser } from "@/types/auth";
import {
  openMobileBillingPortal,
  type BillingBrowserResult,
} from "@/lib/billing/stripeBrowser";

/** Stripe portal on Android and the web. Apple's subscription sheet on iOS. */
export async function openManageSubscription(
  user: AuthUser,
  returnPath: "pricing" | "settings" = "settings"
): Promise<BillingBrowserResult> {
  if (user.billingProvider === "apple") {
    if (Platform.OS === "ios") {
      const { showManageSubscriptionsIOS } = await import("expo-iap");
      try {
        await showManageSubscriptionsIOS();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error ?? "");
        if (/request cancel(?:ed|led)|user cancel(?:ed|led)/i.test(message)) {
          return { status: "cancel" };
        }
        throw error;
      }
      return { status: "success" };
    }
    await Linking.openURL("https://apps.apple.com/account/subscriptions");
    return { status: "success" };
  }
  return openMobileBillingPortal(returnPath);
}
