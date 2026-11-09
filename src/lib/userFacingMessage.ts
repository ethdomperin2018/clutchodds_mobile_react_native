import { ApiError } from "@/lib/api/client";

const CONNECTION =
  "Could not connect. Check your internet connection and try again.";

const TECHNICAL =
  /fetch failed|unexpectedexception|expomodulescore|\.swift:|tls|secure connection|network request failed|nsurlerror|econn|enotfound|socket hang up|typeerror|json parse/i;

function rawMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "";
}

/** Text safe to show in the app. Server messages pass through. Native exceptions do not. */
export function userFacingMessage(error: unknown, fallback: string): string {
  const raw = rawMessage(error).trim();
  if (
    (error instanceof Error && error.name === "AbortError") ||
    /timed out|timeout/i.test(raw)
  ) {
    return "The request timed out. Check your connection and try again.";
  }
  if (TECHNICAL.test(raw)) return CONNECTION;
  if (error instanceof ApiError && raw) return raw;
  if (raw && raw.length <= 160 && !raw.includes("\n")) return raw;
  return fallback;
}
