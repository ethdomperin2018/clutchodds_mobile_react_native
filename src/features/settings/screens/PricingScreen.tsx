import { router } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppScreen } from "@/components/layout/AppScreen";
import { useSession } from "@/features/auth/SessionProvider";
import type { CheckoutPlan } from "@/lib/api/endpoints/billing";
import { ApiError } from "@/lib/api/client";
import {
  openPrivacyPolicy,
  openTermsOfService,
} from "@/features/legal/openLegalDocument";
import { usePlanPriceLabel } from "@/lib/billing/usePlanPriceLabel";
import {
  PLANS,
  type BillingInterval,
  type PlanDefinition,
  getPlanPriceLabel,
  getPlanPriceNote,
  isAnnualPricingUiEnabled,
} from "@/lib/billing/plans";
import { getProTrialDays } from "@/lib/billing/trial";
import {
  restoreAppStorePurchases,
  useInAppSubscription,
} from "@/lib/billing/inAppPayment";
import { openManageSubscription } from "@/lib/billing/manageSubscription";
import { refreshUntilPro } from "@/lib/billing/stripeBrowser";
import { isEliteUser, isProOnlyUser, isProUser } from "@/lib/planAccess";
import {
  formatMediumDate,
  getBillingSuccessMessage,
  getPricingFooterMessage,
  getProCheckoutCta,
  getProPricingDescription,
  getProPricingPerks,
  getProPricingPriceNote,
  hadExpiredTrial,
  isLapsedProUser,
  isTrialingUser,
  needsPaymentUpdate,
} from "@/lib/subscriptionMessaging";
import type { AuthUser } from "@/types/auth";
import { colors } from "@/theme/tokens";
import { fonts } from "@/theme/typography";

type PlanAction =
  | { type: "current" }
  | { type: "inactive"; label: string }
  | { type: "button"; label: string; onPress: () => void; loading?: boolean };

/**
 * In-app pricing — mirrors web `PricingPlanCards`.
 * Stripe Checkout / portal open in an auth session browser and return here.
 */
