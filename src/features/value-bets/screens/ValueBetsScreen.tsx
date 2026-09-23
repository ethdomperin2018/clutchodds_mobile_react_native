import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { AppScreen } from "@/components/layout/AppScreen";
import { OddsApiErrorBanner } from "@/components/ui/OddsApiErrorBanner";
import { AccountInactiveNotice } from "@/features/auth/AccountInactiveNotice";
import { useSession } from "@/features/auth/SessionProvider";
import { ValueBetDetailModal } from "@/features/value-bets/ValueBetDetailModal";
import { ValueBetMobileCard } from "@/features/value-bets/ValueBetMobileCard";
import {
  ValueBetsBoardUiProvider,
  useValueBetsBoardUi,
} from "@/features/value-bets/ValueBetsBoardUiContext";
import { ValueBetsFiltersModal } from "@/features/value-bets/ValueBetsFiltersModal";
import { ValueBetsExtras } from "@/features/value-bets/ValueBetsExtras";
import { ValueBetsRefreshControls } from "@/features/value-bets/ValueBetsRefreshControls";
import { ValueBetsSummaryStrip } from "@/features/value-bets/ValueBetsSummaryStrip";
import {
  useValueBetsBoard,
  type FreshnessTone,
  type ValueBetsBoardTab,
} from "@/features/value-bets/useValueBetsBoard";
import { buildValueBetsEmptyCopy } from "@/lib/valueBets/emptyCopy";
import { isAccountActive } from "@/lib/accountStatus";
import { formatAmerican } from "@/lib/format";
import { lineShopPickLogKey } from "@/lib/lineShopBetNotes";
import { openPricing, openWebPath } from "@/lib/openLinks";
import { isEliteUser, isProUser } from "@/lib/planAccess";
import { isEligibleSportPredictionWindow } from "@/lib/predictions/window";
import {
  getLapsedPrimaryActionLabel,
  getProGateBody,
  getProGateTitle,
  isLapsedProUser,
  needsPaymentUpdate,
} from "@/lib/subscriptionMessaging";
import {
  hasVisibleEnginePrediction,
  isEnginePick,
} from "@/lib/valueBets/engineEliteInsights";
import { primaryEvPercent } from "@/lib/valueBets/format";
import { shortTeamName } from "@/lib/teamDisplay";
import { colors } from "@/theme/tokens";
import { fonts, typography } from "@/theme/typography";
import type { AuthUser } from "@/types/auth";
import type { LineShopPick } from "@/lib/odds/types";

const PAGE_SUBTITLE =
  "Find bets where the market price is better than our fair value.";

const PAGE_SIZE = 10;

const BOARD_TABS: { id: ValueBetsBoardTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "start", label: "Start Time" },
  { id: "trending", label: "Trending" },
  { id: "today", label: "Today" },
];

function pickKey(pick: LineShopPick) {
  return lineShopPickLogKey(pick.eventId, pick.side);
}

/**
 * Value Bets board — Pro gate + Elite insights + log + details.
 */
export function ValueBetsScreen() {
  const { user, ready, refresh } = useSession();

  if (!ready) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.success} />
      </View>
    );
  }

  return (
    <ValueBetsBoardUiProvider>
      <ValueBetsScreenBody refresh={refresh} user={user} />
    </ValueBetsBoardUiProvider>
  );
}

