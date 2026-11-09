import * as WebBrowser from "expo-web-browser";
import { Linking } from "react-native";
import { env } from "@/config/env";

/** Opens the web Terms of Service page (same document as clutchodds.com/terms). */
export function openTermsOfService() {
  return WebBrowser.openBrowserAsync(env.termsUrl);
}

/** Opens the web Privacy Policy page (same document as clutchodds.com/privacy). */
export function openPrivacyPolicy() {
  return WebBrowser.openBrowserAsync(env.privacyUrl);
}

/** Opens the website FAQ. The answers stay on the site, not in the app. */
export function openFaq() {
  return WebBrowser.openBrowserAsync(env.faqUrl);
}

export function openSupportEmail() {
  return Linking.openURL(`mailto:${env.supportEmail}`);
}

export function openDiscord() {
  if (!env.discordInviteUrl) return;
  return Linking.openURL(env.discordInviteUrl);
}
