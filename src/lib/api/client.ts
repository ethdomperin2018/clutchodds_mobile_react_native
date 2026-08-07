import { env } from "@/config/env";
import { sessionStorage } from "@/features/auth/session-storage";
import type { ApiErrorPayload } from "./types";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly email?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

async function buildHeaders(headers?: HeadersInit) {
  const nextHeaders = new Headers(headers);
  nextHeaders.set("Accept", "application/json");

  const sessionHint = await sessionStorage.getSessionHint();
  if (sessionHint) {
    nextHeaders.set("x-session-hint", sessionHint);
  }

  return nextHeaders;
}

async function readErrorPayload(response: Response): Promise<ApiErrorPayload> {
  try {
    return (await response.json()) as ApiErrorPayload;
  } catch {
    return { error: "Request failed." };
  }
}

const DEFAULT_TIMEOUT_MS = 20_000;

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const headers = await buildHeaders(options.headers);
  const hasBody = options.body !== undefined;

  if (hasBody) {
    headers.set("Content-Type", "application/json");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(`${env.apiBaseUrl}${path}`, {
      ...options,
      headers,
      credentials: "include",
      signal: options.signal ?? controller.signal,
      body: hasBody ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      const payload = await readErrorPayload(response);
      throw new ApiError(
        payload.error ?? "Request failed.",
        response.status,
        payload.code,
        payload.email
      );
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError("Request timed out. Is the API running?", 408);
    }

    throw new ApiError(
      error instanceof Error ? error.message : "Network request failed.",
      0
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