function ValueBetsScreenBody({
  user,
  refresh,
}: {
  user: AuthUser | null;
  refresh: () => Promise<AuthUser | null>;
}) {
  const pro = isProUser(user);
  const elite = isEliteUser(user);
  const accountActive = user ? isAccountActive(user.accountStatus) : true;
  const showFilters = pro && accountActive;
  const { filtersOpen, setFiltersOpen, setActiveFilterCount, activeFilterCount } =
    useValueBetsBoardUi();
  const board = useValueBetsBoard({
    enabled: pro && accountActive,
    elite,
    userId: user?.id ?? null,
    refresh,
  });

  const openFilters = useCallback(
    () => setFiltersOpen(true),
    [setFiltersOpen]
  );

  useEffect(() => {
    setActiveFilterCount(board.activeFilterCount);
  }, [board.activeFilterCount, setActiveFilterCount]);

  return (
    <AppScreen>
      <Header
        showFilters={showFilters}
        filterCount={activeFilterCount}
        onOpenFilters={openFilters}
      />

      {!accountActive ? (
        <AccountInactiveNotice />
      ) : pro ? (
        <ProBoardShell board={board} elite={elite} />
      ) : (
        <ProUpgradeCard user={user} />
      )}

      {showFilters ? (
        <ValueBetsFiltersModal
          filters={board.sidebarFilters}
          open={filtersOpen}
          onChange={board.setSidebarFilters}
          onClose={() => setFiltersOpen(false)}
          onReset={board.resetFilters}
        />
      ) : null}
    </AppScreen>
  );
}

