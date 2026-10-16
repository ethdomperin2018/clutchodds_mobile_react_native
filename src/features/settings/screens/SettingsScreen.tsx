import { router } from "expo-router";
import { useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { AppScreen } from "@/components/layout/AppScreen";
import { pageHeaderStyles } from "@/components/layout/pageHeaderStyles";
import { TelegramIcon } from "@/components/icons/TelegramIcon";
import { useSession } from "@/features/auth/SessionProvider";
import { useOnboarding } from "@/features/onboarding/OnboardingProvider";
import { ApiError } from "@/lib/api/client";
import { authApi } from "@/lib/api/endpoints/auth";
import { useInAppSubscription } from "@/lib/billing/inAppPayment";
import { openManageSubscription } from "@/lib/billing/manageSubscription";
import { usePlanPriceLabel } from "@/lib/billing/usePlanPriceLabel";
import { refreshUntilPro } from "@/lib/billing/stripeBrowser";
import {
  DEFAULT_ARB_UI_REFRESH_SEC,
  DEFAULT_POLL_INTERVAL_SEC,
} from "@/lib/odds/refreshInterval";
import { openPricing, openTelegramChannel } from "@/lib/openLinks";
import { isEliteUser, isProUser } from "@/lib/planAccess";
import {
  canUpgradeToElite,
  formatMediumDate,
  getBillingSuccessMessage,
  getEliteUpgradeConfirmDescription,
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
 * Checkout from Pricing; Manage opens Stripe portal and returns here.
 */
export function SettingsScreen() {
  const { user, ready, logout, refresh } = useSession();
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
          <BillingSection user={user} onBillingClosed={() => void refresh()} />
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
          <DeleteAccountSection
            email={user.email}
            onDeleted={async () => {
              await logout();
              router.replace("/(auth)/login");
            }}
          />
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

function BillingSection({
  user,
  onBillingClosed,
}: {
  user: AuthUser;
  onBillingClosed: () => void;
}) {
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
  const { refresh } = useSession();
  const { start: startSubscription, host: paymentHost } = useInAppSubscription();
  const { label: planPriceLabel } = usePlanPriceLabel(user.billingProvider);
  const elitePriceLabel = planPriceLabel("elite", user.billingInterval ?? "month");
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);
  const [eliteUpgradeOpen, setEliteUpgradeOpen] = useState(false);
  const [eliteLoading, setEliteLoading] = useState(false);
  const [eliteError, setEliteError] = useState<string | null>(null);
  const [billingNotice, setBillingNotice] = useState<{
    text: string;
    tone: "elite" | "pro" | "pending";
  } | null>(null);

  async function confirmEliteUpgrade() {
    setEliteError(null);
    setEliteLoading(true);
    try {
      const result = await startSubscription(
        "elite",
        user.billingInterval ?? "month"
      );
      if (result.status === "success" || result.status === "upgraded") {
        const next = await refreshUntilPro(refresh);
        setEliteUpgradeOpen(false);
        if (next && isEliteUser(next)) {
          setBillingNotice({
            text: getBillingSuccessMessage(next),
            tone: "elite",
          });
        } else if (next && isProUser(next)) {
          setBillingNotice({
            text: getBillingSuccessMessage(next),
            tone: "pro",
          });
        } else {
          setBillingNotice({
            text: "Payment received — your plan may take a moment to update. Pull to refresh if access is not unlocked yet.",
            tone: "pending",
          });
        }
        onBillingClosed();
        return;
      }
      if (result.status === "cancel") {
        setEliteError("Checkout canceled.");
      }
    } catch (err) {
      setEliteError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error && err.message
            ? err.message
            : "Could not start checkout."
      );
    } finally {
      setEliteLoading(false);
    }
  }

  async function openPortal() {
    setPortalError(null);
    setPortalLoading(true);
    try {
      await openManageSubscription(user, "settings");
      onBillingClosed();
    } catch (err) {
      setPortalError(
        err instanceof ApiError
          ? err.message
          : "Could not open billing portal."
      );
    } finally {
      setPortalLoading(false);
    }
  }

  return (
    <View style={styles.card}>
      {paymentHost}
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
            value={getPaidRenewalPriceLabel(user, planPriceLabel)}
          />
        ) : null}
        {!pro && lapsed && renewalDate ? (
          <DlRow label="Subscription ended" value={renewalDate} />
        ) : null}
      </View>

      {!pro && !lapsed ? (
        <Text style={styles.trialNote}>{getProTrialSummary()}</Text>
      ) : null}

      {portalError ? (
        <Text style={styles.portalError}>{portalError}</Text>
      ) : null}
      {billingNotice ? (
        <Text
          style={[
            styles.billingNotice,
            billingNotice.tone === "elite"
              ? styles.billingNoticeElite
              : billingNotice.tone === "pro"
                ? styles.billingNoticePro
                : styles.billingNoticePending,
          ]}
        >
          {billingNotice.text}
        </Text>
      ) : null}

      <View style={styles.actionsBlock}>
        <View style={styles.actionsRow}>
          {pro && canManageBilling ? (
            <>
              <Pressable
                onPress={() => void openPortal()}
                disabled={portalLoading}
                style={({ pressed }) => [
                  styles.actionHalf,
                  styles.ghostBtn,
                  pressed || portalLoading ? styles.pressed : null,
                ]}
              >
                <Text style={styles.ghostBtnText} numberOfLines={1}>
                  {portalLoading ? "Opening…" : "Manage subscription"}
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
                  if (paymentFailed) {
                    void openPortal();
                    return;
                  }
                  void openPricing("/settings");
                }}
                disabled={portalLoading}
                style={({ pressed }) => [
                  styles.actionHalf,
                  styles.primaryBtn,
                  pressed || portalLoading ? styles.pressed : null,
                ]}
              >
                <Text style={styles.primaryBtnText} numberOfLines={1}>
                  {portalLoading ? "Opening…" : resubscribeLabel}
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
            onPress={() => {
              setEliteError(null);
              setEliteUpgradeOpen(true);
            }}
            disabled={eliteLoading}
            style={({ pressed }) => [
              styles.eliteBtn,
              pressed || eliteLoading ? styles.pressed : null,
            ]}
          >
            <Text style={styles.eliteBtnText} numberOfLines={1}>
              {getEliteUpgradeLabel(user, elitePriceLabel)}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <Modal
        animationType="fade"
        transparent
        visible={eliteUpgradeOpen}
        onRequestClose={() => {
          if (!eliteLoading) setEliteUpgradeOpen(false);
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Upgrade to Elite?</Text>
            <Text style={styles.modalCopy}>
              {getEliteUpgradeConfirmDescription(user, elitePriceLabel)}
            </Text>
            {eliteError ? (
              <Text style={styles.portalError}>{eliteError}</Text>
            ) : null}
            <View style={styles.modalActions}>
              <Pressable
                disabled={eliteLoading}
                onPress={() => setEliteUpgradeOpen(false)}
                style={({ pressed }) => [
                  styles.modalCancel,
                  pressed || eliteLoading ? styles.pressed : null,
                ]}
              >
                <Text style={styles.ghostBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                disabled={eliteLoading}
                onPress={() => void confirmEliteUpgrade()}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  { flex: 1 },
                  eliteLoading || pressed ? styles.pressed : null,
                ]}
              >
                <Text style={styles.primaryBtnText}>
                  {eliteLoading ? "Upgrading…" : "Upgrade now"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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

function DeleteAccountSection({
  email,
  onDeleted,
}: {
  email: string;
  onDeleted: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const emailMatches =
    confirmEmail.trim().toLowerCase() === email.trim().toLowerCase();

  function close() {
    if (loading) return;
    setOpen(false);
    setConfirmEmail("");
    setError(null);
  }

  async function handleDelete() {
    if (!emailMatches) {
      setError("Type your account email to confirm.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await authApi.deleteAccount(confirmEmail.trim());
      setOpen(false);
      await onDeleted();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not delete account."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.deleteCard}>
      <Text style={styles.cardTitle}>Delete account</Text>
      <Text style={styles.cardCopy}>
        Permanently remove your Clutch Odds account, bet log, and local
        subscription data. Any active Stripe subscription is canceled. This
        cannot be undone.
      </Text>
      <Pressable
        onPress={() => {
          setConfirmEmail("");
          setError(null);
          setOpen(true);
        }}
        style={({ pressed }) => [
          styles.dangerBtn,
          { alignSelf: "flex-start" },
          pressed ? styles.pressed : null,
        ]}
      >
        <Text style={styles.dangerBtnText}>Delete my account</Text>
      </Pressable>

      <Modal
        animationType="fade"
        transparent
        visible={open}
        onRequestClose={close}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Delete your account?</Text>
            <Text style={styles.modalCopy}>
              Permanently remove your Clutch Odds account, bet log, and local
              subscription data. Any active Stripe subscription is canceled.
              This cannot be undone.
            </Text>
            <Text style={styles.modalCopy}>
              Type <Text style={styles.emphasis}>{email}</Text> to confirm.
            </Text>
            <TextInput
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect={false}
              keyboardType="email-address"
              onChangeText={setConfirmEmail}
              placeholder={email}
              placeholderTextColor="#52525B"
              style={styles.modalInput}
              value={confirmEmail}
            />
            {error ? <Text style={styles.portalError}>{error}</Text> : null}
            <View style={styles.modalActions}>
              <Pressable
                onPress={close}
                style={({ pressed }) => [
                  styles.modalCancel,
                  pressed ? styles.pressed : null,
                ]}
              >
                <Text style={styles.ghostBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                disabled={loading || !emailMatches}
                onPress={() => void handleDelete()}
                style={({ pressed }) => [
                  styles.modalConfirm,
                  loading || !emailMatches ? styles.pressed : null,
                  pressed ? styles.pressed : null,
                ]}
              >
                <Text style={styles.modalConfirmText}>
                  {loading ? "Deleting…" : "Delete forever"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  portalError: {
    fontFamily: fonts.sansRegular,
    color: "#F87171",
    fontSize: 13,
    lineHeight: 18,
  },
  billingNotice: {
    fontFamily: fonts.sansRegular,
    fontSize: 14,
    lineHeight: 20,
  },
  billingNoticeElite: {
    color: "#C4B5FD",
  },
  billingNoticePro: {
    color: "#34D399",
  },
  billingNoticePending: {
    color: "#FCD34D",
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#18181B",
    padding: 20,
    gap: 12,
  },
  modalTitle: {
    fontFamily: fonts.sansMedium,
    color: "#FFFFFF",
    fontSize: 18,
  },
  modalCopy: {
    fontFamily: fonts.sansRegular,
    color: "#A1A1AA",
    fontSize: 14,
    lineHeight: 20,
  },
  modalInput: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#09090B",
    color: "#FFFFFF",
    fontFamily: fonts.sansRegular,
    fontSize: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  modalCancel: {
    flex: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    paddingVertical: 12,
    alignItems: "center",
  },
  modalConfirm: {
    flex: 1,
    borderRadius: 6,
    backgroundColor: "#DC2626",
    paddingVertical: 12,
    alignItems: "center",
  },
  modalConfirmText: {
    fontFamily: fonts.sansBold,
    color: "#FFFFFF",
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  pressed: {
    opacity: 0.85,
  },
});
