import type { UserAccountStatus } from "@/types/auth";

export function isAccountActive(status: UserAccountStatus): boolean {
  return status === "active";
}

export function getAccountStatusLabel(status: UserAccountStatus): string {
  switch (status) {
    case "active":
      return "Active";
    case "pending":
      return "Pending";
    case "suspended":
      return "Suspended";
    case "disabled":
      return "Disabled";
  }
}

export function getAccountStatusMessage(status: UserAccountStatus): string {
  switch (status) {
    case "pending":
      return "Your account is pending approval. You cannot use the app until an admin activates it.";
    case "suspended":
      return "Your account has been suspended. Contact support if you believe this is a mistake.";
    case "disabled":
      return "Your account has been disabled. Contact support for help.";
    default:
      return "Your account is not active.";
  }
}
