import type { AuthUser } from "@/types/auth";
import { getPlanPriceLabel } from "@/lib/billing/plans";
import { getProTrialSummary } from "@/lib/billing/trial";
import { isEliteUser, isProOnlyUser, isProUser } from "@/lib/planAccess";

export function formatMediumDate(iso: string | null): string | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime();
  if (!Number.isFinite(ms)) return null;
  return new Date(iso).toLocaleDateString("en-US", { dateStyle: "medium" });
}

function formatDate(iso: string | null): string | null {
  return formatMediumDate(iso);
}

export function hadProSubscription(user: AuthUser): boolean {
  if (user.hasSubscriptionRecord) return true;
  return user.subscriptionStatus !== null || user.currentPeriodEnd !== null;
}

export function isTrialingUser(user: AuthUser): boolean {
  return user.subscriptionStatus === "trialing";
}

export function getPlanDisplayName(user: AuthUser): string {
  if (isEliteUser(user)) return "Elite";
  if (isTrialingUser(user)) return "Pro (trial)";
  return isProUser(user) ? "Pro" : "Free";
}

export function getSubscriptionPeriodLabel(user: AuthUser): string {
  if (user.cancelAtPeriodEnd) return "Access until";
  if (isTrialingUser(user) && !isEliteUser(user)) return "Trial ends on";
  return "Renews on";
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
  return (
    user.subscriptionStatus === null || user.subscriptionStatus === "trialing"
  );
}

export function getLapsedProMessage(user: AuthUser): string | null {
  if (!isLapsedProUser(user)) return null;

  const endDate = formatDate(user.currentPeriodEnd);

  if (hadExpiredTrial(user) && endDate) {
    return `Your free trial ended on ${endDate}. Subscribe to Pro or Elite to unlock Arbitrage, Value Bets, bet log, and analytics.`;
  }

  if (endDate) {
    return `Your subscription ended on ${endDate}. Resubscribe to unlock Arbitrage, Value Bets, bet log, and analytics.`;
  }

  return "Your subscription is no longer active. Resubscribe to unlock paid features.";
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
    return getLapsedProMessage(user) ?? "Your subscription is no longer active.";
  }
  return "Start a free trial to unlock Arbitrage, Value Bets, bet log, personal analytics, and Telegram arb alerts.";
}

export function getResubscribeLabel(user: AuthUser | null): string {
  if (user && isLapsedProUser(user) && !user.proTrialUsed) {
    return "Start free trial";
  }
  return user && isLapsedProUser(user)
    ? "Resubscribe to Pro"
    : "Start free trial";
}

export function getLapsedPrimaryActionLabel(user: AuthUser | null): string {
  if (user && needsPaymentUpdate(user) && !isProUser(user)) {
    return "Update payment method";
  }
  return getResubscribeLabel(user);
}

export function getEliteUpgradeLabel(user?: AuthUser | null): string {
  const interval = user?.billingInterval ?? "month";
  return `Upgrade to Elite (${getPlanPriceLabel("elite", interval)})`;
}

export function getPaidRenewalPriceLabel(user: AuthUser): string {
  const interval = user.billingInterval ?? "month";
  if (isEliteUser(user)) return getPlanPriceLabel("elite", interval);
  return getPlanPriceLabel("pro", interval);
}

export function canUpgradeToElite(user: AuthUser): boolean {
  return isProOnlyUser(user);
}

export { getProTrialSummary };