export function PricingScreen() {
  const insets = useSafeAreaInsets();
  const { user, ready, refresh } = useSession();
  const { start: startSubscription, host: paymentHost } = useInAppSubscription();
  const annualEnabled = isAnnualPricingUiEnabled();
  const [interval, setInterval] = useState<BillingInterval>("month");
  const [loadingPlan, setLoadingPlan] = useState<CheckoutPlan | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const { label: planPriceLabel } = usePlanPriceLabel(user?.billingProvider);
  const appStoreBilling = Platform.OS === "ios";

  function planPriceNote(plan: CheckoutPlan, cycle: BillingInterval): string {
    if (plan === "pro" && cycle === "month" && lapsedActive) {
      return getProPricingPriceNote(user);
    }
    return getPlanPriceNote(plan, cycle);
  }

  const billingInterval = annualEnabled ? interval : "month";

  async function handleRestore() {
    if (!restoreAppStorePurchases || restoring) return;
    setRestoring(true);
    setError(null);
    setStatusMessage(null);
    try {
      const restored = await restoreAppStorePurchases();
      if (restored == null) return;
      const next = await refresh();
      if (restored > 0 && next && isProUser(next)) {
        setStatusMessage(getBillingSuccessMessage(next));
      } else {
        setStatusMessage(
          "No active App Store subscription was found for this account."
        );
      }
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : "Could not restore purchases."
      );
    } finally {
      setRestoring(false);
    }
  }

  const syncAfterSuccess = useCallback(async () => {
    setSyncing(true);
    setStatusMessage("Activating your subscription…");
    try {
      const next = await refreshUntilPro(refresh);
      if (next && isProUser(next)) {
        setStatusMessage(getBillingSuccessMessage(next));
      } else {
        setStatusMessage(
          "Payment received — your plan may take a moment to update. Pull to refresh if access is not unlocked yet."
        );
      }
    } finally {
      setSyncing(false);
    }
  }, [refresh]);

  async function startCheckout(plan: CheckoutPlan) {
    if (!user || loadingPlan) return;
    setError(null);
    setStatusMessage(null);

    if (plan === "pro" && needsPaymentUpdate(user)) {
      setPortalLoading(true);
      try {
        await openManageSubscription(user, "pricing");
        await refresh();
      } catch (err) {
        setError(
          err instanceof ApiError
            ? err.message
            : "Could not open billing portal."
        );
      } finally {
        setPortalLoading(false);
      }
      return;
    }

    setLoadingPlan(plan);
    try {
      const result = await startSubscription(plan, billingInterval);
      if (result.status === "success" || result.status === "upgraded") {
        await syncAfterSuccess();
      } else if (result.status === "cancel") {
        setStatusMessage("Checkout canceled.");
      } else {
        // Browser dismissed — still refresh in case they completed checkout.
        await refresh();
      }
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error && err.message
            ? err.message
            : "Could not start checkout."
      );
    } finally {
      setLoadingPlan(null);
    }
  }

  function paidAction(plan: CheckoutPlan): PlanAction {
    const proCta = getProCheckoutCta(user);
    const stripeProOnly = Boolean(
      user &&
        !user.isAdmin &&
        isProOnlyUser(user)
    );
    return {
      type: "button",
      label:
        plan === "elite" && stripeProOnly
          ? `Upgrade to Elite (${planPriceLabel("elite", billingInterval)})`
          : plan === "pro"
            ? proCta
            : PLANS[plan].cta,
      onPress: () => void startCheckout(plan),
      loading: loadingPlan === plan || portalLoading || syncing,
    };
  }

  // Feature gates treat admin as Pro/Elite; pricing cards use Stripe plan like web.
  const adminAccess = Boolean(user?.isAdmin);
  const eliteActive = Boolean(user && isEliteUser(user));
  const proOnlyActive = Boolean(user && isProOnlyUser(user));
  const freeActive = Boolean(user && !isProUser(user));
  const lapsedActive = Boolean(user && isLapsedProUser(user));

  const freeIsCurrent = adminAccess
    ? user?.plan === "free"
    : freeActive;
  const proIsCurrent = adminAccess
    ? user?.plan === "pro"
    : proOnlyActive;
  const eliteIsCurrent = adminAccess
    ? user?.plan === "elite"
    : eliteActive;

  const freeAction: PlanAction = adminAccess
    ? user?.plan === "free"
      ? { type: "current" }
      : { type: "inactive", label: "Included with your plan" }
    : freeActive
      ? { type: "current" }
      : user && isProUser(user)
        ? { type: "inactive", label: "Included with your plan" }
        : { type: "inactive", label: PLANS.free.cta };

  const proAction: PlanAction = adminAccess
    ? user?.plan === "pro"
      ? { type: "current" }
      : user?.plan === "elite"
        ? { type: "inactive", label: "Included in Elite" }
        : paidAction("pro")
    : eliteActive
      ? { type: "inactive", label: "Included in Elite" }
      : proOnlyActive
        ? { type: "current" }
        : paidAction("pro");

  const eliteAction: PlanAction = adminAccess
    ? user?.plan === "elite"
      ? { type: "current" }
      : paidAction("elite")
    : eliteActive
      ? { type: "current" }
      : paidAction("elite");

  const pricingFooter = getPricingFooterMessage(user);
  const statusTone =
    user && isEliteUser(user)
      ? styles.statusElite
      : user && isProUser(user)
        ? styles.statusPro
        : styles.statusMuted;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {paymentHost}
      <View style={styles.topBar}>
        <Pressable
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace("/(app)/(tabs)/settings");
          }}
          hitSlop={12}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
        >
          <Text style={styles.backBtnText}>‹ Back</Text>
        </Pressable>
      </View>

      <AppScreen>
        <View style={styles.intro}>
          <Text style={styles.eyebrow}>Simple pricing</Text>
          <Text style={styles.introTitle}>
            Free to explore. Pro to execute. Elite to model the market.
          </Text>
          <Text style={styles.introCopy}>
            Start with a free account and the public market snapshot. Try Pro
            free for {getProTrialDays()} days — Arbitrage, Value Bets, bet log,
            analytics, and Telegram arb alerts. Elite adds Model Predictions
            plus model overlays on Value Bets ({planPriceLabel("elite", "month")}).
            {" "}Save 2 months with annual billing.
          </Text>
        </View>

        {!ready ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={colors.success} />
            <Text style={styles.loadingText}>Loading plans…</Text>
          </View>
        ) : (
          <View style={styles.content}>
            {annualEnabled ? (
              <View style={styles.intervalToggle}>
                <IntervalChip
                  label="Monthly"
                  active={interval === "month"}
                  onPress={() => setInterval("month")}
                />
                <IntervalChip
                  label="Annual"
                  suffix="2 mo free"
                  active={interval === "year"}
                  onPress={() => setInterval("year")}
                />
              </View>
            ) : null}

            <View style={styles.cards}>
              <PlanCard
                plan={PLANS.free}
                action={freeAction}
                isCurrent={Boolean(freeIsCurrent)}
              />
              <PlanCard
                plan={PLANS.pro}
                action={proAction}
                isCurrent={Boolean(proIsCurrent)}
                badge="Most popular"
                priceLabel={planPriceLabel("pro", billingInterval)}
                priceNote={planPriceNote("pro", billingInterval)}
                description={
                  lapsedActive
                    ? getProPricingDescription(user, {
                        month: planPriceLabel("pro", "month"),
                        year: planPriceLabel("pro", "year"),
                      })
                    : undefined
                }
                perks={lapsedActive ? getProPricingPerks(user) : undefined}
              />
              <PlanCard
                plan={PLANS.elite}
                action={eliteAction}
                isCurrent={Boolean(eliteIsCurrent)}
                badge="Prediction insights"
                priceLabel={planPriceLabel("elite", billingInterval)}
                priceNote={planPriceNote("elite", billingInterval)}
              />
            </View>

            {error ? (
              <Text style={styles.errorText} accessibilityRole="alert">
                {error}
              </Text>
            ) : null}

            {statusMessage ? (
              <Text
                style={[styles.statusText, statusTone]}
                accessibilityRole="text"
              >
                {statusMessage}
              </Text>
            ) : null}

            {adminAccess ? (
              <Text style={styles.footerMuted}>
                Admin account — Pro and Elite features are unlocked for testing.
                Plan cards show your actual Stripe subscription.
              </Text>
            ) : null}

            {!adminAccess && pricingFooter ? (
              <FooterNote user={user} lapsed={lapsedActive} />
            ) : null}

            {!adminAccess && proOnlyActive && user ? (
              <Text style={styles.footerPro}>
                You're on Pro{isTrialingUser(user) ? " (trial)" : ""} — upgrade
                to Elite for prediction insights, or manage billing in Settings.
              </Text>
            ) : null}

            {!adminAccess && eliteActive ? (
              <Text style={styles.footerElite}>
                You're on Elite — Model Predictions and Value Bets Elite
                overlays are unlocked. Manage billing in Settings.
              </Text>
            ) : null}

            <View style={styles.legal}>
              {restoreAppStorePurchases ? (
                <Pressable
                  onPress={() => void handleRestore()}
                  disabled={restoring}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.restoreBtn,
                    (pressed || restoring) && styles.pressed,
                  ]}
                >
                  {restoring ? (
                    <ActivityIndicator color="#E4E4E7" />
                  ) : (
                    <Text style={styles.restoreBtnText}>Restore Purchases</Text>
                  )}
                </Pressable>
              ) : null}

              {appStoreBilling ? (
                <Text style={styles.legalText}>
                  Subscriptions renew automatically at the price shown unless
                  canceled at least 24 hours before the end of the current
                  period. Payment is charged to your Apple Account. Manage or
                  cancel anytime in your App Store account settings.
                </Text>
              ) : null}

              <View style={styles.legalLinks}>
                <Pressable
                  onPress={() => void openTermsOfService()}
                  accessibilityRole="link"
                  hitSlop={8}
                >
                  <Text style={styles.legalLink}>Terms of Use</Text>
                </Pressable>
                <Text style={styles.legalDot}>·</Text>
                <Pressable
                  onPress={() => void openPrivacyPolicy()}
                  accessibilityRole="link"
                  hitSlop={8}
                >
                  <Text style={styles.legalLink}>Privacy Policy</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      </AppScreen>
    </View>
  );
}

