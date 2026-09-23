import { env } from "@/config/env";

/** Display + checkout trial length (days). Card required at checkout. */
function parseTrialDays(raw: string | undefined, fallback: number): number {
  if (!raw?.trim()) return fallback;
  const days = Number(raw.trim());
  return Number.isFinite(days) && days > 0 ? days : fallback;
}

export function getProTrialDays(): number {
  return parseTrialDays(process.env.EXPO_PUBLIC_PRO_TRIAL_DAYS, 14);
}

export function getProTrialLabel(): string {
  return `${getProTrialDays()}-day free trial`;
}

export function getProTrialSummary(): string {
  return `${getProTrialLabel()} · Cancel anytime · Then $${env.proPriceAmount}/mo`;
}
