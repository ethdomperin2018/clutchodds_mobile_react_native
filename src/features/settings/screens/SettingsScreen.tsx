import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AppScreen } from "@/components/layout/AppScreen";
import { pageHeaderStyles } from "@/components/layout/pageHeaderStyles";
import { TelegramIcon } from "@/components/icons/TelegramIcon";
import { useSession } from "@/features/auth/SessionProvider";
import { useOnboarding } from "@/features/onboarding/OnboardingProvider";
import {
  DEFAULT_ARB_UI_REFRESH_SEC,
  DEFAULT_POLL_INTERVAL_SEC,
} from "@/lib/odds/refreshInterval";
import {
  openPricing,
  openTelegramChannel,
  openWebPath,
} from "@/lib/openLinks";
import { isEliteUser, isProUser } from "@/lib/planAccess";
import {
  canUpgradeToElite,
  formatMediumDate,
  getEliteUpgradeLabel,
  getLapsedProMessage,
  getPaidRenewalPriceLabel,
  getPlanDisplayName,
  getProTrialSummary,
  getResubscribeLabel,
  getSubscriptionPeriodLabel,
  isLapsedProUser,
  isTrialingUser,
  needsPaymentUpdate,
} from "@/lib/subscriptionMessaging";
import type { AuthUser } from "@/types/auth";
import { colors } from "@/theme/tokens";
import { fonts } from "@/theme/typography";

/**
 * Settings — mirrors web `/settings` card-by-card.
 * Stripe checkout/portal complete on web; Telegram + tour are native.
 */
export function SettingsScreen() {
  const { user, ready, logout } = useSession();
  const { replayTour } = useOnboarding();

  return (
    <AppScreen>
      <View style={pageHeaderStyles.header}>
        <Text style={pageHeaderStyles.title}>Settings</Text>
        <Text allowFontScaling={false} style={pageHeaderStyles.subtitle}>
          Account, billing, Telegram alerts, and where to adjust scanner
          defaults.
        </Text>
      </View>

      {ready && user ? (
        <>
          <BillingSection user={user} />
          <TelegramSection user={user} />
          <SessionSection
            user={user}
            onLogout={() => {
              void (async () => {
                await logout();
                router.replace("/(auth)/login");
              })();
            }}
          />
          <TourSection onReplay={() => void replayTour()} />
          <ScannerDefaultsSection />
          <DeleteAccountSection />
        </>
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Billing</Text>
          <Text style={styles.cardCopy}>
            Sign in to view your plan or start a Pro free trial.
          </Text>
        </View>
      )}
    </AppScreen>
  );
}

