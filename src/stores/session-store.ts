import { create } from "zustand";
import type { AuthUser } from "@/types/auth";

type SessionState = {
  user: AuthUser | null;
  ready: boolean;
  setUser: (user: AuthUser | null) => void;
  setReady: (ready: boolean) => void;
};

export const useSessionStore = create<SessionState>((set) => ({
  user: null,
  ready: false,
  setUser: (user) => set({ user }),
  setReady: (ready) => set({ ready }),
}));
