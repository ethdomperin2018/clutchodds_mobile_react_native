import { router } from "expo-router";
import { env } from "@/config/env";
import * as WebBrowser from "expo-web-browser";
import { Linking } from "react-native";

export const TELEGRAM_CHANNEL_URL = "https://t.me/clutchoddsarb";
export const TELEGRAM_VALUE_BETS_CHANNEL_URL =
  "https://t.me/clutchodds_valuebets";

/** @deprecated Prefer in-app `/(app)/pricing` via `openPricing()`. */
export function getPricingUrl(returnTo = "/dashboard"): string {
  const path = `/?next=${encodeURIComponent(returnTo)}#pricing`;
  return `${env.webBaseUrl}${path}`;
}

/** Opens the native Pricing screen (Free / Pro / Elite). */
export function openPricing(_returnTo?: string) {
  router.push("/(app)/pricing");
}

export function openTelegramChannel() {
  return Linking.openURL(TELEGRAM_CHANNEL_URL);
}

export function openTelegramValueBetsChannel() {
  return Linking.openURL(TELEGRAM_VALUE_BETS_CHANNEL_URL);
}

export function openWebPath(path: string) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return WebBrowser.openBrowserAsync(`${env.webBaseUrl}${normalized}`);
}
