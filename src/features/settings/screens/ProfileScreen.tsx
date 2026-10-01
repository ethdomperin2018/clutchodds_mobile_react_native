import { router } from "expo-router";
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AppScreen } from "@/components/layout/AppScreen";
import { pageHeaderStyles } from "@/components/layout/pageHeaderStyles";
import { AccountInactiveNotice } from "@/features/auth/AccountInactiveNotice";
import { useSession } from "@/features/auth/SessionProvider";
import {
  getAccountStatusLabel,
  isAccountActive,
} from "@/lib/accountStatus";
import { openPricing } from "@/lib/openLinks";
import { openManageSubscription } from "@/lib/billing/manageSubscription";
import { isProUser } from "@/lib/planAccess";
import {
  formatMediumDate,
  getLapsedPrimaryActionLabel,
  getLapsedProMessage,
  getPlanDisplayName,
  getResubscribeLabel,
  getSubscriptionPeriodLabel,
  isLapsedProUser,
  needsPaymentUpdate,
} from "@/lib/subscriptionMessaging";
import type { AuthUser } from "@/types/auth";
import { colors } from "@/theme/tokens";
import { fonts } from "@/theme/typography";

/**
 * Profile — mirrors web `/profile` (`MyInfoPanel`).
 * Billing details, Telegram, and product tour live on Settings.
 */
export function ProfileScreen() {
  const { logout, ready, user } = useSession();

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  if (!ready) {
    return (
      <AppScreen>
        <View style={pageHeaderStyles.header}>
          <Text style={pageHeaderStyles.title}>Profile</Text>
        </View>
        <View style={styles.loadingCard}>
          <ActivityIndicator color={colors.success} />
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      </AppScreen>
    );
  }

  if (!user) {
    return (
      <AppScreen>
        <View style={pageHeaderStyles.header}>
          <Text style={pageHeaderStyles.title}>Profile</Text>
          <Text allowFontScaling={false} style={pageHeaderStyles.subtitle}>
            Your account and membership. Billing and Telegram alerts are in
            Settings.
          </Text>
        </View>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyCopy}>You are not signed in.</Text>
          <Pressable
            onPress={() => router.replace("/(auth)/login")}
            style={({ pressed }) => [
              styles.primaryBtn,
              pressed ? styles.pressed : null,
            ]}
          >
            <Text style={styles.primaryBtnText}>Log in</Text>
          </Pressable>
        </View>
      </AppScreen>
    );
  }

  if (!isAccountActive(user.accountStatus)) {
    return (
      <AppScreen>
        <View style={pageHeaderStyles.header}>
          <Text style={pageHeaderStyles.title}>Profile</Text>
        </View>
        <AccountInactiveNotice />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <View style={pageHeaderStyles.header}>
        <Text style={pageHeaderStyles.title}>Profile</Text>
        <Text allowFontScaling={false} style={pageHeaderStyles.subtitle}>
          Your account and membership. Billing and Telegram alerts are in
          Settings.
        </Text>
      </View>

      <ProfileInfoCard user={user} />

      {isLapsedProUser(user) ? <LapsedProBanner user={user} /> : null}

      <ProfileActions user={user} onLogout={() => void handleLogout()} />
    </AppScreen>
  );
}

function ProfileInfoCard({ user }: { user: AuthUser }) {
  const planLabel = getPlanDisplayName(user);
  const lapsed = isLapsedProUser(user);
  const renewalIso = user.currentPeriodEnd;
  const memberSince = formatMediumDate(user.createdAt) ?? "—";
  const renewalDate = formatMediumDate(renewalIso);

  const rows: { label: string; value: string }[] = [
    { label: "Name", value: user.name },
    { label: "Email", value: user.email },
    { label: "Member since", value: memberSince },
    {
      label: "Account status",
      value: getAccountStatusLabel(user.accountStatus),
    },
    { label: "Plan", value: planLabel },
  ];
  if (isProUser(user) && renewalDate) {
    rows.push({
      label: getSubscriptionPeriodLabel(user),
      value: renewalDate,
    });
  }
  if (lapsed && renewalDate) {
    rows.push({ label: "Pro ended", value: renewalDate });
  }

  return (
    <View style={styles.infoCard}>
      {rows.map((row, index) => (
        <InfoRow
          key={row.label}
          label={row.label}
          value={row.value}
          last={index === rows.length - 1}
        />
      ))}
    </View>
  );
}

