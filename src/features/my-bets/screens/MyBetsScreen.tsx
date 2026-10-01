import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, type Href } from "expo-router";
import {
  pageChromeStyles,
  pageHeaderStyles,
} from "@/components/layout/pageHeaderStyles";
import { AccountInactiveNotice } from "@/features/auth/AccountInactiveNotice";
import { useSession } from "@/features/auth/SessionProvider";
import { ManualBetMobileCard } from "@/features/my-bets/ManualBetMobileCard";
import { useMyBetsBoard } from "@/features/my-bets/useMyBetsBoard";
import type { ManualBetResult } from "@/lib/api/types";
import { parseArbEventIdFromNotes } from "@/lib/arbBetNotes";
import { isAccountActive } from "@/lib/accountStatus";
import { parseLineShopFromNotes } from "@/lib/lineShopBetNotes";
import { openPricing } from "@/lib/openLinks";
import { openManageSubscription } from "@/lib/billing/manageSubscription";
import { isProUser } from "@/lib/planAccess";
import {
  getLapsedPrimaryActionLabel,
  getProGateBody,
  getProGateTitle,
  isLapsedProUser,
  needsPaymentUpdate,
} from "@/lib/subscriptionMessaging";
import type { AuthUser } from "@/types/auth";
import { colors } from "@/theme/tokens";
import { fonts } from "@/theme/typography";

function formatResultLabel(result: string): string {
  return result.charAt(0).toUpperCase() + result.slice(1);
}

type PendingResultChange = {
  id: string;
  from: ManualBetResult;
  to: ManualBetResult;
  matchup: string;
};
export function MyBetsScreen() {
  const { user, ready, refresh } = useSession();
  const accountActive = user ? isAccountActive(user.accountStatus) : true;
  const pro = isProUser(user);

  if (!ready) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.success} />
        <Text style={styles.loadingCopy}>Loading…</Text>
      </View>
    );
  }

  if (!accountActive) {
    return (
      <ScrollView
        contentContainerStyle={pageChromeStyles.scroll}
        showsVerticalScrollIndicator={false}
        style={pageChromeStyles.root}
      >
        <Header />
        <AccountInactiveNotice />
      </ScrollView>
    );
  }

  if (!pro) {
    return (
      <ScrollView
        contentContainerStyle={pageChromeStyles.scroll}
        showsVerticalScrollIndicator={false}
        style={pageChromeStyles.root}
      >
        <Header />
        <ProUpgradeCard user={user} />
      </ScrollView>
    );
  }

  return <MyBetsBoard refresh={refresh} />;
}

function Header() {
  return (
    <View style={pageHeaderStyles.header}>
      <Text style={pageHeaderStyles.title}>My Bets</Text>
      <Text allowFontScaling={false} style={pageHeaderStyles.subtitle}>
        Manual bet log. Log arbs from the arbitrage board or picks from value
        bets.
      </Text>
    </View>
  );
}