function BillingSection({ user }: { user: AuthUser }) {
  const pro = isProUser(user);
  const elite = isEliteUser(user);
  const trialing = isTrialingUser(user);
  const lapsed = isLapsedProUser(user);
  const planLabel = getPlanDisplayName(user);
  const renewalDate = formatMediumDate(user.currentPeriodEnd);
  const paymentFailed = needsPaymentUpdate(user);
  const lapsedMessage = getLapsedProMessage(user);
  const showEliteUpgrade = canUpgradeToElite(user);
  const canManageBilling = user.canManageStripeBilling;
  const resubscribeLabel = getResubscribeLabel(user);

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Billing</Text>
      {lapsed && lapsedMessage ? (
        <View style={styles.lapsedBanner}>
          <Text style={styles.lapsedText}>{lapsedMessage}</Text>
        </View>
      ) : null}
      {pro && paymentFailed ? (
        <View style={styles.lapsedBanner}>
          <Text style={styles.lapsedText}>
            Payment failed — update your card in the billing portal to avoid
            losing access.
          </Text>
        </View>
      ) : null}

      <View style={styles.dl}>
        <DlRow label="Current plan" value={planLabel} emphasize />
        {pro && renewalDate ? (
          <DlRow
            label={getSubscriptionPeriodLabel(user)}
            value={renewalDate}
          />
        ) : null}
        {trialing && !elite ? (
          <DlRow
            label="After trial"
            value={getPaidRenewalPriceLabel(user)}
          />
        ) : null}
        {!pro && lapsed && renewalDate ? (
          <DlRow label="Subscription ended" value={renewalDate} />
        ) : null}
      </View>

      {!pro && !lapsed ? (
        <Text style={styles.trialNote}>{getProTrialSummary()}</Text>
      ) : null}

      <View style={styles.actionsBlock}>
        <View style={styles.actionsRow}>
          {pro && canManageBilling ? (
            <>
              <Pressable
                onPress={() =>
                  void openWebPath(
                    paymentFailed ? "/settings?billing=update" : "/settings"
                  )
                }
                style={({ pressed }) => [
                  styles.actionHalf,
                  styles.ghostBtn,
                  pressed ? styles.pressed : null,
                ]}
              >
                <Text style={styles.ghostBtnText} numberOfLines={1}>
                  Manage subscription
                </Text>
              </Pressable>
              <Pressable
                onPress={() => void openPricing("/settings")}
                style={({ pressed }) => [
                  styles.actionHalf,
                  styles.ghostBtn,
                  pressed ? styles.pressed : null,
                ]}
              >
                <Text style={styles.ghostBtnText} numberOfLines={1}>
                  Compare plans
                </Text>
              </Pressable>
            </>
          ) : !pro ? (
            <>
              <Pressable
                onPress={() => {
                  if (paymentFailed || lapsed) {
                    void openWebPath(
                      paymentFailed ? "/settings?billing=update" : "/settings"
                    );
                    return;
                  }
                  void openPricing("/settings");
                }}
                style={({ pressed }) => [
                  styles.actionHalf,
                  styles.primaryBtn,
                  pressed ? styles.pressed : null,
                ]}
              >
                <Text style={styles.primaryBtnText} numberOfLines={1}>
                  {resubscribeLabel}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => void openPricing("/settings")}
                style={({ pressed }) => [
                  styles.actionHalf,
                  styles.ghostBtn,
                  pressed ? styles.pressed : null,
                ]}
              >
                <Text style={styles.ghostBtnText} numberOfLines={1}>
                  Compare plans
                </Text>
              </Pressable>
            </>
          ) : (
            <Pressable
              onPress={() => void openPricing("/settings")}
              style={({ pressed }) => [
                styles.actionFull,
                styles.ghostBtn,
                pressed ? styles.pressed : null,
              ]}
            >
              <Text style={styles.ghostBtnText} numberOfLines={1}>
                Compare plans
              </Text>
            </Pressable>
          )}
        </View>

        {pro && showEliteUpgrade ? (
          <Pressable
            onPress={() => void openWebPath("/settings")}
            style={({ pressed }) => [
              styles.eliteBtn,
              pressed ? styles.pressed : null,
            ]}
          >
            <Text style={styles.eliteBtnText} numberOfLines={1}>
              {getEliteUpgradeLabel(user)}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function TelegramSection({ user }: { user: AuthUser }) {
  if (!isProUser(user)) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Telegram alerts</Text>
      <Text style={styles.cardCopy}>
        Pro members can join our Telegram channel for automatic notifications
        when new arbitrage opportunities are found. Alerts run on a ~
        {DEFAULT_POLL_INTERVAL_SEC / 60} minute worker cycle (separate from the
        in-app board refresh).
      </Text>
      <Pressable
        onPress={() => void openTelegramChannel()}
        style={({ pressed }) => [
          styles.telegramBtn,
          pressed ? styles.pressed : null,
        ]}
      >
        <TelegramIcon size={16} />
        <Text style={styles.telegramBtnText}>Open Telegram channel</Text>
      </Pressable>
    </View>
  );
}

function SessionSection({
  user,
  onLogout,
}: {
  user: AuthUser;
  onLogout: () => void;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Account</Text>
      <Text style={styles.cardCopy}>
        Signed in as{" "}
        <Text style={styles.emphasis}>{user.name}</Text> ({user.email}).
      </Text>
      <View style={styles.actionsRow}>
        <Pressable
          onPress={() => router.push("/(app)/(tabs)/profile")}
          style={({ pressed }) => [
            styles.ghostBtnMuted,
            pressed ? styles.pressed : null,
          ]}
        >
          <Text style={styles.ghostBtnMutedText}>Profile</Text>
        </Pressable>
        <Pressable
          onPress={onLogout}
          style={({ pressed }) => [
            styles.ghostBtn,
            pressed ? styles.pressed : null,
          ]}
        >
          <Text style={styles.ghostBtnText}>Log out</Text>
        </Pressable>
      </View>
    </View>
  );
}

function TourSection({ onReplay }: { onReplay: () => void }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Product tour</Text>
      <Text style={styles.cardCopy}>
        Replay the 5-step intro covering expected value, Arbitrage, Value Bets,
        and Model Predictions.
      </Text>
      <Pressable
        onPress={onReplay}
        style={({ pressed }) => [
          styles.ghostBtn,
          { alignSelf: "flex-start" },
          pressed ? styles.pressed : null,
        ]}
      >
        <Text style={styles.ghostBtnText}>Replay tour</Text>
      </Pressable>
    </View>
  );
}

