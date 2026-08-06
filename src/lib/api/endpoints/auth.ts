import { apiRequest } from "@/lib/api/client";
import type { AuthResponse } from "@/lib/api/types";

export const authApi = {
  me: () => apiRequest<AuthResponse>("/api/auth/me"),
  login: (email: string, password: string) =>
    apiRequest<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: { email, password },
    }),
  signup: (name: string, email: string, password: string) =>
    apiRequest<AuthResponse>("/api/auth/signup", {
      method: "POST",
      body: { name, email, password },
    }),
  logout: () =>
    apiRequest<{ success?: boolean }>("/api/auth/logout", {
      method: "POST",
    }),
};
