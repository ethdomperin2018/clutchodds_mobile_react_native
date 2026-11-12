import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import { apiRequest } from "@/lib/api/client";

WebBrowser.maybeCompleteAuthSession();

const MESSAGES: Record<string, string> = {
  linked: "Discord is connected. You're in the server.",
  linked_invite:
    "Discord is connected. We could not add you automatically, so we sent the invite to your email.",
  discord_taken: "That Discord account is already connected to another user.",
  discord_denied: "Discord connect was cancelled.",
  discord_not_configured: "Discord connect is not configured yet.",
  discord_auth_failed: "Discord connect failed. Please try again.",
  invalid_state: "Discord connect expired. Please try again.",
};

export class DiscordConnectCancelledError extends Error {
  constructor() {
    super("Discord connect was cancelled.");
    this.name = "DiscordConnectCancelledError";
  }
}

export async function connectDiscord(): Promise<"linked" | "linked_invite"> {
  const redirectUri = Linking.createURL("discord");
  const { url } = await apiRequest<{ url: string }>("/api/discord/connect", {
    method: "POST",
    body: { redirectUri },
  });

  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.location.assign(url);
    return new Promise(() => {});
  }

  const result = await WebBrowser.openAuthSessionAsync(url, redirectUri, {
    preferEphemeralSession: Platform.OS === "ios",
    showInRecents: false,
  });

  if (result.type === "cancel" || result.type === "dismiss") {
    throw new DiscordConnectCancelledError();
  }
  if (result.type !== "success" || !("url" in result) || !result.url) {
    throw new Error("Discord connect failed. Please try again.");
  }

  const parsed = new URL(result.url);
  const code = parsed.searchParams.get("discord");
  if (code === "linked" || code === "linked_invite") {
    if (code === "linked_invite" || parsed.searchParams.get("joined") === "0") {
      return "linked_invite";
    }
    return "linked";
  }
  throw new Error(MESSAGES[code ?? ""] ?? "Discord connect failed. Please try again.");
}

export async function disconnectDiscord(): Promise<void> {
  await apiRequest<{ ok?: boolean }>("/api/discord/unlink", { method: "POST" });
}
