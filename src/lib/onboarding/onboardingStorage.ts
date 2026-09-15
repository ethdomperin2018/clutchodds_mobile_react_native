import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "clutch.onboarding.v1";

export type OnboardingState = {
  userId?: string;
  completedAt?: string;
  version: 1;
};

type ReplayListener = (userId: string) => void;

const replayListeners = new Set<ReplayListener>();

function defaultState(): OnboardingState {
  return { version: 1 };
}

export async function loadOnboardingState(
  userId: string | null
): Promise<OnboardingState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as OnboardingState;
    if (parsed.userId && userId && parsed.userId !== userId) {
      return defaultState();
    }
    return { ...defaultState(), ...parsed };
  } catch {
    return defaultState();
  }
}

export async function isOnboardingComplete(
  userId: string | null
): Promise<boolean> {
  if (!userId) return true;
  const state = await loadOnboardingState(userId);
  return Boolean(state.completedAt);
}

export async function completeOnboarding(userId: string): Promise<void> {
  const state: OnboardingState = {
    userId,
    completedAt: new Date().toISOString(),
    version: 1,
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export async function resetOnboarding(userId: string): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
  for (const listener of replayListeners) {
    listener(userId);
  }
}

export function subscribeOnboardingReplay(listener: ReplayListener) {
  replayListeners.add(listener);
  return () => {
    replayListeners.delete(listener);
  };
}
