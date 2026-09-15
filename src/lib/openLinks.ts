import * as WebBrowser from "expo-web-browser";
import { Linking } from "react-native";
import { env } from "@/config/env";

export const TELEGRAM_CHANNEL_URL = "https://t.me/clutchoddarbs";

export function getPricingUrl(returnTo = "/dashboard"): string {
  const path = `/?next=${encodeURIComponent(returnTo)}#pricing`;
  return `${env.webBaseUrl}${path}`;
}

export function openPricing(returnTo?: string) {
  return WebBrowser.openBrowserAsync(getPricingUrl(returnTo));
}

export function openTelegramChannel() {
  return Linking.openURL(TELEGRAM_CHANNEL_URL);
}

export function openWebPath(path: string) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return WebBrowser.openBrowserAsync(`${env.webBaseUrl}${normalized}`);
}
