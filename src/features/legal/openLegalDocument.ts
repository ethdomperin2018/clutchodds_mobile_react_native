import * as WebBrowser from "expo-web-browser";
import { env } from "@/config/env";

/** Opens the web Terms of Service page (same document as clutchodds.com/terms). */
export function openTermsOfService() {
  return WebBrowser.openBrowserAsync(env.termsUrl);
}

/** Opens the web Privacy Policy page (same document as clutchodds.com/privacy). */
export function openPrivacyPolicy() {
  return WebBrowser.openBrowserAsync(env.privacyUrl);
}
