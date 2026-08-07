import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { env } from "@/config/env";
import { authApi } from "@/lib/api/endpoints/auth";
import { queryClient } from "@/lib/query/query-client";
import { sessionStorage } from "./session-storage";
import { useSessionStore } from "@/stores/session-store";
import type { AuthUser } from "@/types/auth";

export type SignupOutcome =
  | { requiresVerification: true; email: string }
  | { requiresVerification: false };

type SessionContextValue = {
  user: AuthUser | null;
  ready: boolean;
  isRefreshing: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (
    name: string,
    email: string,
    password: string
  ) => Promise<SignupOutcome>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<AuthUser | null>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

function mockUser(partial: {
  email: string;
  name?: string;
}): AuthUser {
  return {
    id: "ui-local-user",
    email: partial.email,
    name: partial.name ?? "Clutch Odds User",
    createdAt: new Date().toISOString(),
    plan: "free",
    billingInterval: null,
    subscriptionStatus: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    hasSubscriptionRecord: false,
    canManageStripeBilling: false,
    proTrialUsed: false,
    isAdmin: false,
    accountStatus: "active",
  };
}

export function SessionProvider({ children }: PropsWithChildren) {
  const user = useSessionStore((state) => state.user);
  const ready = useSessionStore((state) => state.ready);
  const setUser = useSessionStore((state) => state.setUser);
  const setReady = useSessionStore((state) => state.setReady);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const persistUser = useCallback(
    async (nextUser: AuthUser | null, sessionToken?: string | null) => {
      setUser(nextUser);
      await sessionStorage.setUser(nextUser);
      if (sessionToken !== undefined) {
        await sessionStorage.setSessionHint(sessionToken);
      } else if (!nextUser) {
        await sessionStorage.setSessionHint(null);
      }
    },
    [setUser]
  );

  const refresh = useCallback(async () => {
    if (env.uiOnly) {
      return useSessionStore.getState().user;
    }

    setIsRefreshing(true);

    try {
      const response = await authApi.me();
      const nextUser = response.user ?? null;
      await persistUser(nextUser);
      return nextUser;
    } catch {
      await persistUser(null, null);
      return null;
    } finally {
      setIsRefreshing(false);
    }
  }, [persistUser]);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      try {
        const cachedUser = await sessionStorage.getUser();
        if (mounted && cachedUser) {
          setUser(cachedUser);
        }
      } finally {
        if (mounted) {
          setReady(true);
        }
      }

      if (mounted && !env.uiOnly) {
        await refresh();
      }
    };

    void bootstrap();

    return () => {
      mounted = false;
    };
  }, [refresh, setReady, setUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      if (env.uiOnly) {
        await persistUser(mockUser({ email }));
        return;
      }

      const response = await authApi.login(email, password);
      await persistUser(response.user ?? null, response.sessionToken ?? null);
      await queryClient.invalidateQueries();
    },
    [persistUser]
  );

  const signup = useCallback(
    async (name: string, email: string, password: string) => {
      if (env.uiOnly) {
        return { requiresVerification: true as const, email };
      }

      const response = await authApi.signup(name, email, password);
      if ("requiresVerification" in response && response.requiresVerification) {
        return {
          requiresVerification: true as const,
          email: response.email || email,
        };
      }

      await persistUser(
        "user" in response ? (response.user ?? null) : null,
        "sessionToken" in response
          ? ((response as { sessionToken?: string }).sessionToken ?? null)
          : null
      );
      await queryClient.invalidateQueries();
      return { requiresVerification: false as const };
    },
    [persistUser]
  );

  const verifyEmail = useCallback(
    async (email: string, code: string) => {
      if (env.uiOnly) {
        await persistUser(mockUser({ email }), null);
        return;
      }

      const response = await authApi.verifyEmail(email, code);
      await persistUser(response.user ?? null, response.sessionToken ?? null);
      await queryClient.invalidateQueries();
    },
    [persistUser]
  );

  const resendVerification = useCallback(async (email: string) => {
    if (env.uiOnly) {
      return;
    }
    await authApi.resendVerification(email);
  }, []);

  const logout = useCallback(async () => {
    try {
      if (!env.uiOnly) {
        await authApi.logout();
      }
    } finally {
      await sessionStorage.clear();
      setUser(null);
      await queryClient.clear();
    }
  }, [setUser]);

  const value = useMemo(
    () => ({
      user,
      ready,
      isRefreshing,
      login,
      signup,
      verifyEmail,
      resendVerification,
      logout,
      refresh,
    }),
    [
      user,
      ready,
      isRefreshing,
      login,
      signup,
      verifyEmail,
      resendVerification,
      logout,
      refresh,
    ]
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error("useSession must be used within SessionProvider");
  }

  return context;
}
