import { ApiError } from "@/lib/api/client";
import type { AuthUser } from "@/types/auth";

/** Refresh session when a Pro/Elite-gated API rejects the user (402). */
export async function refreshAuthIfProDenied(
  error: unknown,
  refresh: () => Promise<AuthUser | null>
): Promise<boolean> {
  if (!(error instanceof ApiError) || error.status !== 402) return false;
  await refresh();
  return true;
}
