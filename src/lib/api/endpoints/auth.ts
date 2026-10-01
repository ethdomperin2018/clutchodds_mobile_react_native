import { apiRequest } from "@/lib/api/client";
import type { AuthResponse, SignupResponse } from "@/lib/api/types";

export const authApi = {
  me: () => apiRequest<AuthResponse>("/api/auth/me"),
  login: (email: string, password: string) =>
    apiRequest<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: { email, password },
    }),
  signup: (name: string, email: string, password: string) =>
    apiRequest<SignupResponse>("/api/auth/signup", {
      method: "POST",
      body: { name, email, password },
    }),
  verifyEmail: (email: string, code: string) =>
    apiRequest<AuthResponse>("/api/auth/verify-email", {
      method: "POST",
      body: { email, code },
    }),
  resendVerification: (email: string) =>
    apiRequest<{ message?: string }>("/api/auth/resend-verification", {
      method: "POST",
      body: { email },
    }),
  forgotPassword: (email: string) =>
    apiRequest<{ message?: string }>("/api/auth/forgot-password", {
      method: "POST",
      body: { email, client: "mobile" },
    }),
  validateResetToken: (token: string) =>
    apiRequest<{ valid?: boolean }>(
      `/api/auth/reset-password/validate?token=${encodeURIComponent(token)}`
    ),
  resetPassword: (token: string, password: string) =>
    apiRequest<{ message?: string }>("/api/auth/reset-password", {
      method: "POST",
      body: { token, password },
    }),
  logout: () =>
    apiRequest<{ success?: boolean; ok?: boolean }>("/api/auth/logout", {
      method: "POST",
    }),
  deleteAccount: (email: string) =>
    apiRequest<{ ok?: boolean }>("/api/account/delete", {
      method: "POST",
      body: { confirm: true, email },
    }),
  googleToken: (idToken: string) =>
    apiRequest<AuthResponse>("/api/auth/google/token", {
      method: "POST",
      body: { idToken },
    }),
};
