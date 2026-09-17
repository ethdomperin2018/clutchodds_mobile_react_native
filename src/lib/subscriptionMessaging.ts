import type { AuthUser } from "@/types/auth";
import { isProUser } from "@/lib/planAccess";

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime();
  if (!Number.isFinite(ms)) return null;
  return new Date(iso).toLocaleDateString("en-US", { dateStyle: "medium" });
}

export function hadProSubscription(user: AuthUser): boolean {
  if (user.hasSubscriptionRecord) return true;
  return user.subscriptionStatus !== null || user.currentPeriodEnd !== null;
}

export function isLapsedProUser(user: AuthUser): boolean {
  return !isProUser(user) && hadProSubscription(user);
}

export function needsPaymentUpdate(user: AuthUser): boolean {
  return user.subscriptionStatus === "past_due";
}

export function hadExpiredTrial(user: AuthUser): boolean {
  if (!isLapsedProUser(user) || !user.currentPeriodEnd) return false;
  const endMs = new Date(user.currentPeriodEnd).getTime();
  if (!Number.isFinite(endMs) || endMs > Date.now()) return false;
  return user.subscriptionStatus === null || user.subscriptionStatus === "trialing";
}

export function getProGateTitle(user: AuthUser | null, feature: string): string {
  if (user && needsPaymentUpdate(user) && !isProUser(user)) {
    return "Payment failed";
  }
  if (user && isLapsedProUser(user)) {
    return "Subscription ended";
  }
  return `Pro required for ${feature}`;
}

export function getProGateBody(user: AuthUser | null): string {
  if (user && isLapsedProUser(user)) {
    const endDate = formatDate(user.currentPeriodEnd);
    if (hadExpiredTrial(user) && endDate) {
      return `Your free trial ended on ${endDate}. Subscribe to Pro or Elite to unlock Arbitrage, Value Bets, bet log, and analytics.`;
    }
    if (endDate) {
      return `Your subscription ended on ${endDate}. Resubscribe to unlock Arbitrage, Value Bets, bet log, and analytics.`;
    }
    return "Your subscription is no longer active. Resubscribe to unlock paid features.";
  }
  return "Start a free trial to unlock Arbitrage, Value Bets, bet log, personal analytics, and Telegram arb alerts.";
}

export function getLapsedPrimaryActionLabel(user: AuthUser | null): string {
  if (user && needsPaymentUpdate(user) && !isProUser(user)) {
    return "Update payment method";
  }
  if (user && isLapsedProUser(user) && !user.proTrialUsed) {
    return "Start free trial";
  }
  return user && isLapsedProUser(user) ? "Resubscribe to Pro" : "Start free trial";
}