function ProBoardShell({
  board,
  elite,
}: {
  board: ReturnType<typeof useValueBetsBoard>;
  elite: boolean;
}) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [stakeInputs, setStakeInputs] = useState<Record<string, string>>({});
  const [detailsKey, setDetailsKey] = useState<string | null>(null);
  const [logConfirmKey, setLogConfirmKey] = useState<string | null>(null);
  const [logConfirmPick, setLogConfirmPick] = useState<LineShopPick | null>(
    null
  );
  const [logError, setLogError] = useState<string | null>(null);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
    setExpandedKey(null);
    setDetailsKey(null);
  }, [board.viewTab, board.boardTab, board.sidebarFilters]);

  const listed = board.visiblePicks.slice(0, visibleCount);

  const getStakeInput = useCallback(
    (key: string) => stakeInputs[key] ?? board.logStake,
    [stakeInputs, board.logStake]
  );

  const detailsPick = useMemo(() => {
    if (!detailsKey) return null;
    return board.visiblePicks.find((item) => pickKey(item) === detailsKey) ?? null;
  }, [detailsKey, board.visiblePicks]);

  const detailsInsights = useMemo(() => {
    if (!detailsPick) return null;
    return board.resolvePickInsights(detailsPick);
  }, [detailsPick, board.resolvePickInsights]);

  const detailsShowEngineInsights = useMemo(() => {
    if (!detailsInsights) return false;
    return (
      detailsInsights.source === "derived" ||
      hasVisibleEnginePrediction(detailsInsights)
    );
  }, [detailsInsights]);

  const parseConfirmStake = (raw: string): number | null => {
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  };

  const logConfirmStake = useMemo(() => {
    if (!logConfirmKey) return null;
    return parseConfirmStake(getStakeInput(logConfirmKey));
  }, [logConfirmKey, getStakeInput]);

  const closeLogConfirm = useCallback(() => {
    setLogConfirmKey(null);
    setLogConfirmPick(null);
    setLogError(null);
  }, []);

  const requestLogPick = useCallback(
    (key: string, fromDetails = false) => {
      const pick =
        board.visiblePicks.find((item) => pickKey(item) === key) ?? null;
      if (!pick) return;
      setLogError(null);
      if (fromDetails) {
        setDetailsKey(null);
        setTimeout(() => {
          setLogConfirmKey(key);
          setLogConfirmPick(pick);
        }, 50);
        return;
      }
      setLogConfirmKey(key);
      setLogConfirmPick(pick);
    },
    [board.visiblePicks]
  );

  const confirmLogPick = useCallback(async () => {
    if (!logConfirmPick || !logConfirmKey) return false;
    const stake = parseConfirmStake(getStakeInput(logConfirmKey));
    if (stake == null) {
      setLogError("Enter a stake greater than $0 before logging.");
      return false;
    }
    try {
      setLogError(null);
      return (await board.logPick(logConfirmPick, stake)) === true;
    } catch (e) {
      setLogError(e instanceof Error ? e.message : "Failed to log pick");
      return false;
    }
  }, [logConfirmPick, logConfirmKey, getStakeInput, board.logPick]);

  const emptyMessage = buildValueBetsEmptyCopy(board.viewTab);

  return (
    <View style={styles.boardStack}>
      <ValueBetsSummaryStrip summary={board.summary} />

      <ValueBetsRefreshControls
        autoRefresh={board.autoRefresh}
        loading={board.loading}
        logStake={board.logStake}
        onAutoRefreshChange={board.setAutoRefresh}
        onLogStakeChange={board.setLogStake}
        onRefresh={() => void board.reload()}
        onRefreshIntervalChange={board.setRefreshIntervalSec}
        predictionsLoading={elite && board.predictionsLoading}
        refreshIntervalSec={board.refreshIntervalSec}
        updatedAgoLabel={board.updatedAgoLabel}
        updatedToneStyle={freshnessStyle(board.updatedTone)}
      />

      {board.error ? (
        <OddsApiErrorBanner
          error={board.error}
          errorCode={board.errorCode}
          errorTitle={board.errorTitle}
        />
      ) : null}

      <View style={styles.viewTabs}>
        <Pressable
          onPress={() => board.setViewTab("live")}
          style={[
            styles.viewTab,
            board.viewTab === "live" ? styles.viewTabLive : null,
          ]}
        >
          <Text
            style={[
              styles.viewTabText,
              board.viewTab === "live" ? styles.viewTabTextOn : null,
            ]}
          >
            Live
          </Text>
          <View
            style={[
              styles.countPill,
              board.viewTab === "live" ? styles.countPillLive : null,
            ]}
          >
            <Text
              style={[
                styles.countText,
                board.viewTab === "live" ? styles.countTextLiveOn : null,
              ]}
            >
              {board.liveCount}
            </Text>
          </View>
        </Pressable>
        <Pressable
          onPress={() => board.setViewTab("upcoming")}
          style={[
            styles.viewTab,
            board.viewTab === "upcoming" ? styles.viewTabUpcoming : null,
          ]}
        >
          <Text
            style={[
              styles.viewTabText,
              board.viewTab === "upcoming" ? styles.viewTabTextOn : null,
            ]}
          >
            Upcoming
          </Text>
          <View
            style={[
              styles.countPill,
              board.viewTab === "upcoming" ? styles.countPillUpcoming : null,
            ]}
          >
            <Text
              style={[
                styles.countText,
                board.viewTab === "upcoming"
                  ? styles.countTextUpcomingOn
                  : null,
              ]}
            >
              {board.upcomingCount}
            </Text>
          </View>
        </Pressable>
      </View>

      {!board.initialLoadComplete ? (
        <View style={styles.boardShell}>
          <ActivityIndicator color={colors.success} />
          <Text style={styles.boardShellCopy}>Loading value bets…</Text>
        </View>
      ) : (
      <View
        style={[
          styles.boardListShell,
          board.loading && listed.length > 0
            ? styles.boardShellRefreshing
            : null,
        ]}
      >
        {board.loading && listed.length > 0 ? (
          <View style={styles.refreshOverlay} pointerEvents="none">
            <View style={styles.refreshChip}>
              <ActivityIndicator color="#34D399" size="small" />
              <Text style={styles.refreshChipText}>Refreshing…</Text>
            </View>
          </View>
        ) : null}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.boardTabsScroll}
          contentContainerStyle={styles.boardTabs}
        >
          {BOARD_TABS.map((tab) => {
            const active = board.boardTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                onPress={() => board.setBoardTab(tab.id)}
                style={styles.boardTab}
              >
                <Text
                  style={[
                    styles.boardTabText,
                    active ? styles.boardTabTextOn : null,
                  ]}
                >
                  {tab.label}
                </Text>
                <View
                  style={[
                    styles.boardTabUnderline,
                    active ? styles.boardTabUnderlineOn : null,
                  ]}
                />
              </Pressable>
            );
          })}
        </ScrollView>

        {listed.length === 0 ? (
          <View style={styles.listPlaceholder}>
            {board.loading ? (
              <>
                <ActivityIndicator color="#34D399" />
                <Text style={styles.refreshChipText}>Refreshing…</Text>
              </>
            ) : (
              <Text style={styles.boardShellCopy}>{emptyMessage}</Text>
            )}
          </View>
        ) : (
          <>
          <View style={styles.cardList}>
            {listed.map((pick, index) => {
              const key = pickKey(pick);
              const isLive =
                new Date(pick.commenceTime).getTime() <= board.nowMs;
              const insights = board.resolvePickInsights(pick);
              const showEngineInsights =
                insights.source === "derived" ||
                hasVisibleEnginePrediction(insights);
              const eliteInsightsLoading =
                elite &&
                board.predictionsLoading &&
                !showEngineInsights &&
                isEnginePick(pick) &&
                isEligibleSportPredictionWindow(
                  pick.commenceTime,
                  new Date(board.nowMs)
                );
              const stakeInput = getStakeInput(key);
              const stakeNum = Number(stakeInput);

              return (
                <ValueBetMobileCard
                  key={key}
                  elite={elite}
                  eliteInsightsLoading={eliteInsightsLoading}
                  ev={primaryEvPercent(pick)}
                  expanded={expandedKey === key}
                  insights={insights}
                  isLive={isLive}
                  loggingPick={board.loggingPickKey === key}
                  pick={pick}
                  pickLogged={board.loggedPickKeys.has(key)}
                  rank={index + 1}
                  showEngineInsights={showEngineInsights}
                  stake={
                    Number.isFinite(stakeNum) && stakeNum > 0
                      ? stakeNum
                      : undefined
                  }
                  stakeInput={stakeInput}
                  onLogPick={() => requestLogPick(key)}
                  onStakeChange={(value) =>
                    setStakeInputs((prev) => ({ ...prev, [key]: value }))
                  }
                  onToggleExpand={() =>
                    setExpandedKey((prev) => (prev === key ? null : key))
                  }
                  onViewDetails={() => setDetailsKey(key)}
                />
              );
            })}

            {visibleCount < board.visiblePicks.length ? (
              <Pressable
                onPress={() =>
                  setVisibleCount((count) => count + PAGE_SIZE)
                }
                style={({ pressed }) => [
                  styles.loadMoreBtn,
                  pressed ? styles.pressed : null,
                ]}
              >
                <Text style={styles.loadMoreText}>
                  Load more ({board.visiblePicks.length - visibleCount} left)
                </Text>
              </Pressable>
            ) : null}
          </View>
          </>
        )}
      </View>
      )}

      <ValueBetsExtras />

      {!elite ? (
        <View style={styles.unlockEliteRow}>
          <Pressable
            onPress={() => void openPricing("/value-bets")}
            style={({ pressed }) => [
              styles.unlockEliteBtn,
              pressed ? styles.pressed : null,
            ]}
          >
            <Text style={styles.unlockEliteText}>Unlock Elite Insights</Text>
          </Pressable>
        </View>
      ) : null}

      <ValueBetDetailModal
        elite={elite}
        insights={detailsInsights}
        loggingPick={
          detailsKey != null && board.loggingPickKey === detailsKey
        }
        nowMs={board.nowMs}
        open={detailsKey != null && detailsPick != null}
        pick={detailsPick}
        pickLogged={
          detailsKey != null && board.loggedPickKeys.has(detailsKey)
        }
        showEngineInsights={detailsShowEngineInsights}
        stakeInput={
          detailsKey ? getStakeInput(detailsKey) : board.logStake
        }
        strictLive={board.strictLive}
        onClose={() => setDetailsKey(null)}
        onLogPick={() => {
          if (!detailsKey) return;
          requestLogPick(detailsKey, true);
        }}
        onStakeChange={(value) => {
          if (!detailsKey) return;
          setStakeInputs((prev) => ({ ...prev, [detailsKey]: value }));
        }}
      />

      <LogPickConfirmModal
        error={logError}
        loading={
          logConfirmKey != null && board.loggingPickKey === logConfirmKey
        }
        open={logConfirmPick != null}
        pick={logConfirmPick}
        stake={logConfirmStake}
        onClose={closeLogConfirm}
        onConfirm={confirmLogPick}
      />
    </View>
  );
}