function ScannerDefaultsSection() {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Scanner defaults</Text>
      <Text style={styles.cardCopy}>
        Controls live on each board — not here. Set wager/stake and{" "}
        <Text style={styles.emphasis}>Filters</Text> in the header on{" "}
        <Text
          style={styles.link}
          onPress={() => router.push("/(app)/(tabs)/arbitrage")}
        >
          Arbitrage
        </Text>{" "}
        and{" "}
        <Text
          style={styles.link}
          onPress={() => router.push("/(app)/(tabs)/value-bets")}
        >
          Value Bets
        </Text>
        . Refresh defaults to {DEFAULT_ARB_UI_REFRESH_SEC}s; Telegram alerts
        ~every {DEFAULT_POLL_INTERVAL_SEC / 60} min.
      </Text>
    </View>
  );
}

function DeleteAccountSection() {
  return (
    <View style={styles.deleteCard}>
      <Text style={styles.cardTitle}>Delete account</Text>
      <Text style={styles.cardCopy}>
        Permanently remove your Clutch Odds account, bet log, and local
        subscription data. Any active Stripe subscription is canceled. This
        cannot be undone.
      </Text>
      <Pressable
        onPress={() => void openWebPath("/settings")}
        style={({ pressed }) => [
          styles.dangerBtn,
          { alignSelf: "flex-start" },
          pressed ? styles.pressed : null,
        ]}
      >
        <Text style={styles.dangerBtnText}>Delete my account</Text>
      </Pressable>
      <Text style={styles.hint}>
        Confirmation opens on the web Settings page.
      </Text>
    </View>
  );
}

function DlRow({
  label,
  value,
  emphasize = false,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <View style={styles.dlRow}>
      <Text style={styles.dlLabel}>{label}</Text>
      <Text style={emphasize ? styles.dlValueEmphasized : styles.dlValue}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(24,24,27,0.5)",
    padding: 20,
    gap: 12,
  },
  deleteCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.2)",
    backgroundColor: "rgba(69,10,10,0.1)",
    padding: 20,
    gap: 12,
  },
  cardTitle: {
    fontFamily: fonts.sansMedium,
    color: "#FFFFFF",
    fontSize: 15,
  },
  cardCopy: {
    fontFamily: fonts.sansRegular,
    color: "#A1A1AA",
    fontSize: 14,
    lineHeight: 20,
  },
  emphasis: {
    fontFamily: fonts.sansMedium,
    color: "#D4D4D8",
  },
  link: {
    color: colors.primary,
    textDecorationLine: "underline",
  },
  trialNote: {
    fontFamily: fonts.sansRegular,
    color: "#71717A",
    fontSize: 14,
    lineHeight: 20,
  },
  hint: {
    fontFamily: fonts.sansRegular,
    color: "#71717A",
    fontSize: 12,
    lineHeight: 16,
  },
  dl: {
    gap: 12,
  },
  dlRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  dlLabel: {
    flexShrink: 0,
    fontFamily: fonts.sansRegular,
    color: "#71717A",
    fontSize: 14,
  },
  dlValue: {
    flex: 1,
    fontFamily: fonts.sansRegular,
    color: "#E4E4E7",
    fontSize: 14,
    textAlign: "right",
  },
  dlValueEmphasized: {
    flex: 1,
    fontFamily: fonts.sansMedium,
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
  actionsBlock: {
    gap: 12,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 10,
  },
  actionHalf: {
    flex: 1,
    minWidth: 0,
  },
  actionFull: {
    flex: 1,
    width: "100%",
  },
  primaryBtn: {
    borderRadius: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 40,
  },
  primaryBtnText: {
    fontFamily: fonts.sansBold,
    color: "#FFFFFF",
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    textAlign: "center",
  },
  ghostBtn: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 40,
  },
  ghostBtnText: {
    fontFamily: fonts.sansSemiBold,
    color: "#E4E4E7",
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    textAlign: "center",
  },
  ghostBtnMuted: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 10,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  ghostBtnMutedText: {
    fontFamily: fonts.sansSemiBold,
    color: "#A1A1AA",
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    textAlign: "center",
  },
  eliteBtn: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.4)",
    backgroundColor: "rgba(124,58,237,0.15)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 40,
  },
  eliteBtnText: {
    fontFamily: fonts.sansSemiBold,
    color: "#DDD6FE",
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    textAlign: "center",
  },
  telegramBtn: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(7,89,133,0.5)",
    backgroundColor: "rgba(8,47,73,0.4)",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  telegramBtnText: {
    fontFamily: fonts.sansBold,
    color: "#BAE6FD",
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  dangerBtn: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(127,29,29,0.5)",
    backgroundColor: "rgba(69,10,10,0.4)",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  dangerBtnText: {
    fontFamily: fonts.sansSemiBold,
    color: "#FECACA",
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  pressed: {
    opacity: 0.85,
  },
});
