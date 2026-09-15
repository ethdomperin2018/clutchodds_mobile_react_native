import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { useSession } from "@/features/auth/SessionProvider";
import { OnboardingModal } from "@/features/onboarding/OnboardingModal";
import {
  completeOnboarding,
  isOnboardingComplete,
  resetOnboarding,
  subscribeOnboardingReplay,
} from "@/lib/onboarding/onboardingStorage";

type OnboardingContextValue = {
  replayTour: () => Promise<void>;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }
  return ctx;
}

export function OnboardingProvider({ children }: PropsWithChildren) {
  const { user, ready } = useSession();
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const dismiss = useCallback(() => {
    if (user?.id) {
      void completeOnboarding(user.id);
    }
    setOpen(false);
    setStepIndex(0);
  }, [user?.id]);

  const openTour = useCallback(() => {
    setStepIndex(0);
    setOpen(true);
  }, []);

  const replayTour = useCallback(async () => {
    if (!user?.id) return;
    await resetOnboarding(user.id);
    openTour();
  }, [openTour, user?.id]);

  useEffect(() => {
    if (!ready) return;
    if (!user?.id) {
      setOpen(false);
      setStepIndex(0);
      return;
    }
    let cancelled = false;
    void (async () => {
      const done = await isOnboardingComplete(user.id);
      if (!cancelled && !done) {
        openTour();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, user?.id, openTour]);

  useEffect(() => {
    return subscribeOnboardingReplay((userId) => {
      if (userId !== user?.id) return;
      openTour();
    });
  }, [openTour, user?.id]);

  const value = useMemo(() => ({ replayTour }), [replayTour]);

  return (
    <OnboardingContext.Provider value={value}>
      {children}
      <OnboardingModal
        open={open}
        stepIndex={stepIndex}
        onStepChange={setStepIndex}
        onComplete={dismiss}
        onSkip={dismiss}
      />
    </OnboardingContext.Provider>
  );
}
