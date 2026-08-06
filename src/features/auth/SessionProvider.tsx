import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { authApi } from "@/lib/api/endpoints/auth";
import { queryClient } from "@/lib/query/query-client";
import { sessionStorage } from "./session-storage";
import { useSessionStore } from "@/stores/session-store";
import type { AuthUser } from "@/types/auth";

type SessionContextValue = {
  user: AuthUser | null;
  ready: boolean;
  isRefreshing: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<AuthUser | null>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: PropsWithChildren) {
  const user = useSessionStore((state) => state.user);
  const ready = useSessionStore((state) => state.ready);
  const setUser = useSessionStore((state) => state.setUser);
  const setReady = useSessionStore((state) => state.setReady);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const persistUser = useCallback(
    async (nextUser: AuthUser | null) => {
      setUser(nextUser);
      await sessionStorage.setUser(nextUser);
    },
    [setUser]
  );

  const refresh = useCallback(async () => {
    setIsRefreshing(true);

    try {
      const response = await authApi.me();
      const nextUser = response.user ?? null;
      await persistUser(nextUser);
      return nextUser;
    } catch {
      await persistUser(null);
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
        // Don't block the login/marketing UI on a hung API call.
        if (mounted) {
          setReady(true);
        }
      }

      if (mounted) {
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
      const response = await authApi.login(email, password);
      await persistUser(response.user ?? null);
      await queryClient.invalidateQueries();
    },
    [persistUser]
  );

  const signup = useCallback(
    async (name: string, email: string, password: string) => {
      const response = await authApi.signup(name, email, password);
      await persistUser(response.user ?? null);
      await queryClient.invalidateQueries();
    },
    [persistUser]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
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
      logout,
      refresh,
    }),
    [user, ready, isRefreshing, login, signup, logout, refresh]
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