function LogPickConfirmModal({
  open,
  pick,
  stake,
  loading,
  error,
  onClose,
  onConfirm,
}: {
  open: boolean;
  pick: LineShopPick | null;
  stake: number | null;
  loading: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: () => boolean | void | Promise<boolean | void>;
}) {
  async function handleConfirm() {
    try {
      const result = await onConfirm();
      if (result === true) onClose();
    } catch {
      // Keep open so the user can retry.
    }
  }

  const team = pick ? shortTeamName(pick.teamName) : "";
  const matchup = pick
    ? `${shortTeamName(pick.awayTeam)} @ ${shortTeamName(pick.homeTeam)}`
    : "";
  const odds = pick ? formatAmerican(pick.bestLine.american) : "";
  const stakeLabel =
    stake != null
      ? `$${stake.toLocaleString("en-US", { maximumFractionDigits: 0 })}`
      : null;

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={open}>
      <View style={styles.confirmRoot}>
        <Pressable
          disabled={loading}
          onPress={onClose}
          style={styles.confirmBackdrop}
        />
        <View style={styles.confirmCard}>
          <Text style={styles.confirmTitle}>Log this pick?</Text>
          {pick ? (
            stakeLabel != null ? (
              <Text style={styles.confirmCopy}>
                Add{" "}
                <Text style={styles.confirmStrong}>
                  {team} {odds}
                </Text>{" "}
                (<Text style={styles.confirmStrong}>{matchup}</Text>) to My
                Bets with a{" "}
                <Text style={styles.confirmStrong}>{stakeLabel}</Text> stake.
              </Text>
            ) : (
              <Text style={styles.confirmCopy}>
                Enter a stake greater than $0 for{" "}
                <Text style={styles.confirmStrong}>{team}</Text> before logging
                to My Bets.
              </Text>
            )
          ) : null}
          {error ? <Text style={styles.confirmError}>{error}</Text> : null}
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
              disabled={loading || stake == null}
              onPress={() => void handleConfirm()}
              style={[
                styles.confirmOk,
                loading || stake == null ? styles.confirmDisabled : null,
              ]}
            >
              <Text style={styles.confirmOkText}>
                {loading ? "…" : "Log pick"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function freshnessStyle(tone: FreshnessTone) {
  if (tone === "fresh") return styles.updatedFresh;
  if (tone === "warm") return styles.updatedWarm;
  if (tone === "stale") return styles.updatedStale;
  return styles.updatedIdle;
}

function Header({
  showFilters,
  filterCount,
  onOpenFilters,
}: {
  showFilters: boolean;
  filterCount: number;
  onOpenFilters: () => void;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={styles.title}>Value Bets</Text>
        {showFilters ? (
          <Pressable
            onPress={onOpenFilters}
            style={({ pressed }) => [
              styles.filtersBtn,
              pressed ? styles.filtersBtnPressed : null,
            ]}
          >
            <Svg fill="none" height={16} viewBox="0 0 24 24" width={16}>
              <Path
                d="M3 4h18M7 8h10M10 12h4M12 16h0"
                stroke="#A1A1AA"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </Svg>
            <Text style={styles.filtersText}>Filters</Text>
            {filterCount > 0 ? (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{filterCount}</Text>
              </View>
            ) : null}
          </Pressable>
        ) : null}
      </View>
      <Text allowFontScaling={false} style={styles.subtitle}>
        {PAGE_SUBTITLE}
      </Text>
    </View>
  );
}

function ProUpgradeCard({ user }: { user: AuthUser | null }) {
  const lapsed = user ? isLapsedProUser(user) : false;
  const paymentFailed =
    user != null && needsPaymentUpdate(user) && !isProUser(user);

  function onPrimary() {
    if (paymentFailed) {
      void openWebPath("/settings?billing=update");
      return;
    }
    if (lapsed) {
      void openWebPath("/settings");
      return;
    }
    void openPricing("/value-bets");
  }

  function onSecondary() {
    if (lapsed) {
      void openPricing("/value-bets");
      return;
    }
    router.push("/(app)/(tabs)");
  }

  return (
    <View style={styles.proGate}>
      <View style={styles.proIcon}>
        <Ionicons color={colors.primary} name="star-outline" size={22} />
      </View>
      <Text style={styles.proTitle}>
        {getProGateTitle(user, "value bets")}
      </Text>
      <Text style={styles.proCopy}>{getProGateBody(user)}</Text>
      <Pressable
        onPress={onPrimary}
        style={({ pressed }) => [
          styles.upgradeBtn,
          pressed ? styles.pressed : null,
        ]}
      >
        <Text style={styles.upgradeText}>
          {lapsed ? getLapsedPrimaryActionLabel(user) : "Start free trial"}
        </Text>
      </Pressable>
      <Pressable
        onPress={onSecondary}
        style={({ pressed }) => [
          styles.dashboardBtn,
          pressed ? styles.pressed : null,
        ]}
      >
        <Text style={styles.dashboardBtnText}>
          {lapsed ? "View plans" : "View dashboard"}
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
    backgroundColor: colors.background,
  },
  header: {
    gap: 6,
    marginBottom: 0,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(39,39,42,0.8)",
  },
  headerTop: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  title: {
    ...typography.pageTitle,
    color: "#FFFFFF",
    flexShrink: 1,
  },
  subtitle: {
    ...typography.pageSubtitle,
  },
  filtersBtn: {
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#3F3F46",
    backgroundColor: "#18181B",
    paddingHorizontal: 16,
  },
  filtersBtnPressed: {
    borderColor: "#71717A",
  },
  filtersText: {
    fontFamily: fonts.sansSemiBold,
    color: "#E4E4E7",
    fontSize: 12,
    letterSpacing: 0.96,
    textTransform: "uppercase",
  },
  filterBadge: {
    borderRadius: 999,
    backgroundColor: "rgba(5, 150, 105, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  filterBadgeText: {
    fontFamily: fonts.sansBold,
    color: "#FFFFFF",
    fontSize: 10,
    fontVariant: ["tabular-nums"],
  },
  proGate: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(220,38,38,0.3)",
    backgroundColor: "rgba(220,38,38,0.06)",
    paddingHorizontal: 24,
    paddingVertical: 40,
    alignItems: "center",
  },
  proIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(220,38,38,0.4)",
    backgroundColor: "rgba(220,38,38,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  proTitle: {
    marginTop: 20,
    fontFamily: fonts.displaySemiBold,
    color: "#FFFFFF",
    fontSize: 20,
    textAlign: "center",
  },
  proCopy: {
    marginTop: 12,
    maxWidth: 360,
    fontFamily: fonts.sansRegular,
    color: "#A1A1AA",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  upgradeBtn: {
    marginTop: 32,
    alignSelf: "stretch",
    maxWidth: 360,
    borderRadius: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: "center",
  },
  upgradeText: {
    fontFamily: fonts.sansBold,
    color: "#FFFFFF",
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  dashboardBtn: {
    marginTop: 12,
    alignSelf: "stretch",
    maxWidth: 360,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: "center",
  },
  dashboardBtnText: {
    fontFamily: fonts.sansBold,
    color: "#E4E4E7",
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  boardStack: {
    gap: 12,
  },
  boardShell: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#161616",
    paddingHorizontal: 20,
    paddingVertical: 32,
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  listPlaceholder: {
    height: 152,
    paddingHorizontal: 16,
    gap: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cardList: {
    gap: 10,
    padding: 10,
  },
  boardListShell: {
    position: "relative",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(24,24,27,0.55)",
    overflow: "hidden",
  },
  boardShellRefreshing: {
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
  boardTabsScroll: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(24,24,27,0.85)",
  },
  boardTabs: {
    flexDirection: "row",
    alignItems: "stretch",
    paddingHorizontal: 4,
    minHeight: 40,
  },
  boardTab: {
    paddingHorizontal: 12,
    paddingTop: 10,
    alignItems: "center",
  },
  boardTabText: {
    fontFamily: fonts.sansSemiBold,
    color: "#71717A",
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    paddingBottom: 10,
  },
  boardTabTextOn: {
    color: "#FFFFFF",
  },
  boardTabUnderline: {
    height: 2,
    alignSelf: "stretch",
    backgroundColor: "transparent",
  },
  boardTabUnderlineOn: {
    backgroundColor: colors.primary,
  },
  unlockEliteRow: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    paddingTop: 16,
    alignItems: "flex-end",
  },
  unlockEliteBtn: {
    borderRadius: 8,
    backgroundColor: "#7C3AED",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  unlockEliteText: {
    fontFamily: fonts.sansBold,
    color: "#FFFFFF",
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  loadMoreBtn: {
    marginTop: 4,
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingVertical: 12,
  },
  loadMoreText: {
    fontFamily: fonts.sansSemiBold,
    color: "#D4D4D8",
    fontSize: 12,
  },
  boardShellCopy: {
    fontFamily: fonts.sansRegular,
    color: "#A1A1AA",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
  viewTabs: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  viewTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  viewTabLive: {
    backgroundColor: "rgba(5,150,105,0.9)",
  },
  viewTabUpcoming: {
    backgroundColor: "#3F3F46",
  },
  viewTabText: {
    fontFamily: fonts.sansSemiBold,
    color: "#A1A1AA",
    fontSize: 12,
    letterSpacing: 1.44,
    textTransform: "uppercase",
  },
  viewTabTextOn: {
    color: "#FFFFFF",
  },
  countPill: {
    borderRadius: 999,
    backgroundColor: "#27272A",
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countPillLive: {
    backgroundColor: "rgba(16,185,129,0.3)",
  },
  countPillUpcoming: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  countText: {
    fontFamily: fonts.sansRegular,
    color: "#A1A1AA",
    fontSize: 10,
  },
  countTextLiveOn: {
    color: "#ECFDF5",
  },
  countTextUpcomingOn: {
    color: "#F4F4F5",
  },
  updatedFresh: { color: "#34D399" },
  updatedWarm: { color: "#FCD34D" },
  updatedStale: { color: "#F87171" },
  updatedIdle: { color: "#A1A1AA" },
  pressed: {
    opacity: 0.85,
  },
  confirmRoot: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  confirmBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.72)",
  },
  confirmCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#18181B",
    padding: 20,
    gap: 14,
  },
  confirmTitle: {
    fontFamily: fonts.displaySemiBold,
    color: "#FFFFFF",
    fontSize: 18,
  },
  confirmCopy: {
    fontFamily: fonts.sansRegular,
    color: "#A1A1AA",
    fontSize: 14,
    lineHeight: 20,
  },
  confirmStrong: {
    fontFamily: fonts.sansSemiBold,
    color: "#E4E4E7",
  },
  confirmError: {
    fontFamily: fonts.sansRegular,
    color: "#F87171",
    fontSize: 13,
  },
  confirmActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 4,
  },
  confirmCancel: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  confirmCancelText: {
    fontFamily: fonts.sansSemiBold,
    color: "#E4E4E7",
    fontSize: 13,
  },
  confirmOk: {
    borderRadius: 8,
    backgroundColor: "#059669",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  confirmOkText: {
    fontFamily: fonts.sansSemiBold,
    color: "#FFFFFF",
    fontSize: 13,
  },
  confirmDisabled: {
    opacity: 0.55,
  },
});
