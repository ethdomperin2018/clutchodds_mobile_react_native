import type { AuthUser } from "@/types/auth";
import {
  PLANS,
  PRO_ANNUAL_PRICE_LABEL,
  PRO_PRICE_LABEL,
  type BillingInterval,
  getPlanPriceLabel,
} from "@/lib/billing/plans";
import {
  getProTrialLabel,
  getProTrialPriceNote,
  getProTrialSummary,
} from "@/lib/billing/trial";
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
    return `Your free trial ended on ${endDate}. Pro unlocks Arbitrage, Value Bets, bet log, and analytics. Elite adds Model Predictions.`;
  }

  if (endDate) {
    return `Your subscription ended on ${endDate}. Pro unlocks Arbitrage, Value Bets, bet log, and analytics. Elite adds Model Predictions.`;
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

export function getEliteUpgradeLabel(
  user?: AuthUser | null,
  priceLabel?: string
): string {
  const interval = user?.billingInterval ?? "month";
  return `Upgrade to Elite (${priceLabel ?? getPlanPriceLabel("elite", interval)})`;
}

export function getEliteUpgradeConfirmDescription(
  user: AuthUser,
  priceLabel?: string
): string {
  const price =
    priceLabel ?? getPlanPriceLabel("elite", user.billingInterval ?? "month");
  if (user.billingProvider === "apple") {
    return `Upgrade your App Store subscription to Elite (${price}). Apple charges your Apple Account and credits the unused part of your current plan. Prediction insights unlock immediately.`;
  }
  if (isTrialingUser(user)) {
    return `Your Pro trial will end and Elite billing (${price}) starts today. A prorated charge may apply to your card on file. Prediction insights unlock immediately.`;
  }
  return `Upgrade your subscription to Elite (${price}). A prorated charge may apply today on your saved card. Prediction insights unlock immediately.`;
}

export function getPaidRenewalPriceLabel(
  user: AuthUser,
  priceLabel: (plan: "pro" | "elite", interval: BillingInterval) => string = getPlanPriceLabel
): string {
  const interval = user.billingInterval ?? "month";
  return priceLabel(isEliteUser(user) ? "elite" : "pro", interval);
}

export function canUpgradeToElite(user: AuthUser): boolean {
  return isProOnlyUser(user);
}

export function getProCheckoutCta(user: AuthUser | null): string {
  if (!user || !isLapsedProUser(user)) return PLANS.pro.cta;
  if (needsPaymentUpdate(user)) return "Update payment method";
  if (!user.proTrialUsed) return PLANS.pro.cta;
  if (hadExpiredTrial(user)) return "Subscribe to Pro";
  return "Resubscribe to Pro";
}

export function getProPricingPriceNote(user: AuthUser | null): string {
  if (user && isLapsedProUser(user) && user.proTrialUsed) return "billed monthly";
  return getProTrialPriceNote();
}

export function getProPricingDescription(
  user: AuthUser | null,
  prices?: { month?: string; year?: string }
): string {
  if (user && isLapsedProUser(user) && user.proTrialUsed) {
    return `Full scanner, bet log, and performance analytics. Subscribe at ${prices?.month ?? PRO_PRICE_LABEL} or ${prices?.year ?? PRO_ANNUAL_PRICE_LABEL} (2 months free) — cancel anytime.`;
  }
  return PLANS.pro.description;
}

export function getProPricingPerks(user: AuthUser | null): string[] {
  if (!user || !isLapsedProUser(user)) return PLANS.pro.perks;
  if (!user.proTrialUsed) return PLANS.pro.perks;
  return PLANS.pro.perks.map((perk) =>
    perk.includes(getProTrialLabel()) ? "Full Pro access" : perk
  );
}

export function getPricingFooterMessage(user: AuthUser | null): string | null {
  if (!user || isProUser(user)) return null;
  if (isLapsedProUser(user)) return getLapsedProMessage(user);
  if (!hadProSubscription(user)) {
    return `You're on Free — ${getProTrialSummary().toLowerCase()} to unlock the scanner and bet log, or go Elite for prediction insights.`;
  }
  return null;
}

export function getBillingSuccessMessage(user: AuthUser | null): string {
  if (user && isEliteUser(user)) {
    return "Welcome to Elite! Model Predictions and Value Bets Elite overlays are unlocked.";
  }
  if (user && isTrialingUser(user)) {
    return "Your free trial has started. Full Pro access is unlocked.";
  }
  if (user && isProUser(user)) {
    return "Welcome to Pro! Arbitrage, Value Bets, bet log, and analytics are unlocked.";
  }
  return "Payment received — your plan may take a moment to update.";
}

export { getProTrialSummary };