function MyBetsBoard({
  refresh,
}: {
  refresh?: () => Promise<AuthUser | null>;
}) {
  const board = useMyBetsBoard({ enabled: true, refresh });
  const [pendingChange, setPendingChange] =
    useState<PendingResultChange | null>(null);
  const showInitialLoading =
    board.loading && !board.initialLoadComplete && board.bets.length === 0;
  const refreshing = board.loading && board.bets.length > 0;
  const confirming = board.updatingBetId != null;

  function requestResultChange(id: string, result: ManualBetResult) {
    if (board.updatingBetId) return;
    const bet = board.bets.find((b) => b.id === id);
    if (!bet || bet.result === result) return;
    setPendingChange({
      id,
      from: bet.result,
      to: result,
      matchup: bet.matchup,
    });
  }

  return (
    <View style={pageChromeStyles.root}>
      <ScrollView
        contentContainerStyle={pageChromeStyles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Header />

        <View style={styles.toolbar}>
          <Text style={styles.count}>
            {!board.initialLoadComplete && board.loading
              ? "Loading…"
              : `${board.bets.length} bet${board.bets.length === 1 ? "" : "s"} logged`}
          </Text>
          <Pressable
            disabled={board.loading}
            hitSlop={8}
            onPress={() => void board.reload()}
            style={styles.reloadBtn}
          >
            {refreshing ? (
              <ActivityIndicator color={colors.success} size="small" />
            ) : null}
            <Text
              style={[
                styles.reload,
                board.loading ? styles.reloadDisabled : null,
              ]}
            >
              Reload
            </Text>
          </Pressable>
        </View>

        {board.error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{board.error}</Text>
          </View>
        ) : null}

        {showInitialLoading ? (
          <View style={styles.loadingPanel}>
            <ActivityIndicator color={colors.success} />
            <Text style={styles.loadingCopy}>Loading bets…</Text>
          </View>
        ) : (
          <View
            style={[
              styles.listShell,
              refreshing ? styles.listShellRefreshing : null,
            ]}
          >
            {refreshing ? (
              <View pointerEvents="none" style={styles.refreshOverlay}>
                <View style={styles.refreshChip}>
                  <ActivityIndicator color="#34D399" size="small" />
                  <Text style={styles.refreshChipText}>Refreshing…</Text>
                </View>
              </View>
            ) : null}

            {board.bets.length === 0 &&
            !board.error &&
            board.initialLoadComplete ? (
              <EmptyState />
            ) : null}

            <View style={styles.list}>
              {board.bets.map((bet) => {
                const lineShopMeta = parseLineShopFromNotes(bet.notes);
                const lineShop = lineShopMeta != null;
                const arbitrage =
                  !lineShop && parseArbEventIdFromNotes(bet.notes) != null;
                return (
                  <ManualBetMobileCard
                    key={bet.id}
                    arbitrage={arbitrage}
                    bet={bet}
                    lineShop={lineShop}
                    lineShopMeta={lineShopMeta}
                    updating={board.updatingBetId === bet.id}
                    onUpdateResult={requestResultChange}
                  />
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      <StatusConfirmModal
        loading={confirming}
        pending={pendingChange}
        onClose={() => {
          if (confirming) return;
          setPendingChange(null);
        }}
        onConfirm={async () => {
          if (!pendingChange) return false;
          const ok = await board.updateResult(
            pendingChange.id,
            pendingChange.to
          );
          if (ok) setPendingChange(null);
          return ok;
        }}
      />

      {board.toast ? (
        <ToastBanner
          message={board.toast.message}
          variant={board.toast.variant}
          onDismiss={board.dismissToast}
        />
      ) : null}
    </View>
  );
}

function StatusConfirmModal({
  pending,
  loading,
  onClose,
  onConfirm,
}: {
  pending: PendingResultChange | null;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => boolean | void | Promise<boolean | void>;
}) {
  async function handleConfirm() {
    try {
      const result = await onConfirm();
      if (result === true) onClose();
    } catch {
      // Keep open for retry.
    }
  }

  return (
    <Modal
      animationType="fade"
      transparent
      visible={pending != null}
      onRequestClose={onClose}
    >
      <View style={styles.confirmRoot}>
        <Pressable
          disabled={loading}
          style={styles.confirmBackdrop}
          onPress={onClose}
        />
        <View style={styles.confirmCard}>
          <Text style={styles.confirmTitle}>Update bet result?</Text>
          {pending ? (
            <Text style={styles.confirmCopy}>
              Change <Text style={styles.confirmStrong}>{pending.matchup}</Text>{" "}
              from{" "}
              <Text style={styles.confirmStrong}>
                {formatResultLabel(pending.from)}
              </Text>{" "}
              to{" "}
              <Text style={styles.confirmAccent}>
                {formatResultLabel(pending.to)}
              </Text>
              .
            </Text>
          ) : null}
          <View style={styles.confirmActions}>
            <Pressable
              disabled={loading}
              onPress={onClose}
              style={[
                styles.confirmCancel,
                loading ? styles.confirmDisabled : null,
              ]}
            >
              <Text style={styles.confirmCancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              disabled={loading}
              onPress={() => void handleConfirm()}
              style={[styles.confirmOk, loading ? styles.confirmDisabled : null]}
            >
              <Text style={styles.confirmOkText}>
                {loading ? "…" : "Update result"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ToastBanner({
  message,
  variant,
  onDismiss,
}: {
  message: string;
  variant: "success" | "error";
  onDismiss: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [message, variant, onDismiss]);

  const tone =
    variant === "success"
      ? {
          border: "rgba(6,95,70,0.5)",
          bg: "rgba(2,44,34,0.95)",
          icon: "#34D399",
          mark: "✓",
        }
      : {
          border: "rgba(127,29,29,0.5)",
          bg: "rgba(69,10,10,0.95)",
          icon: "#F87171",
          mark: "!",
        };

  return (
    <View pointerEvents="box-none" style={styles.toastWrap}>
      <Pressable
        onPress={onDismiss}
        style={[
          styles.toastCard,
          { borderColor: tone.border, backgroundColor: tone.bg },
        ]}
      >
        <Text style={[styles.toastMark, { color: tone.icon }]}>{tone.mark}</Text>
        <Text style={styles.toastMessage}>{message}</Text>
      </Pressable>
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>No bets logged yet</Text>
      <Text style={styles.emptyCopy}>
        Log an arb from Arbitrage or a pick from Value Bets. Track results
        here, then review P/L on the Dashboard.
      </Text>
      <View style={styles.emptyLinks}>
        <Pressable onPress={() => router.push("/(app)/(tabs)/arbitrage" as Href)}>
          <Text style={styles.emptyLink}>Log bet →</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push("/(app)/(tabs)/value-bets" as Href)}
        >
          <Text style={styles.emptyLink}>Log pick →</Text>
        </Pressable>
        <Pressable onPress={() => router.push("/(app)/(tabs)" as Href)}>
          <Text style={styles.emptyLink}>View P/L →</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ProUpgradeCard({ user }: { user: AuthUser | null }) {
  const paymentFailed = user
    ? needsPaymentUpdate(user) && !isProUser(user)
    : false;
  const lapsed = user ? isLapsedProUser(user) : false;

  const onPress = () => {
    if (paymentFailed) {
      if (user) void openManageSubscription(user, "settings");
      return;
    }
    void openPricing("/my-bets");
  };

  return (
    <View style={styles.proCard}>
      <Text style={styles.proTitle}>{getProGateTitle(user, "my bets")}</Text>
      <Text style={styles.proCopy}>{getProGateBody(user)}</Text>
      <Pressable onPress={onPress} style={styles.proBtn}>
        <Text style={styles.proBtnText}>
          {paymentFailed || lapsed
            ? getLapsedPrimaryActionLabel(user)
            : "Upgrade to Pro"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: colors.background,
  },
  loadingCopy: {
    fontFamily: fonts.sansRegular,
    fontSize: 14,
    color: colors.textMuted,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  count: {
    fontFamily: fonts.sansRegular,
    fontSize: 14,
    color: colors.textMuted,
  },
  reloadBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  reload: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: colors.success,
  },
  reloadDisabled: {
    opacity: 0.5,
  },
  errorBanner: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.35)",
    backgroundColor: "rgba(245,158,11,0.08)",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  errorText: {
    fontFamily: fonts.sansRegular,
    fontSize: 13,
    lineHeight: 18,
    color: "#FBBF24",
  },
  loadingPanel: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 48,
  },
  listShell: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 16,
    gap: 12,
  },
  listShellRefreshing: {
    opacity: 0.6,
  },
  refreshOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    alignItems: "center",
    paddingTop: 64,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  refreshChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(9,9,11,0.9)",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  refreshChipText: {
    fontFamily: fonts.sansRegular,
    color: "#E4E4E7",
    fontSize: 14,
  },
  list: {
    gap: 12,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 36,
    paddingHorizontal: 12,
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(24,24,27,0.4)",
  },
  emptyTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 16,
    color: "#FFFFFF",
  },
  emptyCopy: {
    fontFamily: fonts.sansRegular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    textAlign: "center",
  },
  emptyLinks: {
    marginTop: 8,
    gap: 10,
    alignItems: "center",
  },
  emptyLink: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: colors.success,
  },
  proCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(24,24,27,0.6)",
    padding: 20,
    gap: 12,
  },
  proTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 18,
    color: "#FFFFFF",
  },
  proCopy: {
    fontFamily: fonts.sansRegular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
  },
  proBtn: {
    marginTop: 4,
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: colors.success,
    paddingVertical: 12,
  },
  proBtnText: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: "#052E1C",
  },
  toastWrap: {
    position: "absolute",
    right: 16,
    bottom: 16,
    left: 16,
    zIndex: 50,
    alignItems: "center",
  },
  toastCard: {
    maxWidth: 360,
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  toastMark: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
    lineHeight: 20,
    width: 20,
    textAlign: "center",
  },
  toastMessage: {
    flex: 1,
    fontFamily: fonts.sansRegular,
    color: "#F4F4F5",
    fontSize: 14,
    lineHeight: 20,
  },
  confirmRoot: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  confirmBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  confirmCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#09090B",
    padding: 24,
    gap: 12,
  },
  confirmTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 20,
    color: "#FFFFFF",
  },
  confirmCopy: {
    fontFamily: fonts.sansRegular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
  },
  confirmStrong: {
    fontFamily: fonts.sansBold,
    color: "#E4E4E7",
  },
  confirmAccent: {
    fontFamily: fonts.sansBold,
    color: colors.success,
  },
  confirmActions: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  confirmCancel: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  confirmCancelText: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "#D4D4D8",
  },
  confirmOk: {
    borderRadius: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  confirmOkText: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "#FFFFFF",
  },
  confirmDisabled: {
    opacity: 0.5,
  },
});
