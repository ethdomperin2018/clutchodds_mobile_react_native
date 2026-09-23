import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextStyle,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BookLogo } from "@/components/BookLogo";
import { SportTabIcon } from "@/components/SportTabIcon";
import { OddsApiErrorBanner } from "@/components/ui/OddsApiErrorBanner";
import { pageChromeStyles } from "@/components/layout/pageHeaderStyles";
import { ArbitrageFiltersModal } from "@/features/arbitrage/ArbitrageFiltersModal";
import { ArbitrageOpportunityCard } from "@/features/arbitrage/ArbitrageOpportunityCard";
import {
  ARB_SORT_OPTIONS,
  useArbitrageBoard,
  type ArbSort,
} from "@/features/arbitrage/useArbitrageBoard";
import { AccountInactiveNotice } from "@/features/auth/AccountInactiveNotice";
import { useSession } from "@/features/auth/SessionProvider";
import { isAccountActive } from "@/lib/accountStatus";
import {
  TRACKED_BOOKMAKER_COUNT,
  TRACKED_BOOKMAKER_KEYS,
  getBookDisplayName,
} from "@/lib/bookmakerDisplay";
import { openPricing, openTelegramChannel, openWebPath } from "@/lib/openLinks";
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
import { fonts, typography } from "@/theme/typography";
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";

export function ArbitrageScreen() {
  const { user, ready } = useSession();
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
      >
        <Header filterCount={0} onOpenFilters={() => undefined} />
        <AccountInactiveNotice />
      </ScrollView>
    );
  }

  if (!pro) {
    return (
      <ScrollView contentContainerStyle={pageChromeStyles.scroll} showsVerticalScrollIndicator={false}>
        <Header filterCount={0} onOpenFilters={() => undefined} />
        <ProUpgradeCard user={user} />
      </ScrollView>
    );
  }

  return <ArbitrageBoard />;
}

