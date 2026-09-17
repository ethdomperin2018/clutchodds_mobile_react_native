import type { AuthUser } from "@/types/auth";

function hasPaidAccessStatus(status: AuthUser["subscriptionStatus"]) {
  return status === "active" || status === "trialing" || status === "past_due";
}

function isPaidPlan(plan: AuthUser["plan"]) {
  return plan === "pro" || plan === "elite";
}

/** Pro + Elite unlock scanner, bet log, and value bets (mirrors web `isProUser`). */
export function isProUser(user: AuthUser | null | undefined): boolean {
  if (!user) return false;
  if (user.isAdmin) return true;
  return hasPaidAccessStatus(user.subscriptionStatus) && isPaidPlan(user.plan);
}

export function isEliteUser(user: AuthUser | null | undefined): boolean {
  if (!user) return false;
  if (user.isAdmin) return true;
  return (
    hasPaidAccessStatus(user.subscriptionStatus) && user.plan === "elite"
  );
}