function IntervalChip({
  label,
  suffix,
  active,
  onPress,
}: {
  label: string;
  suffix?: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.intervalChip,
        active ? styles.intervalChipActive : null,
        pressed ? styles.pressed : null,
      ]}
    >
      <Text
        style={[
          styles.intervalChipText,
          active ? styles.intervalChipTextActive : null,
        ]}
      >
        {label}
      </Text>
      {suffix ? <Text style={styles.intervalSuffix}>{suffix}</Text> : null}
    </Pressable>
  );
}

function PlanCard({
  plan,
  action,
  isCurrent,
  badge,
  priceLabel,
  priceNote,
  description,
  perks,
}: {
  plan: PlanDefinition;
  action: PlanAction;
  isCurrent: boolean;
  badge?: string;
  priceLabel?: string;
  priceNote?: string;
  description?: string;
  perks?: string[];
}) {
  const elite = plan.id === "elite";
  const highlighted = Boolean(plan.highlighted);

  return (
    <View
      style={[
        styles.card,
        elite ? styles.cardElite : null,
        highlighted ? styles.cardPro : null,
        isCurrent ? styles.cardCurrent : null,
      ]}
    >
      {isCurrent ? (
        <View style={styles.badgeCurrent}>
          <Text style={styles.badgeCurrentText}>Current plan</Text>
        </View>
      ) : badge ? (
        <View style={[styles.badge, elite ? styles.badgeElite : styles.badgePro]}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}

      <Text
        style={[
          styles.planName,
          elite
            ? styles.planNameElite
            : highlighted
              ? styles.planNamePro
              : null,
        ]}
      >
        {plan.name}
      </Text>
      <Text style={styles.price}>{priceLabel ?? plan.priceLabel}</Text>
      <Text style={styles.priceNote}>{priceNote ?? plan.priceNote}</Text>
      <Text style={styles.description}>
        {description ?? plan.description}
      </Text>

      <View style={styles.perks}>
        {(perks ?? plan.perks).map((perk) => (
          <View key={perk} style={styles.perkRow}>
            <Text
              style={[
                styles.perkCheck,
                elite
                  ? styles.perkCheckElite
                  : highlighted
                    ? styles.perkCheckPro
                    : null,
              ]}
            >
              ✓
            </Text>
            <Text style={styles.perkText}>{perk}</Text>
          </View>
        ))}
      </View>

      {action.type === "current" ? (
        <View style={styles.actionCurrent}>
          <Text style={styles.actionCurrentText}>Current plan</Text>
        </View>
      ) : action.type === "inactive" ? (
        <View style={styles.actionInactive}>
          <Text style={styles.actionInactiveText}>{action.label}</Text>
        </View>
      ) : (
        <Pressable
          onPress={action.onPress}
          disabled={action.loading}
          style={({ pressed }) => [
            styles.actionBtn,
            elite ? styles.actionBtnElite : styles.actionBtnPrimary,
            (pressed || action.loading) && styles.pressed,
          ]}
        >
          {action.loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text
              style={[
                styles.actionBtnText,
                elite ? styles.actionBtnTextElite : null,
              ]}
              numberOfLines={1}
            >
              {action.label}
            </Text>
          )}
        </Pressable>
      )}
    </View>
  );
}

