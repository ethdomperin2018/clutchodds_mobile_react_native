import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import type { AuthUser } from "@/types/auth";

const USER_KEY = "clutch-odds-user";
const SESSION_HINT_KEY = "clutch-odds-session-hint";

/** In-memory fallback if web storage is blocked (private mode, etc.). */
const memoryFallback = new Map<string, string>();

async function safelyGet(key: string) {
  if (Platform.OS === "web") {
    try {
      return globalThis.localStorage?.getItem(key) ?? memoryFallback.get(key) ?? null;
    } catch {
      return memoryFallback.get(key) ?? null;
    }
  }

  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function safelySet(key: string, value: string) {
  if (Platform.OS === "web") {
    memoryFallback.set(key, value);
    try {
      globalThis.localStorage?.setItem(key, value);
    } catch {
      // Keep memory fallback only.
    }
    return;
  }

  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    // SecureStore can be unavailable in some simulators; keep boot resilient.
  }
}

async function safelyDelete(key: string) {
  memoryFallback.delete(key);

  if (Platform.OS === "web") {
    try {
      globalThis.localStorage?.removeItem(key);
    } catch {
      // Ignore.
    }
    return;
  }

  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    // Ignore storage failures in scaffold mode.
  }
}

export const sessionStorage = {
  async getUser(): Promise<AuthUser | null> {
    const raw = await safelyGet(USER_KEY);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  },
  async setUser(user: AuthUser | null) {
    if (!user) {
      await safelyDelete(USER_KEY);
      return;
    }

    await safelySet(USER_KEY, JSON.stringify(user));
  },
  async getSessionHint() {
    return safelyGet(SESSION_HINT_KEY);
  },
  async setSessionHint(value: string | null) {
    if (!value) {
      await safelyDelete(SESSION_HINT_KEY);
      return;
    }

    await safelySet(SESSION_HINT_KEY, value);
  },
  async clear() {
    await Promise.all([safelyDelete(USER_KEY), safelyDelete(SESSION_HINT_KEY)]);
  },
};