function ArbitrageBoard() {
  const board = useArbitrageBoard();
  const listed = board.listedArbs;
  const avgRoi =
    board.summary.opportunityCount > 0
      ? `${board.summary.averageRoiPercent >= 0 ? "+" : ""}${board.summary.averageRoiPercent.toFixed(2)}%`
      : "—";
  const profitPotential =
    board.summary.opportunityCount > 0
      ? board.summary.totalProfitPotential.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : "—";

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={pageChromeStyles.scroll}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
      >
        <Header
          filterCount={board.activeFilterCount}
          onOpenFilters={() => board.setFiltersOpen(true)}
        />

        {board.data?.error ? (
          <OddsApiErrorBanner
            error={board.data.error}
            errorCode={board.data.errorCode}
            errorTitle={board.data.errorTitle}
          />
        ) : null}

        <View style={styles.summaryStrip}>
          <SummaryCell label="Live" value={String(board.summary.liveCount)} />
          <SummaryCell label="Upcoming" value={String(board.summary.upcomingCount)} />
          <SummaryCell label="Avg ROI" value={avgRoi} />
          <SummaryCell label="Profit" last value={profitPotential} />
        </View>

        <View style={styles.controlCard}>
          <View style={styles.controlRow}>
            <View style={styles.controlField}>
              <Text style={styles.controlLabel}>Wager ($)</Text>
              <TextInput
                keyboardType="number-pad"
                onChangeText={board.setTotalStake}
                style={styles.controlInput}
                value={board.totalStake}
              />
            </View>
            <View style={[styles.controlField, styles.intervalField]}>
              <Text style={styles.controlLabel}>Interval</Text>
              <View style={styles.intervalWrap}>
                <TextInput
                  editable={board.autoRefresh}
                  keyboardType="number-pad"
                  onChangeText={board.setRefreshIntervalSec}
                  style={[
                    styles.controlInput,
                    styles.intervalInput,
                    !board.autoRefresh ? styles.controlDisabled : null,
                  ]}
                  value={board.refreshIntervalSec}
                />
                <View style={styles.secSuffix}>
                  <Text style={styles.secSuffixText}>sec</Text>
                </View>
              </View>
            </View>
            <Pressable
              onPress={() => board.setAutoRefresh(!board.autoRefresh)}
              style={styles.autoWrap}
            >
              <View
                style={[
                  styles.checkbox,
                  board.autoRefresh ? styles.checkboxOn : null,
                ]}
              >
                {board.autoRefresh ? (
                  <Ionicons color="#0EA5E9" name="checkmark" size={12} />
                ) : null}
              </View>
              <Text style={styles.autoLabel}>Auto</Text>
            </Pressable>
            <Pressable
              disabled={board.loading}
              onPress={() => void board.load({ light: false })}
              style={[styles.refreshBtn, board.loading ? styles.refreshDisabled : null]}
            >
              {board.loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.refreshText}>Refresh</Text>
              )}
            </Pressable>
          </View>
          <View style={styles.controlFooter}>
            {board.theoreticalStakeHint ? (
              <Text style={styles.hint}>
                {board.theoreticalStakeHint.count} game
                {board.theoreticalStakeHint.count === 1 ? "" : "s"}{" "}
                {board.theoreticalStakeHint.count === 1 ? "has" : "have"} a math
                edge but {board.theoreticalStakeHint.count === 1 ? "isn't" : "aren't"}{" "}
                profitable at{" "}
                <Text style={styles.hintValue}>${board.stakeNum}</Text> after
                rounding.
                {board.theoreticalStakeHint.suggested ? (
                  <>
                    {" "}
                    Try a{" "}
                    <Text style={styles.hintValue}>
                      ${board.theoreticalStakeHint.suggested}
                    </Text>{" "}
                    stake.
                  </>
                ) : (
                  " Raise stake."
                )}
              </Text>
            ) : null}
            <View style={styles.updatedRow}>
              {board.updatedAgoLabel ? (
                <>
                  <Text style={styles.updatedText}>
                    Updated{" "}
                    <Text
                      style={board.staleUpdate ? styles.updatedStale : styles.updatedFresh}
                    >
                      {board.updatedAgoLabel}
                    </Text>
                  </Text>
                  <View style={styles.updatedDot} />
                </>
              ) : null}
              {board.loading ? <Text style={styles.fetching}>Fetching…</Text> : null}
            </View>
          </View>
        </View>

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
                {board.liveArbCount}
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
                  board.viewTab === "upcoming" ? styles.countTextUpcomingOn : null,
                ]}
              >
                {board.upcomingArbCount}
              </Text>
            </View>
          </Pressable>
        </View>

        {board.loadingInitial ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={colors.success} />
            <Text style={styles.loadingCopy}>Loading arbitrage data…</Text>
          </View>
        ) : (
          <View style={[styles.boardShell, board.refreshing && listed.length > 0 ? styles.boardShellRefreshing : null]}>
            {board.refreshing && listed.length > 0 ? (
              <View style={styles.refreshOverlay}>
                <View style={styles.refreshChip}>
                  <ActivityIndicator color="#34D399" size="small" />
                  <Text style={styles.refreshChipText}>Refreshing…</Text>
                </View>
              </View>
            ) : null}

            <View style={styles.sportTabsWrap}>
              <View style={styles.sportTabs}>
                {board.sportTabs.map((tab) => {
                  const active = board.activeSportTab === tab.key;
                  return (
                    <Pressable
                      key={tab.key}
                      onPress={() => board.onSportTabChange(tab.key)}
                      style={styles.sportTab}
                    >
                      <View style={styles.sportTabInner}>
                        <SportTabIcon
                          color={active ? "#FFFFFF" : "#71717A"}
                          size={20}
                          sportKey={tab.key}
                        />
                        <Text
                          numberOfLines={1}
                          style={[styles.sportTabText, active ? styles.sportTabOn : null]}
                        >
                          {tab.label}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.sportUnderline,
                          active ? styles.sportUnderlineOn : null,
                        ]}
                      />
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.boardHead}>
              <Text style={styles.boardTitle}>Arbitrage opportunities</Text>
              <View style={styles.sortRow}>
                <Text style={styles.sortLabel}>Sort by</Text>
                <SortSelect onChange={board.setArbSort} value={board.arbSort} />
              </View>
            </View>

            {listed.length === 0 ? (
              <View style={styles.emptyBox}>
                {board.refreshing ? (
                  <>
                    <ActivityIndicator color="#34D399" />
                    <Text style={styles.refreshChipText}>Refreshing…</Text>
                  </>
                ) : (
                  <Text style={styles.emptyBoxText}>{board.emptyArbCopy}</Text>
                )}
              </View>
            ) : (
              <View style={styles.list}>
                {listed.map((arb) => (
                  <ArbitrageOpportunityCard
                    key={arb.eventId}
                    betLogged={board.loggedEventIds.has(arb.eventId)}
                    expanded={board.expandedEventId === arb.eventId}
                    loggingBet={board.loggingEventId === arb.eventId}
                    logError={
                      board.logError?.eventId === arb.eventId
                        ? board.logError.message
                        : null
                    }
                    nowMs={board.nowMs}
                    onExpandedChange={(next) =>
                      board.setExpandedEventId(next ? arb.eventId : null)
                    }
                    onLogBet={board.logBet}
                    onRecalculate={() => void board.recalculateArb(arb.eventId)}
                    originalQuote={board.originalQuote(arb)}
                    quote={board.currentQuote(arb)}
                    recalcError={board.recalcByEvent[arb.eventId]?.error}
                    recalculating={board.recalculatingId === arb.eventId}
                    targetTotalStake={board.stakeNum}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        <HowArbitrageWorksCard />
        <SupportedBooksCard />
        <ArbAlertsCard />
      </ScrollView>

      <ArbitrageFiltersModal
        filters={board.sidebarFilters}
        onChangeFilters={board.setSidebarFilters}
        onClearAllBooks={board.clearAllBooks}
        onClose={() => board.setFiltersOpen(false)}
        onReset={board.resetArbFilters}
        onSelectAllBooks={board.selectAllBooks}
        onToggleBook={board.toggleBook}
        open={board.filtersOpen}
        selectedBooks={board.selectedBooks}
      />
      {board.toast ? (
        <ToastBanner
          message={board.toast.message}
          onDismiss={board.dismissToast}
          variant={board.toast.variant}
        />
      ) : null}
    </View>
  );
}

function Header({
  onOpenFilters,
  filterCount,
}: {
  onOpenFilters: () => void;
  filterCount: number;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={styles.pageTitle}>Arbitrage</Text>
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
      </View>
      <Text allowFontScaling={false} style={styles.subtitle}>
        US moneyline arbitrage opportunities.
      </Text>
    </View>
  );
}

function SummaryCell({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.summaryCell, last ? null : styles.summaryBorder]}>
      <Text
        adjustsFontSizeToFit
        allowFontScaling={false}
        minimumFontScale={0.65}
        numberOfLines={1}
        style={styles.summaryValue}
      >
        {value}
      </Text>
      <Text numberOfLines={1} style={styles.summaryLabel}>
        {label}
      </Text>
    </View>
  );
}

function SortSelect({
  value,
  onChange,
}: {
  value: ArbSort;
  onChange: (next: ArbSort) => void;
}) {
  const triggerRef = useRef<View>(null);
  const [anchor, setAnchor] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const selected =
    ARB_SORT_OPTIONS.find((option) => option.value === value)?.label ?? value;

  function openMenu() {
    const run = () => {
      triggerRef.current?.measureInWindow((x, y, width, height) => {
        if (!width || !height) {
          requestAnimationFrame(run);
          return;
        }
        setAnchor({ x, y, width, height });
      });
    };
    requestAnimationFrame(run);
  }

  const menuTop = anchor
    ? Math.min(
        anchor.y + anchor.height + 4,
        Dimensions.get("window").height - 180
      )
    : 0;
  const menuLeft = anchor
    ? Math.max(8, anchor.x + anchor.width - Math.max(anchor.width, 152))
    : 0;

  return (
    <>
      <View collapsable={false} ref={triggerRef}>
        <Pressable
          accessibilityLabel="Sort arbitrage opportunities"
          onPress={() => (anchor ? setAnchor(null) : openMenu())}
          style={styles.sortTrigger}
        >
          <Text numberOfLines={1} style={styles.sortTriggerText}>
            {selected}
          </Text>
          <View style={anchor ? styles.sortChevronOpen : null}>
            <Svg fill="#71717A" height={14} viewBox="0 0 20 20" width={14}>
              <Path
                clipRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                fillRule="evenodd"
              />
            </Svg>
          </View>
        </Pressable>
      </View>
      <Modal
        animationType="none"
        onRequestClose={() => setAnchor(null)}
        transparent
        visible={!!anchor}
      >
        <View style={styles.sortModalRoot}>
          <Pressable onPress={() => setAnchor(null)} style={styles.sortBackdrop} />
          {anchor ? (
            <View
              style={[
                styles.sortMenu,
                { top: menuTop, left: menuLeft, minWidth: anchor.width },
              ]}
            >
              {ARB_SORT_OPTIONS.map((option) => {
                const active = option.value === value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => {
                      onChange(option.value);
                      setAnchor(null);
                    }}
                    style={[styles.sortOption, active ? styles.sortOptionOn : null]}
                  >
                    <Text
                      style={[
                        styles.sortOptionText,
                        active ? styles.sortOptionTextOn : null,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>
      </Modal>
    </>
  );
}

function ProUpgradeCard({ user }: { user: AuthUser | null }) {
  const lapsed = user ? isLapsedProUser(user) : false;
  const paymentFailed = user ? needsPaymentUpdate(user) && !isProUser(user) : false;

  function onPrimary() {
    if (paymentFailed) {
      void openWebPath("/settings?billing=update");
      return;
    }
    if (lapsed) {
      void openWebPath("/settings");
      return;
    }
    void openPricing("/arbitrage");
  }

  function onSecondary() {
    if (lapsed) {
      void openPricing("/arbitrage");
      return;
    }
    router.push("/(app)/(tabs)");
  }

  return (
    <View style={styles.proGate}>
      <View style={styles.proIcon}>
        <Ionicons color={colors.primary} name="star-outline" size={22} />
      </View>
      <Text style={styles.proTitle}>{getProGateTitle(user, "arbitrage")}</Text>
      <Text style={styles.proCopy}>{getProGateBody(user)}</Text>
      <Pressable onPress={onPrimary} style={styles.upgradeBtn}>
        <Text style={styles.upgradeText}>
          {lapsed ? getLapsedPrimaryActionLabel(user) : "Start free trial"}
        </Text>
      </Pressable>
      <Pressable onPress={onSecondary} style={styles.dashboardBtn}>
        <Text style={styles.dashboardBtnText}>
          {lapsed ? "View plans" : "View dashboard"}
        </Text>
      </Pressable>
    </View>
  );
}

function ToastBanner({
  message,
  variant,
  onDismiss,
}: {
  message: string;
  variant: "success" | "error" | "info";
  onDismiss: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [message, variant, onDismiss]);

  const tone =
    variant === "success"
      ? { border: "rgba(6,95,70,0.5)", bg: "rgba(2,44,34,0.95)", icon: "#34D399", mark: "✓" }
      : variant === "error"
        ? { border: "rgba(127,29,29,0.5)", bg: "rgba(69,10,10,0.95)", icon: "#F87171", mark: "!" }
        : { border: "rgba(255,255,255,0.1)", bg: "rgba(24,24,27,0.95)", icon: "#D4D4D8", mark: "i" };

  return (
    <View pointerEvents="box-none" style={styles.toastWrap}>
      <Pressable
        onPress={onDismiss}
        style={[styles.toastCard, { borderColor: tone.border, backgroundColor: tone.bg }]}
      >
        <Text style={[styles.toastMark, { color: tone.icon }]}>{tone.mark}</Text>
        <Text style={styles.toastMessage}>{message}</Text>
      </Pressable>
    </View>
  );
}

function HowArbitrageWorksCard() {
  const steps = [
    "We find mispriced lines across different books",
    "You bet both sides",
    "You lock in a guaranteed profit",
  ] as const;

  return (
    <View style={styles.extraCard}>
      <Text style={styles.extraTitle}>How Arbitrage Works</Text>
      <Text style={styles.extraCopy}>
        Arbitrage occurs when the combined odds from different books guarantee a
        profit no matter the outcome.
      </Text>
      <View style={styles.steps}>
        {steps.map((text, index) => (
          <View key={text} style={styles.stepRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>{index + 1}</Text>
            </View>
            <Text style={styles.stepText}>{text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const SUPPORTED_BOOKS_PREVIEW = 8;

function SupportedBooksCard() {
  const preview = TRACKED_BOOKMAKER_KEYS.slice(0, SUPPORTED_BOOKS_PREVIEW);
  return (
    <View style={styles.extraCard}>
      <View style={styles.booksHead}>
        <Text style={styles.extraTitle}>Supported Books</Text>
        <Text style={styles.activeCount}>
          {TRACKED_BOOKMAKER_COUNT} Active
        </Text>
      </View>
      <View style={styles.logoGrid}>
        {preview.map((key) => {
          const title = getBookDisplayName(key);
          return (
            <View
              accessibilityLabel={title}
              key={key}
              style={styles.logoCell}
            >
              <View style={styles.logoCellInner}>
                <BookLogo bookKey={key} bookTitle={title} size={24} />
              </View>
            </View>
          );
        })}
      </View>
      <Pressable
        onPress={() => router.push("/(app)/(tabs)/bookmakers")}
        style={styles.viewBooksBtn}
      >
        {({ pressed }) => (
          <Text style={[styles.viewBooks, pressed ? styles.viewBooksPressed : null]}>
            View full books →
          </Text>
        )}
      </Pressable>
    </View>
  );
}

function TelegramIcon() {
  return (
    <Svg fill="#FFFFFF" height={14} viewBox="0 0 24 24" width={14}>
      <Path d="M21.8 4.2L2.9 11.5c-1.3.5-1.3 1.2-.2 1.5l4.8 1.5 1.8 5.6c.2.7.4.9 1 .9.6 0 .8-.3 1.1-.6l2.7-2.6 5.6 4.1c1 .6 1.8.3 2-.9l3.6-17c.4-1.5-.5-2.1-1.5-1.7z" />
    </Svg>
  );
}

function PhoneText({
  children,
  numberOfLines,
  style,
}: {
  children: string;
  numberOfLines?: number;
  style: TextStyle;
}) {
  return (
    <Text allowFontScaling={false} numberOfLines={numberOfLines} style={style}>
      {children}
    </Text>
  );
}

function ArbTelegramPhoneMock() {
  return (
    <View style={styles.phoneShadow}>
      <View style={styles.phoneMock}>
        <View collapsable={false} style={styles.phoneInner}>
          <View style={styles.phoneBar} />
          <View style={styles.phoneHeader}>
            <PhoneText numberOfLines={1} style={styles.phoneHeaderText}>
              Clutch Odds Arbs
            </PhoneText>
          </View>
          <View style={styles.phoneBody}>
            <View style={styles.phoneArbCard}>
              <Svg height="100%" pointerEvents="none" style={StyleSheet.absoluteFill} width="100%">
                <Defs>
                  <LinearGradient id="arbPhoneCard" x1="0" x2="1" y1="0" y2="1">
                    <Stop offset="0" stopColor="#0f1a14" />
                    <Stop offset="1" stopColor="#111111" />
                  </LinearGradient>
                </Defs>
                <Rect fill="url(#arbPhoneCard)" height="100%" width="100%" />
              </Svg>
              <PhoneText style={styles.phoneLive}>Live Arb</PhoneText>
              <PhoneText style={styles.phoneMatch}>Twins +335 / Orioles -122</PhoneText>
              <PhoneText style={styles.phoneRoi}>+2.87% ROI</PhoneText>
            </View>
            <View style={styles.phoneMsg}>
              <PhoneText style={styles.phoneMsgTitle}>LIVE ARB · MLB</PhoneText>
              <PhoneText style={styles.phoneMsgBody}>
                Twins vs Orioles. Bet both sides for +2.87% guaranteed ROI at $1000
                stake.
              </PhoneText>
              <PhoneText style={styles.phoneMsgLink}>Open Arbitrage</PhoneText>
            </View>
            <Svg height={48} pointerEvents="none" style={styles.phoneFade} width="100%">
              <Defs>
                <LinearGradient id="arbPhoneFade" x1="0" x2="0" y1="0" y2="1">
                  <Stop offset="0" stopColor="#0e1621" stopOpacity="0" />
                  <Stop offset="1" stopColor="#0e1621" stopOpacity="1" />
                </LinearGradient>
              </Defs>
              <Rect fill="url(#arbPhoneFade)" height="100%" width="100%" />
            </Svg>
          </View>
        </View>
      </View>
    </View>
  );
}

function ArbAlertsCard() {
  const [wash, setWash] = useState({ w: 1, h: 1 });
  return (
    <View
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        if (width !== wash.w || height !== wash.h) setWash({ w: width, h: height });
      }}
      style={styles.alertsCard}
    >
      <Svg
        height={wash.h}
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
        width={wash.w}
      >
        <Defs>
          <LinearGradient id="arbAlertsWash" x1="0" x2="1" y1="0" y2="1">
            <Stop offset="0" stopColor="#2e1065" stopOpacity="0.45" />
            <Stop offset="0.5" stopColor="#161616" stopOpacity="1" />
            <Stop offset="1" stopColor="#161616" stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect fill="url(#arbAlertsWash)" height={wash.h} width={wash.w} />
      </Svg>
      <View style={styles.alertsRow}>
        <View style={styles.alertsCopy}>
          <Text style={styles.alertsTitle}>Get Arb Alerts</Text>
          <Text style={styles.alertsBody}>
            Never miss arbitrage opportunities. Real-time alerts delivered to
            Telegram.
          </Text>
          <Pressable
            onPress={() => void openTelegramChannel()}
            style={({ pressed }) => [
              styles.telegramBtn,
              pressed ? styles.telegramBtnPressed : null,
            ]}
          >
            <Text style={styles.telegramText}>Join Telegram</Text>
            <TelegramIcon />
          </Pressable>
        </View>
        <ArbTelegramPhoneMock />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: colors.background,
  },
  loadingCopy: {
    fontFamily: fonts.sansRegular,
    color: "#71717A",
    fontSize: 14,
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
  pageTitle: {
    ...typography.pageTitle,
    minWidth: 0,
    color: "#FFFFFF",
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
    borderColor: "rgba(255,30,30,0.3)",
    backgroundColor: "rgba(255,30,30,0.06)",
    paddingHorizontal: 24,
    paddingVertical: 40,
    alignItems: "center",
    gap: 12,
  },
  proIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,30,30,0.4)",
    backgroundColor: "rgba(255,30,30,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  proTitle: {
    fontFamily: fonts.displaySemiBold,
    color: "#FFFFFF",
    fontSize: 20,
    textAlign: "center",
  },
  proCopy: {
    maxWidth: 360,
    fontFamily: fonts.sansRegular,
    color: "#A1A1AA",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  upgradeBtn: {
    marginTop: 8,
    alignSelf: "stretch",
    borderRadius: 6,
    backgroundColor: colors.primary,
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  upgradeText: {
    fontFamily: fonts.sansBold,
    color: "#FFFFFF",
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  dashboardBtn: {
    alignSelf: "stretch",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  dashboardBtnText: {
    fontFamily: fonts.sansBold,
    color: "#E4E4E7",
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  summaryStrip: {
    flexDirection: "row",
    overflow: "hidden",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#161616",
  },
  summaryCell: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 6,
    gap: 6,
  },
  summaryBorder: {
    borderRightWidth: 1,
    borderRightColor: "rgba(255,255,255,0.08)",
  },
  summaryValue: {
    width: "100%",
    fontFamily: fonts.displayBold,
    color: "#34D399",
    fontSize: 18,
    lineHeight: 18,
    fontVariant: ["tabular-nums"],
    textAlign: "center",
    includeFontPadding: false,
  },
  summaryLabel: {
    width: "100%",
    fontFamily: fonts.sansSemiBold,
    color: "#71717A",
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 1.08,
    textTransform: "uppercase",
    textAlign: "center",
    includeFontPadding: false,
  },
  controlCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#161616",
    padding: 12,
    gap: 12,
  },
  controlRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  controlField: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  intervalField: {
    flex: 1.2,
  },
  controlLabel: {
    fontFamily: fonts.sansSemiBold,
    color: "#71717A",
    fontSize: 9,
    lineHeight: 11,
    letterSpacing: 0.23,
    textTransform: "uppercase",
  },
  controlInput: {
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#111111",
    color: "#FFFFFF",
    paddingHorizontal: 8,
    fontFamily: fonts.sansRegular,
    fontSize: 14,
    lineHeight: 18,
    fontVariant: ["tabular-nums"],
  },
  intervalWrap: {
    position: "relative",
  },
  intervalInput: {
    paddingRight: 36,
  },
  controlDisabled: {
    opacity: 0.5,
  },
  secSuffix: {
    position: "absolute",
    right: 8,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    pointerEvents: "none",
  },
  secSuffixText: {
    fontFamily: fonts.sansRegular,
    color: "#71717A",
    fontSize: 10,
  },
  autoWrap: {
    height: 36,
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: "#52525B",
    backgroundColor: "#18181B",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxOn: {
    borderColor: "#0EA5E9",
    backgroundColor: "#0C4A6E",
  },
  autoLabel: {
    fontFamily: fonts.sansMedium,
    color: "#D4D4D8",
    fontSize: 9,
    lineHeight: 11,
  },
  refreshBtn: {
    height: 36,
    minWidth: 68,
    flexShrink: 0,
    borderRadius: 8,
    backgroundColor: "#059669",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  refreshDisabled: {
    opacity: 0.5,
  },
  refreshText: {
    fontFamily: fonts.sansMedium,
    color: "#FFFFFF",
    fontSize: 12,
  },
  controlFooter: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    paddingTop: 12,
    gap: 12,
  },
  hint: {
    fontFamily: fonts.sansRegular,
    color: "#A1A1AA",
    fontSize: 12,
    lineHeight: 20,
  },
  hintValue: {
    fontFamily: fonts.sansMedium,
    color: "#E4E4E7",
  },
  updatedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  updatedText: {
    fontFamily: fonts.sansRegular,
    color: "#A1A1AA",
    fontSize: 12,
  },
  updatedFresh: {
    color: "#A1A1AA",
  },
  updatedStale: {
    color: "#F87171",
  },
  updatedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#34D399",
    shadowColor: "#34D399",
    shadowOpacity: 0.6,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
  fetching: {
    fontFamily: fonts.sansRegular,
    color: "#71717A",
    fontSize: 12,
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
  boardShell: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(24,24,27,0.4)",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  boardShellRefreshing: {
    opacity: 0.6,
  },
  refreshOverlay: {
    ...StyleSheet.absoluteFill,
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
  sportTabsWrap: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(24,24,27,0.8)",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sportTabs: {
    flexDirection: "row",
    width: "100%",
  },
  sportTab: {
    flex: 1,
    minWidth: 0,
    alignItems: "stretch",
  },
  sportTabInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 4,
    paddingTop: 8,
    paddingBottom: 8,
  },
  sportTabText: {
    fontFamily: fonts.sansMedium,
    color: "#71717A",
    fontSize: 12,
  },
  sportTabOn: {
    color: "#FFFFFF",
  },
  sportUnderline: {
    height: 2,
    width: "100%",
    backgroundColor: "transparent",
  },
  sportUnderlineOn: {
    backgroundColor: colors.primary,
  },
  boardHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 16,
  },
  boardTitle: {
    flex: 1,
    minWidth: 0,
    fontFamily: fonts.sansSemiBold,
    color: "#FFFFFF",
    fontSize: 14,
  },
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
    gap: 6,
  },
  sortLabel: {
    fontFamily: fonts.sansRegular,
    color: "#71717A",
    fontSize: 12,
  },
  sortTrigger: {
    width: 152,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#111111",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  sortTriggerText: {
    flex: 1,
    fontFamily: fonts.sansRegular,
    color: "#E4E4E7",
    fontSize: 12,
  },
  sortChevronOpen: {
    transform: [{ rotate: "180deg" }],
  },
  sortModalRoot: {
    flex: 1,
  },
  sortBackdrop: {
    ...StyleSheet.absoluteFill,
  },
  sortMenu: {
    position: "absolute",
    zIndex: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#111111",
    paddingVertical: 4,
    overflow: "hidden",
    elevation: 24,
    shadowColor: "#000",
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  sortOption: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  sortOptionOn: {
    backgroundColor: "rgba(2,44,34,0.4)",
  },
  sortOptionText: {
    fontFamily: fonts.sansRegular,
    color: "#D4D4D8",
    fontSize: 12,
  },
  sortOptionTextOn: {
    color: "#A7F3D0",
  },
  list: {
    paddingHorizontal: 12,
    paddingBottom: 16,
    gap: 16,
  },
  loadingBox: {
    alignItems: "center",
    gap: 10,
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(24,24,27,0.4)",
  },
  emptyBox: {
    margin: 12,
    height: 152,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(24,24,27,0.4)",
    paddingHorizontal: 16,
  },
  emptyBoxText: {
    fontFamily: fonts.sansRegular,
    color: "#A1A1AA",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  extraCard: {
    minWidth: 0,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#161616",
    padding: 16,
  },
  extraTitle: {
    fontFamily: fonts.sansSemiBold,
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 20,
  },
  extraCopy: {
    marginTop: 8,
    fontFamily: fonts.sansRegular,
    color: "#A1A1AA",
    fontSize: 12,
    lineHeight: 20,
  },
  steps: {
    marginTop: 12,
    gap: 10,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  stepBadge: {
    width: 20,
    height: 20,
    flexShrink: 0,
    borderRadius: 10,
    backgroundColor: "#FF1E1E",
    alignItems: "center",
    justifyContent: "center",
  },
  stepBadgeText: {
    fontFamily: fonts.sansBold,
    color: "#FFFFFF",
    fontSize: 10,
    lineHeight: 10,
    includeFontPadding: false,
  },
  stepText: {
    flex: 1,
    paddingTop: 2,
    fontFamily: fonts.sansRegular,
    color: "#D4D4D8",
    fontSize: 12,
    lineHeight: 20,
  },
  booksHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  activeCount: {
    flexShrink: 0,
    fontFamily: fonts.sansSemiBold,
    color: "#34D399",
    fontSize: 10,
  },
  logoGrid: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 8,
  },
  logoCell: {
    width: "25%",
    alignItems: "center",
    justifyContent: "center",
  },
  logoCellInner: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "#111111",
    alignItems: "center",
    justifyContent: "center",
    padding: 2,
  },
  viewBooksBtn: {
    marginTop: 10,
    alignItems: "center",
  },
  viewBooks: {
    textAlign: "center",
    fontFamily: fonts.sansMedium,
    color: "#34D399",
    fontSize: 10,
  },
  viewBooksPressed: {
    color: "#6EE7B7",
  },
  alertsCard: {
    minWidth: 0,
    overflow: "hidden",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.25)",
    backgroundColor: "#161616",
    padding: 16,
  },
  alertsRow: {
    zIndex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  alertsCopy: {
    flex: 1,
    minWidth: 0,
  },
  alertsTitle: {
    fontFamily: fonts.sansSemiBold,
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 20,
  },
  alertsBody: {
    marginTop: 8,
    fontFamily: fonts.sansRegular,
    color: "#A1A1AA",
    fontSize: 12,
    lineHeight: 20,
  },
  telegramBtn: {
    marginTop: 12,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 8,
    backgroundColor: "#7C3AED",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  telegramBtnPressed: {
    backgroundColor: "#8B5CF6",
  },
  telegramText: {
    fontFamily: fonts.sansBold,
    color: "#FFFFFF",
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  phoneShadow: {
    flexShrink: 0,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 16,
  },
  phoneMock: {
    width: 100,
    height: 172,
    borderRadius: 18.4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "#0E1621",
    overflow: "hidden",
    pointerEvents: "none",
  },
  phoneInner: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 200,
    height: 344,
    transformOrigin: "0% 0%",
    transform: [{ scale: 0.5 }],
  },
  phoneBar: {
    alignSelf: "center",
    width: 48,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginTop: 12,
  },
  phoneHeader: {
    marginTop: 12,
    backgroundColor: "#17212B",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: "rgba(0,0,0,0.3)",
  },
  phoneHeaderText: {
    fontFamily: fonts.sansSemiBold,
    color: "#FFFFFF",
    fontSize: 13,
    lineHeight: 16,
    includeFontPadding: false,
  },
  phoneBody: {
    position: "relative",
    flex: 1,
    margin: 12,
    gap: 8,
  },
  phoneArbCard: {
    overflow: "hidden",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(16,185,129,0.2)",
    backgroundColor: "#0F1A14",
    padding: 12,
  },
  phoneLive: {
    fontFamily: fonts.sansBold,
    color: "#34D399",
    fontSize: 10,
    letterSpacing: 0.25,
    textTransform: "uppercase",
    lineHeight: 12,
    includeFontPadding: false,
  },
  phoneMatch: {
    marginTop: 4,
    fontFamily: fonts.sansSemiBold,
    color: "#FFFFFF",
    fontSize: 12,
    lineHeight: 15,
    includeFontPadding: false,
  },
  phoneRoi: {
    marginTop: 4,
    fontFamily: fonts.sansBold,
    color: "#34D399",
    fontSize: 12,
    lineHeight: 15,
    fontVariant: ["tabular-nums"],
    includeFontPadding: false,
  },
  phoneMsg: {
    borderRadius: 12,
    backgroundColor: "#182533",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  phoneMsgTitle: {
    fontFamily: fonts.sansSemiBold,
    color: "#FFFFFF",
    fontSize: 11,
    lineHeight: 15,
    includeFontPadding: false,
  },
  phoneMsgBody: {
    marginTop: 4,
    fontFamily: fonts.sansRegular,
    color: "#C5D0DB",
    fontSize: 10,
    lineHeight: 14,
    includeFontPadding: false,
  },
  phoneMsgLink: {
    marginTop: 8,
    fontFamily: fonts.sansMedium,
    color: "#6AB3F3",
    fontSize: 10,
    lineHeight: 12,
    includeFontPadding: false,
  },
  phoneFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 48,
    pointerEvents: "none",
  },
  toastWrap: {
    position: "absolute",
    right: 16,
    bottom: 16,
    left: 16,
    zIndex: 50,
    alignItems: "flex-end",
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
});