function FooterNote({
  user,
  lapsed,
}: {
  user: AuthUser | null;
  lapsed: boolean;
}) {
  const footer = getPricingFooterMessage(user);
  if (!footer) return null;

  if (lapsed && user?.currentPeriodEnd) {
    const end = formatMediumDate(user.currentPeriodEnd);
    const trialEnded = hadExpiredTrial(user);
    return (
      <Text style={styles.footerLapsed}>
        {trialEnded
          ? `Your free trial ended on ${end}. Pro unlocks Arbitrage, Value Bets, bet log, and analytics. Elite adds Model Predictions.`
          : `Your subscription ended on ${end}. Pro unlocks Arbitrage, Value Bets, bet log, and analytics. Elite adds Model Predictions.`}
      </Text>
    );
  }

  return <Text style={styles.footerMuted}>{footer}</Text>;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 8,
  },
  backBtn: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingRight: 12,
  },
  backBtnText: {
    fontFamily: fonts.sansSemiBold,
    color: "#A1A1AA",
    fontSize: 16,
  },
  pressed: {
    opacity: 0.75,
  },
  legal: {
    gap: 12,
    alignItems: "center",
    paddingTop: 4,
  },
  restoreBtn: {
    minHeight: 44,
    minWidth: 180,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(24,24,27,0.8)",
  },
  restoreBtnText: {
    fontFamily: fonts.sansSemiBold,
    color: "#E4E4E7",
    fontSize: 14,
  },
  legalText: {
    fontFamily: fonts.sansRegular,
    color: "#71717A",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  legalLinks: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legalLink: {
    fontFamily: fonts.sansSemiBold,
    color: "#A1A1AA",
    fontSize: 13,
    textDecorationLine: "underline",
  },
  legalDot: {
    color: "#52525B",
    fontSize: 13,
  },
  content: {
    gap: 20,
    paddingBottom: 16,
  },
  intro: {
    gap: 8,
    paddingBottom: 8,
  },
  eyebrow: {
    fontFamily: fonts.sansBold,
    color: colors.primary,
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  introTitle: {
    fontFamily: fonts.sansBold,
    color: "#FFFFFF",
    fontSize: 26,
    lineHeight: 32,
  },
  introCopy: {
    fontFamily: fonts.sansRegular,
    color: "#71717A",
    fontSize: 13,
    lineHeight: 20,
  },
  cards: {
    gap: 20,
    paddingTop: 8,
  },
  loadingCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(24,24,27,0.5)",
    padding: 24,
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontFamily: fonts.sansRegular,
    color: "#A1A1AA",
    fontSize: 14,
  },
  intervalToggle: {
    alignSelf: "center",
    flexDirection: "row",
    gap: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(24,24,27,0.8)",
    padding: 4,
    marginBottom: 4,
  },
  intervalChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  intervalChipActive: {
    backgroundColor: "#FFFFFF",
  },
  intervalChipText: {
    fontFamily: fonts.sansBold,
    color: "#A1A1AA",
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  intervalChipTextActive: {
    color: "#18181B",
  },
  intervalSuffix: {
    fontFamily: fonts.sansSemiBold,
    color: "#16A34A",
    fontSize: 11,
  },
  card: {
    position: "relative",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 22,
    gap: 10,
  },
  cardPro: {
    borderColor: "rgba(255,30,30,0.4)",
    backgroundColor: "rgba(255,30,30,0.06)",
  },
  cardElite: {
    borderColor: "rgba(139,92,246,0.3)",
    backgroundColor: "rgba(124,58,237,0.08)",
  },
  cardCurrent: {
    borderColor: "rgba(255,255,255,0.2)",
  },
  badge: {
    position: "absolute",
    top: -10,
    alignSelf: "center",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    zIndex: 1,
  },
  badgePro: {
    backgroundColor: colors.primary,
  },
  badgeElite: {
    backgroundColor: "#7C3AED",
  },
  badgeText: {
    fontFamily: fonts.sansBold,
    color: "#FFFFFF",
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  badgeCurrent: {
    position: "absolute",
    top: -10,
    alignSelf: "center",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "#18181B",
    paddingHorizontal: 12,
    paddingVertical: 4,
    zIndex: 1,
  },
  badgeCurrentText: {
    fontFamily: fonts.sansBold,
    color: "#E4E4E7",
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  planName: {
    fontFamily: fonts.sansBold,
    color: "#71717A",
    fontSize: 11,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  planNamePro: {
    color: colors.primary,
  },
  planNameElite: {
    color: "#C4B5FD",
  },
  price: {
    fontFamily: fonts.sansBold,
    color: "#FFFFFF",
    fontSize: 40,
    lineHeight: 44,
    marginTop: 4,
  },
  priceNote: {
    fontFamily: fonts.sansRegular,
    color: "#71717A",
    fontSize: 13,
  },
  description: {
    fontFamily: fonts.sansRegular,
    color: "#A1A1AA",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  perks: {
    marginTop: 16,
    gap: 12,
  },
  perkRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  perkCheck: {
    fontFamily: fonts.sansBold,
    color: "#71717A",
    fontSize: 13,
    lineHeight: 18,
  },
  perkCheckPro: {
    color: colors.primary,
  },
  perkCheckElite: {
    color: "#A78BFA",
  },
  perkText: {
    flex: 1,
    fontFamily: fonts.sansRegular,
    color: "#A1A1AA",
    fontSize: 13,
    lineHeight: 18,
  },
  actionCurrent: {
    marginTop: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingVertical: 14,
    alignItems: "center",
  },
  actionCurrentText: {
    fontFamily: fonts.sansBold,
    color: "#A1A1AA",
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  actionInactive: {
    marginTop: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingVertical: 14,
    alignItems: "center",
  },
  actionInactiveText: {
    fontFamily: fonts.sansBold,
    color: "#52525B",
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  actionBtn: {
    marginTop: 20,
    borderRadius: 6,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  actionBtnPrimary: {
    backgroundColor: colors.primary,
  },
  actionBtnElite: {
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.4)",
    backgroundColor: "rgba(124,58,237,0.15)",
  },
  actionBtnText: {
    fontFamily: fonts.sansBold,
    color: "#FFFFFF",
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  actionBtnTextElite: {
    color: "#EDE9FE",
  },
  errorText: {
    fontFamily: fonts.sansRegular,
    color: "#F87171",
    fontSize: 14,
    textAlign: "center",
    marginTop: 4,
  },
  statusText: {
    fontFamily: fonts.sansRegular,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    paddingHorizontal: 8,
  },
  statusPro: {
    color: "#34D399",
  },
  statusElite: {
    color: "#C4B5FD",
  },
  statusMuted: {
    color: "#A1A1AA",
  },
  footerMuted: {
    fontFamily: fonts.sansRegular,
    color: "#A1A1AA",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    paddingHorizontal: 8,
    marginTop: 4,
  },
  footerLapsed: {
    fontFamily: fonts.sansRegular,
    color: "rgba(252,211,77,0.9)",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    paddingHorizontal: 8,
    marginTop: 4,
  },
  footerPro: {
    fontFamily: fonts.sansRegular,
    color: "#34D399",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    paddingHorizontal: 8,
    marginTop: 4,
  },
  footerElite: {
    fontFamily: fonts.sansRegular,
    color: "#C4B5FD",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    paddingHorizontal: 8,
    marginTop: 4,
  },
});
