export type UserAccountStatus = "active" | "pending" | "suspended" | "disabled";

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "unpaid"
  | "paused"
  | null;

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  plan: "free" | "pro" | "elite";
  billingInterval: "month" | "year" | null;
  subscriptionStatus: SubscriptionStatus;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  hasSubscriptionRecord: boolean;
  canManageStripeBilling: boolean;
  proTrialUsed: boolean;
  isAdmin: boolean;
  accountStatus: UserAccountStatus;
};
