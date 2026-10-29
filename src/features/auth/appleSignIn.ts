import * as AppleAuthentication from "expo-apple-authentication";
import { Platform } from "react-native";
import { authApi } from "@/lib/api/endpoints/auth";

export class AppleSignInCancelledError extends Error {
  constructor() {
    super("Apple sign-in was cancelled.");
    this.name = "AppleSignInCancelledError";
  }
}

export function isAppleSignInAvailable(): boolean {
  return Platform.OS === "ios";
}

function appleName(
  fullName: AppleAuthentication.AppleAuthenticationFullName | null
): string | null {
  const name = [fullName?.givenName, fullName?.familyName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");
  return name || null;
}

/** Native Sign in with Apple. Returns a Clutch session token. */
export async function signInWithAppleNative(): Promise<string> {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    const identityToken = credential.identityToken?.trim() ?? "";
    if (!identityToken) {
      throw new Error("Apple sign-in did not return a token.");
    }

    const response = await authApi.appleToken(
      identityToken,
      appleName(credential.fullName)
    );
    const sessionToken = response.sessionToken?.trim();
    if (!sessionToken) {
      throw new Error("Sign in with Apple failed. Please try again.");
    }
    return sessionToken;
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as { code?: string }).code === "ERR_REQUEST_CANCELED"
    ) {
      throw new AppleSignInCancelledError();
    }
    throw error;
  }
}
