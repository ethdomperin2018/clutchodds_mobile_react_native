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
  timeoutMs?: number;
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
const CONNECTION_ERROR =
  "Could not connect. Check your internet connection and try again.";

function isConnectionFailure(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /fetch failed|network request failed|tls|secure connection|offline|internet/i.test(
    message
  );
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { timeoutMs, body, headers: headerInit, ...rest } = options;
  const headers = await buildHeaders(headerInit);
  const hasBody = body !== undefined;

  if (hasBody) {
    headers.set("Content-Type", "application/json");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    timeoutMs ?? DEFAULT_TIMEOUT_MS
  );

  try {
    const response = await fetch(`${env.apiBaseUrl}${path}`, {
      ...rest,
      headers,
      credentials: "include",
      signal: rest.signal ?? controller.signal,
      body: hasBody ? JSON.stringify(body) : undefined,
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
      throw new ApiError(
        "The request timed out. Check your connection and try again.",
        408
      );
    }

    throw new ApiError(
      isConnectionFailure(error)
        ? CONNECTION_ERROR
        : "Something went wrong. Please try again.",
      0
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
