import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { billingApi } from "@/lib/api/endpoints/billing";
import { isProUser } from "@/lib/planAccess";
import type { AuthUser } from "@/types/auth";

WebBrowser.maybeCompleteAuthSession();

export type BillingBrowserResult =
  | { status: "success" }
  | { status: "cancel" }
  | { status: "dismissed" }
  | { status: "upgraded" };

function parseBillingFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.searchParams.get("billing");
  } catch {
    const match = /[?&#]billing=([^&]+)/.exec(url);
    return match?.[1] ? decodeURIComponent(match[1]) : null;
  }
}

async function openStripeUrl(
  url: string,
  returnUrl: string
): Promise<BillingBrowserResult> {
  const result = await WebBrowser.openAuthSessionAsync(url, returnUrl);
  if (result.type === "success") {
    const billing = parseBillingFromUrl(result.url);
    if (billing === "success") return { status: "success" };
    if (billing === "cancel") return { status: "cancel" };
    return { status: "success" };
  }
  return { status: "dismissed" };
}

/** Poll /me until Pro/Elite is active (webhook lag) or timeout. */
export async function refreshUntilPro(
  refresh: () => Promise<AuthUser | null>,
  timeoutMs = 15_000
): Promise<AuthUser | null> {
  const deadline = Date.now() + timeoutMs;
  let latest: AuthUser | null = null;

  while (Date.now() < deadline) {
    latest = await refresh();
    if (latest && isProUser(latest)) return latest;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return refresh();
}

export async function openMobileBillingPortal(
  returnPath: "pricing" | "settings" = "settings"
): Promise<BillingBrowserResult> {
  const returnUrl = Linking.createURL(returnPath);
  const data = await billingApi.portal({ returnUrl });
  if (!data.url) {
    throw new Error("Billing portal URL missing.");
  }
  return openStripeUrl(data.url, returnUrl);
}
