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
      await showManageSubscriptionsIOS();
      return { status: "success" };
    }
    await Linking.openURL("https://apps.apple.com/account/subscriptions");
    return { status: "success" };
  }
  return openMobileBillingPortal(returnPath);
}