function LapsedProBanner({ user }: { user: AuthUser }) {
  const message = getLapsedProMessage(user);
  if (!message) return null;
  return (
    <View style={styles.lapsedBanner} accessibilityRole="text">
      <Text style={styles.lapsedText}>{message}</Text>
    </View>
  );
}

function ProfileActions({
  user,
  onLogout,
}: {
  user: AuthUser;
  onLogout: () => void;
}) {
  const lapsed = isLapsedProUser(user);
  const primaryLabel = lapsed
    ? getLapsedPrimaryActionLabel(user)
    : getResubscribeLabel(user);

  const openBilling = () => {
    if (needsPaymentUpdate(user)) {
      void openManageSubscription(user, "settings");
      return;
    }
    void openPricing("/profile");
  };

  return (
    <View style={styles.actionsRow}>
      {!isProUser(user) ? (
        <Pressable
          onPress={openBilling}
          style={({ pressed }) => [
            styles.primaryBtn,
            pressed ? styles.pressed : null,
          ]}
        >
          <Text style={styles.primaryBtnText}>{primaryLabel}</Text>
        </Pressable>
      ) : null}
      <Pressable
        onPress={onLogout}
        style={({ pressed }) => [
          styles.ghostBtn,
          pressed ? styles.pressed : null,
        ]}
      >
        <Text style={styles.ghostBtnText}>Log out</Text>
      </Pressable>
      <Pressable
        onPress={() => router.push("/(app)/(tabs)/settings")}
        style={({ pressed }) => [
          styles.ghostBtnMuted,
          pressed ? styles.pressed : null,
        ]}
      >
        <Text style={styles.ghostBtnMutedText}>Settings</Text>
      </Pressable>
    </View>
  );
}

function InfoRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: ReactNode;
  last?: boolean;
}) {
  return (
    <View style={[styles.infoRow, last ? styles.infoRowLast : null]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(24,24,27,0.5)",
    paddingVertical: 32,
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontFamily: fonts.sansRegular,
    color: "#71717A",
    fontSize: 14,
  },
  emptyCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(24,24,27,0.5)",
    paddingHorizontal: 24,
    paddingVertical: 40,
    alignItems: "center",
    gap: 16,
  },
  emptyCopy: {
    fontFamily: fonts.sansRegular,
    color: "#A1A1AA",
    fontSize: 14,
  },
  infoCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(24,24,27,0.5)",
    paddingHorizontal: 16,
    overflow: "hidden",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.06)",
    paddingVertical: 14,
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    flexShrink: 0,
    fontFamily: fonts.sansMedium,
    color: "#71717A",
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  infoValue: {
    flex: 1,
    fontFamily: fonts.sansRegular,
    color: "#FFFFFF",
    fontSize: 14,
    textAlign: "right",
  },
  lapsedBanner: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(120,53,15,0.4)",
    backgroundColor: "rgba(69,26,3,0.3)",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  lapsedText: {
    fontFamily: fonts.sansRegular,
    color: "rgba(254,243,199,0.9)",
    fontSize: 14,
    lineHeight: 20,
  },
  actionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  primaryBtn: {
    borderRadius: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  primaryBtnText: {
    fontFamily: fonts.sansBold,
    color: "#FFFFFF",
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  ghostBtn: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  ghostBtnText: {
    fontFamily: fonts.sansSemiBold,
    color: "#E4E4E7",
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  ghostBtnMuted: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  ghostBtnMutedText: {
    fontFamily: fonts.sansSemiBold,
    color: "#A1A1AA",
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  pressed: {
    opacity: 0.85,
  },
});
