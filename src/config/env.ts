import Constants from "expo-constants";
import { Platform } from "react-native";

function isLoopbackHost(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0" ||
    hostname === "::1"
  );
}

/** Metro / Expo Go host (LAN IP) — used so a phone can reach the PC API. */
function getExpoPackagerHostname(): string | null {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    // Legacy Expo Go manifests
    (Constants as { manifest?: { debuggerHost?: string } }).manifest
      ?.debuggerHost ??
    (
      Constants as {
        manifest2?: { extra?: { expoClient?: { hostUri?: string } } };
      }
    ).manifest2?.extra?.expoClient?.hostUri;

  if (!hostUri) return null;
  const host = hostUri.split(":")[0]?.trim();
  if (!host || isLoopbackHost(host)) return null;
  return host;
}

function rewriteLoopbackForNative(url: string): string {
  // Web can talk to localhost on the same machine.
  if (Platform.OS === "web") return url;

  try {
    const parsed = new URL(url);
    if (!isLoopbackHost(parsed.hostname)) return url;

    // Android emulator: special alias to the host machine.
    if (Platform.OS === "android") {
      const packagerHost = getExpoPackagerHostname();
      // Physical device / Expo Go → use the same LAN IP Metro uses.
      if (packagerHost) {
        parsed.hostname = packagerHost;
        return parsed.toString().replace(/\/$/, "");
      }
      parsed.hostname = "10.0.2.2";
      return parsed.toString().replace(/\/$/, "");
    }

    // iOS simulator can use loopback; physical device needs packager host.
    const packagerHost = getExpoPackagerHostname();
    if (packagerHost) {
      parsed.hostname = packagerHost;
      return parsed.toString().replace(/\/$/, "");
    }

    return url;
  } catch {
    return url;
  }
}

function getDefaultApiBaseUrl() {
  const packagerHost = getExpoPackagerHostname();
  if (packagerHost) {
    return `http://${packagerHost}:3000`;
  }

  if (Platform.OS === "android") {
    return "http://10.0.2.2:3000";
  }

  if (Platform.OS === "ios") {
    return "http://127.0.0.1:3000";
  }

  return "http://localhost:3000";
}

const expoExtra = Constants.expoConfig?.extra as
  | {
      apiBaseUrl?: string;
      uiOnly?: boolean;
    }
  | undefined;

/** When true, skip backend auth (mock local user). Default false for real API. */
const uiOnlyFromEnv = process.env.EXPO_PUBLIC_UI_ONLY;
const uiOnly =
  uiOnlyFromEnv != null
    ? uiOnlyFromEnv !== "false" && uiOnlyFromEnv !== "0"
    : (expoExtra?.uiOnly ?? false);

const configuredApiBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  expoExtra?.apiBaseUrl ??
  getDefaultApiBaseUrl();

/**
 * Origin used to start Google OAuth in the system browser.
 * Must match the Next `APP_BASE_URL` / Google redirect URI host.
 * Defaults to the API base (same Next server).
 */
const configuredOauthBaseUrl =
  process.env.EXPO_PUBLIC_OAUTH_BASE_URL?.trim() || configuredApiBaseUrl;

export const env = {
  apiBaseUrl: rewriteLoopbackForNative(configuredApiBaseUrl),
  oauthBaseUrl: rewriteLoopbackForNative(configuredOauthBaseUrl),
  appName: "Clutch Odds Mobile",
  uiOnly,
};
