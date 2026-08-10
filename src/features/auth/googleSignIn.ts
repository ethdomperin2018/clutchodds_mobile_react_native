import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import { env } from "@/config/env";

WebBrowser.maybeCompleteAuthSession();

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  google_denied: "Google sign-in was cancelled.",
  invalid_state: "Sign-in session expired. Please try again.",
  google_not_configured: "Google sign-in is not configured yet.",
  google_email_unverified: "Your Google email must be verified to sign in.",
  google_auth_failed: "Google sign-in failed. Please try again.",
  account_inactive:
    "This account is not active. Contact support if you need help.",
};

export class GoogleSignInCancelledError extends Error {
  constructor() {
    super("Google sign-in was cancelled.");
    this.name = "GoogleSignInCancelledError";
  }
}

/** Web same-tab navigation — caller should not treat this as failure. */
export class GoogleSignInRedirectingError extends Error {
  constructor() {
    super("Redirecting to Google…");
    this.name = "GoogleSignInRedirectingError";
  }
}

export function googleOAuthRedirectUri(): string {
  return Linking.createURL("auth/google");
}

function messageForOAuthError(code: string | null): string {
  if (!code) return "Google sign-in failed. Please try again.";
  return OAUTH_ERROR_MESSAGES[code] ?? "Sign-in failed. Please try again.";
}

function parseOAuthCallbackUrl(url: string): { token: string } {
  const parsed = new URL(url);
  const hashParams = new URLSearchParams(parsed.hash.replace(/^#/, ""));
  const error =
    parsed.searchParams.get("error") ?? hashParams.get("error");
  if (error) {
    throw new Error(messageForOAuthError(error));
  }

  const token =
    parsed.searchParams.get("token") ?? hashParams.get("token");

  if (!token) {
    throw new Error("Google sign-in failed. Please try again.");
  }

  return { token };
}

function buildGoogleAuthUrl(): { authUrl: string; redirectUri: string } {
  const redirectUri = googleOAuthRedirectUri();
  const authUrl =
    `${env.oauthBaseUrl}/api/auth/google` +
    `?client=mobile&redirect_uri=${encodeURIComponent(redirectUri)}`;
  return { authUrl, redirectUri };
}

/**
 * Opens the existing Next.js Google OAuth flow.
 * - Web: same-tab redirect (avoids COOP popup / window.closed warnings)
 * - Native: auth session browser, returns session token
 */
export async function signInWithGoogleBrowser(): Promise<string> {
  const { authUrl, redirectUri } = buildGoogleAuthUrl();

  if (__DEV__) {
    console.log("[google] oauthBaseUrl", env.oauthBaseUrl);
    console.log("[google] redirectUri", redirectUri);
  }

  // Popup + window.closed polling trips Cross-Origin-Opener-Policy on web.
  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.location.assign(authUrl);
    throw new GoogleSignInRedirectingError();
  }

  const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri, {
    preferEphemeralSession: Platform.OS === "ios",
    showInRecents: false,
  });

  if (result.type === "cancel" || result.type === "dismiss") {
    throw new GoogleSignInCancelledError();
  }

  if (result.type !== "success" || !("url" in result) || !result.url) {
    throw new Error("Google sign-in failed. Please try again.");
  }

  return parseOAuthCallbackUrl(result.url).token;
}
