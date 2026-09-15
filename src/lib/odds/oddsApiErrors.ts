export type OddsApiErrorCode =
  | "OUT_OF_USAGE_CREDITS"
  | "UNAUTHORIZED"
  | "MISSING_API_KEY"
  | "UNKNOWN";

export type OddsApiUserError = {
  code: OddsApiErrorCode;
  title: string;
  message: string;
};

export function parseOddsApiError(raw: string): OddsApiUserError {
  const lower = raw.toLowerCase();

  if (
    raw.includes("OUT_OF_USAGE_CREDITS") ||
    lower.includes("usage quota has been reached")
  ) {
    return {
      code: "OUT_OF_USAGE_CREDITS",
      title: "Odds data temporarily unavailable",
      message:
        "The odds data provider has reached its usage limit for this billing period. Live lines and arbitrage opportunities will return once the quota resets or the plan is upgraded. Try again later.",
    };
  }

  if (raw.includes("Missing THE_ODDS_API_KEY")) {
    return {
      code: "MISSING_API_KEY",
      title: "Odds feed not configured",
      message:
        "Odds data is not configured on this server. Contact support if this persists.",
    };
  }

  if (
    raw.includes(": 401") ||
    lower.includes("invalid api key") ||
    lower.includes("unauthorized")
  ) {
    return {
      code: "UNAUTHORIZED",
      title: "Odds API authentication failed",
      message:
        "Could not authenticate with the odds data provider. The API key may be invalid or expired.",
    };
  }

  return {
    code: "UNKNOWN",
    title: "Could not load odds",
    message: shortenRawOddsError(raw),
  };
}

function shortenRawOddsError(raw: string): string {
  const parts = raw.split(/\s*\|\s*/);
  if (parts.length <= 1) return raw.slice(0, 280);

  const first = parseOddsApiError(parts[0]!);
  if (first.code !== "UNKNOWN") {
    return first.message;
  }

  return "Could not load odds from one or more sports. Refresh in a moment or contact support if this continues.";
}

export function resolveOddsApiErrorDisplay(input: {
  error: string;
  errorCode?: string;
  errorTitle?: string;
}): OddsApiUserError {
  if (input.errorTitle) {
    return {
      code: (input.errorCode as OddsApiErrorCode | undefined) ?? "UNKNOWN",
      title: input.errorTitle,
      message: input.error,
    };
  }
  return parseOddsApiError(input.error);
}
