import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutRectangle,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import {
  NavIconArbitrage,
  NavIconPrediction,
  NavIconValueBets,
} from "@/components/icons/appNavIcons";
import { PnlTrendLineChart, PNL_CHART_DASHBOARD_HEIGHT } from "@/components/charts/PnlTrendLineChart";
import { TeamLogo, TeamLogoPair } from "@/components/TeamLogo";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { OddsApiErrorBanner } from "@/components/ui/OddsApiErrorBanner";
import { pageChromeStyles } from "@/components/layout/pageHeaderStyles";
import { AccountInactiveNotice } from "@/features/auth/AccountInactiveNotice";
import { useSession } from "@/features/auth/SessionProvider";
import { useDashboardMarket } from "@/features/dashboard/useDashboardMarket";
import { betsApi } from "@/lib/api/endpoints/bets";
import type {
  ManualBetRow,
  PublicArbTeaser,
  PublicLineShopTeaser,
} from "@/lib/api/types";
import { isAccountActive } from "@/lib/accountStatus";
import { effectiveExpectedProfit, realizedProfitForBet } from "@/lib/betProfit";
import {
  arbRoiPercent,
  formatLocalDateTime,
} from "@/lib/format";
import { DASHBOARD_LINE_SHOP_LIMIT } from "@/lib/odds/dashboardMarket";
import { openPricing, openTelegramChannel } from "@/lib/openLinks";
import { isEliteUser, isProUser } from "@/lib/planAccess";
import type { DashboardPredictionRow } from "@/lib/predictions/rows";
import { awayAtHomeLabel, shortTeamName } from "@/lib/teamDisplay";
import { colors } from "@/theme/tokens";
import { fonts, typography } from "@/theme/typography";

const HOW_STEPS = [
  "We scan thousands of lines across books",
  "Our models find value, arbs & edges",
  "You get alerts & beat the market",
];

const ELITE_UPSELL_FEATURES = [
  "Model Predictions board",
  "Value Bets fair odds & confidence",
  "Engine-backed win rankings",
  "Everything in Pro",
];

const ELITE_ACTIVE_FEATURES = [
  "Model Predictions board",
  "Value Bets fair odds & confidence",
  "Arbitrage + Value Bets scanners",
  "Bet log & Telegram arb alerts",
];

const SPORT_TABS = [
  { key: "all", label: "All" },
  { key: "baseball_mlb", label: "MLB" },
  { key: "basketball_nba", label: "NBA" },
  { key: "americanfootball_nfl", label: "NFL" },
  { key: "icehockey_nhl", label: "NHL" },
] as const;

type OppTab = "edge" | "arb" | "prediction";

/** Keep Top Opportunities body height stable across tabs (4 rows + gaps). */
const OPP_ROW_MIN_HEIGHT = 60;
const OPP_LIST_GAP = 8;
const OPP_BODY_HEIGHT =
  DASHBOARD_LINE_SHOP_LIMIT * OPP_ROW_MIN_HEIGHT +
  (DASHBOARD_LINE_SHOP_LIMIT - 1) * OPP_LIST_GAP;

function LiveDot() {
  return (
    <View style={styles.liveDotWrap}>
      <View style={styles.liveDotPing} />
      <View style={styles.liveDot} />
    </View>
  );
}

function TelegramIcon() {
  return (
    <Svg fill="#FFFFFF" height={16} viewBox="0 0 24 24" width={16}>
      <Path d="M21.8 4.2L2.9 11.5c-1.3.5-1.3 1.2-.2 1.5l4.8 1.5 1.8 5.6c.2.7.4.9 1 .9.6 0 .8-.3 1.1-.6l2.7-2.6 5.6 4.1c1 .6 1.8.3 2-.9l3.6-17c.4-1.5-.5-2.1-1.5-1.7z" />
    </Svg>
  );
}

function SummaryStrip({
  liveCount,
  upcomingCount,
  lineShopCount,
  predictionCount,
  elite,
  loading,
  predictionLoading,
  resetKey,
}: {
  liveCount: number;
  upcomingCount: number;
  lineShopCount: number;
  predictionCount: number;
  elite: boolean;
  loading: boolean;
  predictionLoading: boolean;
  resetKey?: string;
}) {
  const cells: Array<{
    label: string;
    value: number | null;
    locked: boolean;
    spin: boolean;
    delayMs: number;
  }> = [
    {
      label: "Live Arbs",
      value: liveCount,
      locked: false,
      spin: false,
      delayMs: 0,
    },
    {
      label: "Upcoming Arbs",
      value: upcomingCount,
      locked: false,
      spin: false,
      delayMs: 40,
    },
    {
      label: "Value Bets",
      value: lineShopCount,
      locked: false,
      spin: false,
      delayMs: 80,
    },
    {
      label: "Predictions",
      value: elite ? predictionCount : null,
      locked: !elite,
      spin: elite && predictionLoading,
      delayMs: 120,
    },
  ];

  return (
    <View style={styles.summaryStrip}>
      {cells.map((cell, index) => (
        <View
          key={cell.label}
          style={[
            styles.summaryCell,
            index < cells.length - 1 ? styles.summaryCellBorder : null,
          ]}
        >
          {loading || cell.spin ? (
            <ActivityIndicator color={colors.success} size="small" />
          ) : cell.value == null ? (
            <Text style={[styles.summaryValue, styles.summaryValueMuted]}>
              —
            </Text>
          ) : (
            <AnimatedNumber
              delayMs={cell.delayMs}
              format="integer"
              resetKey={resetKey}
              style={[
                styles.summaryValue,
                cell.locked ? styles.summaryValueMuted : null,
              ]}
              value={cell.value}
            />
          )}
          <Text numberOfLines={2} style={styles.summaryLabel}>
            {cell.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

function OppEmptyState({ children }: { children: ReactNode }) {
  return (
    <View style={styles.oppBodyFill}>
      <Text style={styles.emptyCopy}>{children}</Text>
    </View>
  );
}

function OppEdgeList({
  picks,
  resetKey,
}: {
  picks: PublicLineShopTeaser[];
  resetKey?: string;
}) {
  if (picks.length === 0) {
    return <OppEmptyState>No +EV picks in the current snapshot.</OppEmptyState>;
  }

  return (
    <View style={styles.oppList}>
      {picks.map((pick) => (
        <View key={`${pick.eventId}-${pick.teamName}`} style={styles.oppRow}>
          <TeamLogo
            size={36}
            sportKey={pick.sportKey}
            teamName={pick.teamName}
          />
          <View style={styles.oppCopy}>
            <Text numberOfLines={1} style={styles.oppTitle}>
              {pick.awayTeam && pick.homeTeam
                ? awayAtHomeLabel(pick.awayTeam, pick.homeTeam)
                : shortTeamName(pick.teamName)}
            </Text>
            <Text numberOfLines={1} style={styles.oppMeta}>
              {pick.sportTitle}
              {pick.commenceTime
                ? ` · ${formatLocalDateTime(pick.commenceTime)}`
                : ""}
            </Text>
          </View>
          <View style={styles.oppMetric}>
            <Text style={styles.oppMetricLabel}>Edge</Text>
            <AnimatedNumber
              format="signed-percent-2"
              resetKey={resetKey}
              style={
                (pick.evPercent ?? pick.edgePercent) >= 0
                  ? styles.oppMetricGreen
                  : styles.oppMetricRed
              }
              value={pick.evPercent ?? pick.edgePercent}
            />
          </View>
          {pick.awayTeam && pick.homeTeam ? (
            <TeamLogoPair
              awayTeam={pick.awayTeam}
              homeTeam={pick.homeTeam}
              size={24}
              sportKey={pick.sportKey}
            />
          ) : null}
        </View>
      ))}
    </View>
  );
}

function OppArbList({
  arbs,
  resetKey,
}: {
  arbs: PublicArbTeaser[];
  resetKey?: string;
}) {
  if (arbs.length === 0) {
    return (
      <OppEmptyState>
        No arbitrage opportunities in the current snapshot.
      </OppEmptyState>
    );
  }

  return (
    <View style={styles.oppList}>
      {arbs.map((arb) => (
        <View key={`${arb.eventId}-${arb.matchup}`} style={styles.oppRow}>
          <TeamLogoPair
            awayTeam={arb.awayTeam}
            homeTeam={arb.homeTeam}
            size={28}
            sportKey={arb.sportKey}
          />
          <View style={styles.oppCopy}>
            <Text numberOfLines={1} style={styles.oppTitle}>
              {awayAtHomeLabel(arb.awayTeam, arb.homeTeam)}
            </Text>
            <Text numberOfLines={1} style={styles.oppMeta}>
              {arb.sportTitle} · {formatLocalDateTime(arb.commenceTime)}
            </Text>
          </View>
          <View style={styles.oppMetric}>
            <Text style={styles.oppMetricLabelRoi}>ROI</Text>
            <AnimatedNumber
              format="percent-2"
              resetKey={resetKey}
              style={
                arbRoiPercent(arb) >= 0
                  ? styles.oppMetricGreen
                  : styles.oppMetricRed
              }
              value={arbRoiPercent(arb)}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

function OppPredictionLocked() {
  return (
    <View style={styles.predictionLocked}>
      <View style={styles.eliteBadge}>
        <Text style={styles.eliteBadgeText}>ELITE</Text>
      </View>
      <Text style={styles.predictionLockedCopy}>
        Best Prediction ranks pre-game model favorites by win %, then confidence
        and edge — unlocked on Elite.
      </Text>
      <Pressable onPress={() => void openPricing("/model-predictions")}>
        <Text style={styles.upgradeLink}>Upgrade to Elite →</Text>
      </Pressable>
    </View>
  );
}

function OppPredictionList({
  rows,
  resetKey,
}: {
  rows: DashboardPredictionRow[];
  resetKey?: string;
}) {
  if (rows.length === 0) {
    return <OppEmptyState>No model predictions right now.</OppEmptyState>;
  }

  return (
    <View style={styles.oppList}>
      {rows.map((row) => (
        <View key={row.eventId} style={styles.oppRow}>
          <TeamLogo
            size={36}
            sportKey={row.sportKey}
            teamName={row.favoriteTeam}
          />
          <View style={styles.oppCopy}>
            <Text numberOfLines={1} style={styles.oppTitle}>
              {awayAtHomeLabel(row.awayTeam, row.homeTeam)}
            </Text>
            <Text numberOfLines={1} style={styles.oppMeta}>
              {row.sportTitle} · {formatLocalDateTime(row.commenceTime)}
            </Text>
          </View>
          <View style={styles.oppMetric}>
            <Text style={styles.oppMetricLabel}>Win %</Text>
            <View style={styles.oppMetricRow}>
              <AnimatedNumber
                format="decimal-1"
                resetKey={resetKey}
                style={
                  row.winProb >= 50
                    ? styles.oppMetricGreen
                    : styles.oppMetricRed
                }
                value={row.winProb}
              />
              <Text
                style={
                  row.winProb >= 50
                    ? styles.oppMetricGreen
                    : styles.oppMetricRed
                }
              >
                %
              </Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

function PerfCell({
  label,
  value,
  format = "integer",
  borderLeft,
  borderTop,
  green,
}: {
  label: string;
  value: number;
  format?: "integer" | "currency-2";
  borderLeft?: boolean;
  borderTop?: boolean;
  green?: boolean;
}) {
  return (
    <View
      style={[
        styles.perfCell,
        borderLeft ? styles.perfCellBorderL : null,
        borderTop ? styles.perfCellBorderT : null,
      ]}
    >
      <Text style={styles.perfCellLabel}>{label}</Text>
      <AnimatedNumber
        format={format}
        style={[styles.perfCellValue, green ? styles.oppMetricGreen : null]}
        value={value}
      />
    </View>
  );
}

function QuickCard({
  title,
  desc,
  href,
  iconBg,
  iconColor,
  Icon,
  badge,
  onPress,
}: {
  title: string;
  desc: string;
  href: Href;
  iconBg: string;
  iconColor: string;
  Icon: typeof NavIconValueBets;
  badge?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        if (onPress) {
          onPress();
          return;
        }
        router.push(href);
      }}
      style={({ pressed }) => [styles.quickCard, pressed ? styles.pressed : null]}
    >
      {badge ? (
        <View style={styles.quickBadge}>
          <Text style={styles.quickBadgeText}>{badge}</Text>
        </View>
      ) : null}
      <View style={[styles.quickIconWrap, { backgroundColor: iconBg }]}>
        <Icon color={iconColor} size={20} />
      </View>
      <View style={styles.quickCopy}>
        <Text style={styles.quickTitle}>{title}</Text>
        <Text numberOfLines={1} style={styles.quickDesc}>
          {desc}
        </Text>
      </View>
    </Pressable>
  );
}

function GhostButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.ghostBtn,
        pressed ? styles.pressed : null,
      ]}
    >
      <Text style={styles.ghostBtnText}>{label}</Text>
    </Pressable>
  );
}

function SportSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<LayoutRectangle | null>(null);
  const triggerRef = useRef<View>(null);
  const selected =
    SPORT_TABS.find((tab) => tab.key === value)?.label ?? value;

  function openMenu() {
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ x, y, width, height });
      setOpen(true);
    });
  }

  const menuStyle = useMemo(() => {
    if (!anchor) return null;
    const screen = Dimensions.get("window");
    const menuWidth = Math.max(anchor.width, 128);
    const estimatedHeight = SPORT_TABS.length * 40 + 8;
    const spaceBelow = screen.height - (anchor.y + anchor.height) - 12;
    const openUp = spaceBelow < estimatedHeight && anchor.y > estimatedHeight;
    const left = Math.min(
      Math.max(8, anchor.x + anchor.width - menuWidth),
      screen.width - menuWidth - 8
    );
    const top = openUp
      ? Math.max(8, anchor.y - estimatedHeight - 4)
      : anchor.y + anchor.height + 4;
    return {
      top,
      left,
      width: menuWidth,
      maxHeight: Math.min(estimatedHeight, screen.height - top - 12),
    };
  }, [anchor]);

  useEffect(() => {
    if (!open) setAnchor(null);
  }, [open]);

  return (
    <>
      <View ref={triggerRef} collapsable={false}>
        <Pressable
          accessibilityLabel="Filter performance by sport"
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          onPress={() => (open ? setOpen(false) : openMenu())}
          style={styles.sportSelect}
        >
          <Text style={styles.sportSelectText}>{selected}</Text>
          <Ionicons
            color="#71717A"
            name={open ? "chevron-up" : "chevron-down"}
            size={12}
          />
        </Pressable>
      </View>
      <Modal
        animationType="fade"
        onRequestClose={() => setOpen(false)}
        transparent
        visible={open}
      >
        <View style={styles.sportModalRoot}>
          <Pressable
            accessibilityLabel="Dismiss sport filter"
            onPress={() => setOpen(false)}
            style={styles.sportModalBackdrop}
          />
          {menuStyle ? (
            <View style={[styles.sportMenu, menuStyle]}>
              <ScrollView
                bounces={false}
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
              >
                {SPORT_TABS.map((tab) => {
                  const active = tab.key === value;
                  return (
                    <Pressable
                      key={tab.key}
                      onPress={() => {
                        onChange(tab.key);
                        setOpen(false);
                      }}
                      style={[
                        styles.sportMenuItem,
                        active ? styles.sportMenuItemActive : null,
                      ]}
                    >
                      <Text
                        style={[
                          styles.sportMenuItemText,
                          active ? styles.sportMenuItemTextActive : null,
                        ]}
                      >
                        {tab.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}
        </View>
      </Modal>
    </>
  );
}

export function DashboardScreen() {
  const { user, ready, refresh } = useSession();
  const accountActive = user ? isAccountActive(user.accountStatus) : true;
  const pro = accountActive && isProUser(user);
  const elite = accountActive && isEliteUser(user);
  const [oppTab, setOppTab] = useState<OppTab>("edge");
  const [perfSport, setPerfSport] = useState<string>("all");
  const [bets, setBets] = useState<ManualBetRow[]>([]);
  const [betsLoading, setBetsLoading] = useState(false);

  const {
    nowMs,
    market,
    loading,
    refreshing,
    error,
    errorCode,
    errorTitle,
    predictionRows,
    predictionsLoading,
    modelPredictionCount,
  } = useDashboardMarket({
    ready: ready && accountActive,
    pro,
    elite,
    userId: user?.id ?? null,
    refresh,
  });

  useEffect(() => {
    if (!pro) {
      setBets([]);
      return;
    }
    let cancelled = false;
    setBetsLoading(true);
    void betsApi
      .list()
      .then((res) => {
        if (!cancelled) setBets(res.bets ?? []);
      })
      .catch(() => {
        if (!cancelled) setBets([]);
      })
      .finally(() => {
        if (!cancelled) setBetsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pro]);

  const liveCount = market?.liveArbCount ?? 0;
  const upcomingCount = market?.upcomingArbCount ?? 0;
  const lineShopCount = market?.lineShopPickCount ?? 0;

  const bestEdgePicks = useMemo(() => {
    const teasers = market?.lineShopTeasers ?? [];
    return [...teasers]
      .sort(
        (a, b) =>
          (b.evPercent ?? b.edgePercent) - (a.evPercent ?? a.edgePercent)
      )
      .slice(0, DASHBOARD_LINE_SHOP_LIMIT);
  }, [market?.lineShopTeasers]);

  const bestArbs = useMemo(() => {
    const arbs = market?.bestArbitrageOpportunities ?? [];
    return [...arbs]
      .sort((a, b) => arbRoiPercent(b) - arbRoiPercent(a))
      .slice(0, DASHBOARD_LINE_SHOP_LIMIT);
  }, [market?.bestArbitrageOpportunities]);

  const snapshotAgeSec = market?.fetchedAt
    ? Math.max(
        0,
        Math.floor((nowMs - new Date(market.fetchedAt).getTime()) / 1000)
      )
    : null;

  const filteredBets = useMemo(() => {
    if (perfSport === "all") return bets;
    return bets.filter((b) => b.sportKey === perfSport);
  }, [bets, perfSport]);

  const performance = useMemo(() => {
    const logged = filteredBets.length;
    const won = filteredBets.filter((b) => b.result === "won").length;
    const pending = filteredBets.filter((b) => b.result === "pending").length;
    const expectedTotal = filteredBets.reduce(
      (sum, bet) => sum + effectiveExpectedProfit(bet),
      0
    );
    const realizedTotal = filteredBets.reduce(
      (sum, bet) => sum + realizedProfitForBet(bet),
      0
    );
    return { logged, won, pending, expectedTotal, realizedTotal };
  }, [filteredBets]);

  const pnlChart = useMemo(() => {
    const rows = [...filteredBets]
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
      .slice(-24);
    if (rows.length === 0) return null;
    let running = 0;
    return rows.map((row, i) => {
      running += realizedProfitForBet(row);
      return { index: i + 1, cumulative: Number(running.toFixed(2)) };
    });
  }, [filteredBets]);

  const oppCta =
    oppTab === "arb"
      ? {
          label: "View all arbs →",
          onPress: () => router.push("/(app)/(tabs)/arbitrage"),
        }
      : oppTab === "prediction"
        ? elite
          ? {
              label: "View all predictions →",
              onPress: () => router.push("/(app)/(tabs)/model-predictions"),
            }
          : {
              label: "Unlock Model Predictions →",
              onPress: () => void openPricing("/model-predictions"),
            }
        : {
            label: "View all picks →",
            onPress: () => router.push("/(app)/(tabs)/value-bets"),
          };

  if (!accountActive) {
    return (
      <View style={styles.safe}>
        <ScrollView
          contentContainerStyle={pageChromeStyles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.pageTitle}>Dashboard</Text>
            <Text allowFontScaling={false} style={styles.subtitle}>
              Live market intelligence. Find the best edges, arbs, and insights.
            </Text>
          </View>
          <AccountInactiveNotice />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.safe}>
      <ScrollView
        contentContainerStyle={pageChromeStyles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.pageTitle}>Dashboard</Text>
            <View style={styles.statusRow}>
              <LiveDot />
              <Text style={styles.statusText}>
                {refreshing
                  ? "Refreshing…"
                  : snapshotAgeSec != null
                    ? `Updated ${snapshotAgeSec}s ago`
                    : "Waiting for snapshot"}
              </Text>
            </View>
          </View>
          <Text allowFontScaling={false} style={styles.subtitle}>
            Live market intelligence. Find the best edges, arbs, and insights.
          </Text>
        </View>

        {error ? (
          <OddsApiErrorBanner
            error={error}
            errorCode={errorCode ?? undefined}
            errorTitle={errorTitle ?? undefined}
          />
        ) : null}

        <SummaryStrip
          elite={elite}
          lineShopCount={lineShopCount}
          liveCount={liveCount}
          loading={loading}
          predictionCount={modelPredictionCount}
          predictionLoading={predictionsLoading}
          resetKey={market?.fetchedAt}
          upcomingCount={upcomingCount}
        />

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Top Opportunities</Text>
            <View style={styles.tabBar}>
              {(
                [
                  ["edge", "Best Edge"],
                  ["arb", "Best Arbitrage"],
                  ["prediction", "Best Prediction"],
                ] as const
              ).map(([id, label]) => (
                <Pressable
                  key={id}
                  onPress={() => setOppTab(id)}
                  style={[
                    styles.tabPill,
                    oppTab === id ? styles.tabPillActive : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.tabPillText,
                      oppTab === id ? styles.tabPillTextActive : null,
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.oppBody}>
            {loading ? (
              <View style={styles.predictionSkeleton}>
                {Array.from({ length: DASHBOARD_LINE_SHOP_LIMIT }).map((_, index) => (
                  <View key={index} style={styles.skeletonRow} />
                ))}
              </View>
            ) : oppTab === "arb" ? (
              <OppArbList arbs={bestArbs} resetKey={market?.fetchedAt} />
            ) : oppTab === "prediction" ? (
              elite ? (
                predictionsLoading ? (
                  <View style={styles.predictionSkeleton}>
                    {Array.from({ length: DASHBOARD_LINE_SHOP_LIMIT }).map((_, index) => (
                      <View key={index} style={styles.skeletonRow} />
                    ))}
                  </View>
                ) : (
                  <OppPredictionList
                    resetKey={market?.fetchedAt}
                    rows={predictionRows}
                  />
                )
              ) : (
                <OppPredictionLocked />
              )
            ) : (
              <OppEdgeList picks={bestEdgePicks} resetKey={market?.fetchedAt} />
            )}
          </View>

          <GhostButton label={oppCta.label} onPress={oppCta.onPress} />
        </View>

        <View style={styles.card}>
          <View style={styles.perfHeaderRow}>
            <Text style={styles.cardTitle}>Your Performance</Text>
            <SportSelect onChange={setPerfSport} value={perfSport} />
          </View>

          {!user ? (
            <Text style={styles.gatedCopy}>
              Log in to see your bet log and P/L.{" "}
              <Text
                accessibilityRole="link"
                onPress={() => router.replace("/(auth)/login")}
                style={styles.loginLink}
              >
                Log in
              </Text>
            </Text>
          ) : !pro ? (
            <View style={styles.gatedBlock}>
              <Text style={styles.gatedCopy}>
                Pro unlocks personal analytics from your logged bets.
              </Text>
              <Pressable
                onPress={() => void openPricing("/dashboard")}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  pressed ? styles.pressed : null,
                ]}
              >
                <Text style={styles.primaryBtnText}>Upgrade to Pro</Text>
              </Pressable>
            </View>
          ) : betsLoading ? (
            <View style={styles.perfSkeleton}>
              <View style={styles.skeletonBlockTall} />
              <View style={styles.skeletonBlock} />
            </View>
          ) : (
            <>
              <View style={styles.perfGrid}>
                <PerfCell label="Bets logged" value={performance.logged} />
                <PerfCell
                  borderLeft
                  label="Won"
                  value={performance.won}
                />
                <PerfCell
                  borderTop
                  label="Pending"
                  value={performance.pending}
                />
                <PerfCell
                  borderLeft
                  borderTop
                  format="currency-2"
                  green
                  label="Expected profit"
                  value={performance.expectedTotal}
                />
              </View>

              <View style={styles.pnlCard}>
                <Text style={styles.pnlLabel}>Realized P/L</Text>
                <AnimatedNumber
                  format="currency-2"
                  style={[
                    styles.pnlValue,
                    performance.realizedTotal > 0
                      ? styles.oppMetricGreen
                      : performance.realizedTotal < 0
                        ? styles.pnlNegative
                        : null,
                  ]}
                  value={performance.realizedTotal}
                />
                {pnlChart ? (
                  <PnlTrendLineChart
                    data={pnlChart}
                    height={PNL_CHART_DASHBOARD_HEIGHT}
                  />
                ) : (
                  <Text style={styles.pnlHint}>
                    Log bets to build your P/L trend.
                  </Text>
                )}
              </View>

              <GhostButton
                label="View performance"
                onPress={() => router.push("/(app)/(tabs)/my-bets")}
              />
            </>
          )}
        </View>

        <View style={styles.quickSection}>
          <Text style={styles.quickEyebrow}>Quick Access</Text>
          <QuickCard
            Icon={NavIconValueBets}
            desc="Find the best value bets"
            href={"/(app)/(tabs)/value-bets" as Href}
            iconBg="rgba(34,197,94,0.15)"
            iconColor="#4ADE80"
            title="Value Bets"
          />
          <QuickCard
            Icon={NavIconArbitrage}
            desc="Find risk-free profit"
            href={"/(app)/(tabs)/arbitrage" as Href}
            iconBg="rgba(139,92,246,0.15)"
            iconColor="#C4B5FD"
            title="Arbitrage Scanner"
          />
          <QuickCard
            Icon={NavIconPrediction}
            badge="ELITE"
            desc="AI-powered pre-game win rankings"
            href={"/(app)/(tabs)/model-predictions" as Href}
            iconBg="rgba(139,92,246,0.15)"
            iconColor="#C4B5FD"
            title="Model Predictions"
            onPress={
              user
                ? undefined
                : () => void openPricing("/model-predictions")
            }
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionCardTitle}>How It Works</Text>
          <Text style={styles.howSub}>3 simple steps to smarter betting</Text>
          <View style={styles.howList}>
            {HOW_STEPS.map((text, index) => (
              <View key={text} style={styles.howRow}>
                <View style={styles.howNumber}>
                  <Text style={styles.howNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.howText}>{text}</Text>
              </View>
            ))}
          </View>
          <GhostButton
            label="Learn more"
            onPress={() => router.push("/(app)/(tabs)/profile")}
          />
        </View>

        <View style={styles.telegramCard}>
          <View style={styles.telegramCopyCol}>
            <Text style={styles.sectionCardTitle}>Join Clutch Odds Arbs</Text>
            <Text style={styles.telegramCopy}>
              Get live and upcoming arbitrage alerts on Telegram (~every 5 min).
              Never miss risk-free profits again.
            </Text>
            <Pressable
              onPress={() => {
                if (pro) void openTelegramChannel();
                else void openPricing("/dashboard");
              }}
              style={({ pressed }) => [
                styles.telegramBtn,
                pressed ? styles.pressed : null,
              ]}
            >
              <Text style={styles.telegramBtnText}>
                {pro ? "Join Telegram" : "Unlock with Pro"}
              </Text>
              {pro ? <TelegramIcon /> : null}
            </Pressable>
          </View>
        </View>

        <View style={styles.eliteCard}>
          <View style={styles.eliteGlow} pointerEvents="none" />
          <Text style={styles.sectionCardTitle}>Ready to Maximize Your Edge?</Text>
          <Text style={styles.eliteCopy}>
            {elite
              ? "You're on Elite — jump into Model Predictions or keep scanning arbs and value."
              : "Upgrade to Elite for Model Predictions and Value Bets insights."}
          </Text>
          <View style={styles.eliteList}>
            {(elite ? ELITE_ACTIVE_FEATURES : ELITE_UPSELL_FEATURES).map(
              (item) => (
                <View key={item} style={styles.eliteItem}>
                  <Ionicons color="#34D399" name="checkmark" size={16} />
                  <Text style={styles.eliteItemText}>{item}</Text>
                </View>
              )
            )}
          </View>
          <Pressable
            onPress={() => {
              if (elite) router.push("/(app)/(tabs)/model-predictions");
              else void openPricing("/dashboard");
            }}
            style={({ pressed }) => [
              styles.primaryBtn,
              pressed ? styles.pressed : null,
            ]}
          >
            <View style={styles.eliteCtaInner}>
              <Ionicons color="#FFFFFF" name="flash" size={14} />
              <Text style={styles.primaryBtnText}>
                {elite ? "Open Model Predictions" : "Upgrade to Elite"}
              </Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    gap: 6,
    marginBottom: 0,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(39,39,42,0.8)",
  },
  headerTitleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  pageTitle: {
    ...typography.pageTitle,
    color: "#FFFFFF",
    flexShrink: 1,
  },
  subtitle: {
    ...typography.pageSubtitle,
  },
  statusRow: {
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusText: {
    fontFamily: fonts.sansRegular,
    color: colors.textMuted,
    fontSize: 12,
  },
  liveDotWrap: {
    width: 8,
    height: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  liveDotPing: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(52,211,153,0.45)",
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#34D399",
  },
  errorBanner: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,107,107,0.35)",
    backgroundColor: "rgba(255,107,107,0.08)",
    padding: 12,
  },
  errorText: {
    fontFamily: fonts.sansRegular,
    color: colors.danger,
    fontSize: 13,
  },
  predictionSkeleton: {
    minHeight: OPP_BODY_HEIGHT,
    gap: OPP_LIST_GAP,
  },
  skeletonRow: {
    height: OPP_ROW_MIN_HEIGHT,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  perfSkeleton: {
    gap: 12,
  },
  skeletonBlockTall: {
    height: 96,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  skeletonBlock: {
    height: 112,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  perfHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  sportSelect: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#111111",
    paddingVertical: 4,
    paddingLeft: 8,
    paddingRight: 8,
  },
  sportSelectText: {
    fontFamily: fonts.sansSemiBold,
    color: "#D4D4D8",
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  sportModalRoot: {
    flex: 1,
  },
  sportModalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "transparent",
  },
  sportMenu: {
    position: "absolute",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#111111",
    overflow: "hidden",
    paddingVertical: 4,
    shadowColor: "#000",
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  sportMenuItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sportMenuItemActive: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  sportMenuItemText: {
    fontFamily: fonts.sansRegular,
    color: "#D4D4D8",
    fontSize: 12,
  },
  sportMenuItemTextActive: {
    color: "#FFFFFF",
  },
  loginLink: {
    color: colors.primary,
  },
  eliteCtaInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    gap: 6,
  },
  summaryCellBorder: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: "rgba(255,255,255,0.08)",
  },
  summaryValue: {
    fontFamily: fonts.displayBold,
    color: colors.success,
    fontSize: 18,
    lineHeight: 20,
    fontVariant: ["tabular-nums"],
  },
  summaryValueMuted: {
    color: "#71717A",
  },
  summaryLabel: {
    fontFamily: fonts.sansSemiBold,
    color: "#71717A",
    fontSize: 8,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    textAlign: "center",
    paddingHorizontal: 2,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "#161616",
    padding: 16,
    gap: 14,
  },
  cardHeader: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  cardTitle: {
    fontFamily: fonts.displaySemiBold,
    color: colors.text,
    fontSize: 18,
  },
  /** Web phone `text-base` for How / Telegram / Elite section titles. */
  sectionCardTitle: {
    fontFamily: fonts.displaySemiBold,
    color: colors.text,
    fontSize: 16,
  },
  tabBar: {
    flexDirection: "row",
    flexShrink: 0,
    maxWidth: "100%",
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: 4,
    gap: 2,
  },
  tabPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  tabPillActive: {
    backgroundColor: "#2a2a2a",
  },
  tabPillText: {
    fontFamily: fonts.sansSemiBold,
    color: "#71717A",
    fontSize: 10,
  },
  tabPillTextActive: {
    color: colors.text,
  },
  oppBody: {
    // Fixed slot for 4 rows so Edge / Arb / Prediction don't resize the card.
    minHeight: OPP_BODY_HEIGHT,
  },
  oppBodyFill: {
    minHeight: OPP_BODY_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  loader: {
    marginVertical: 24,
  },
  emptyCopy: {
    fontFamily: fonts.sansRegular,
    color: "#71717A",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    maxWidth: 280,
  },
  oppList: {
    minHeight: OPP_BODY_HEIGHT,
    gap: OPP_LIST_GAP,
  },
  oppRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: OPP_ROW_MIN_HEIGHT,
    borderRadius: 12,
    backgroundColor: "#111111",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  oppCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  oppTitle: {
    fontFamily: fonts.sansSemiBold,
    color: colors.text,
    fontSize: 14,
  },
  oppMeta: {
    fontFamily: fonts.sansRegular,
    color: "#71717A",
    fontSize: 11,
  },
  oppMetric: {
    alignItems: "flex-end",
  },
  oppMetricRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 2,
  },
  oppMetricLabel: {
    fontFamily: fonts.sansSemiBold,
    color: "#71717A",
    fontSize: 9,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  oppMetricLabelRoi: {
    fontFamily: fonts.sansSemiBold,
    color: "#71717A",
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  oppMetricGreen: {
    fontFamily: fonts.displayBold,
    color: colors.success,
    fontSize: 14,
    marginTop: 2,
    fontVariant: ["tabular-nums"],
  },
  oppMetricRed: {
    fontFamily: fonts.displayBold,
    color: "#F87171",
    fontSize: 14,
    marginTop: 2,
    fontVariant: ["tabular-nums"],
  },
  predictionLocked: {
    minHeight: OPP_BODY_HEIGHT,
    justifyContent: "center",
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.2)",
    backgroundColor: "rgba(139,92,246,0.06)",
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  eliteBadge: {
    alignSelf: "flex-start",
    borderRadius: 4,
    backgroundColor: "rgba(139,92,246,0.2)",
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  eliteBadgeText: {
    fontFamily: fonts.sansBold,
    color: "#C4B5FD",
    fontSize: 9,
    letterSpacing: 0.8,
  },
  predictionLockedCopy: {
    fontFamily: fonts.sansRegular,
    color: "#D4D4D8",
    fontSize: 14,
    lineHeight: 20,
  },
  upgradeLink: {
    fontFamily: fonts.sansBold,
    color: colors.primary,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  ghostBtn: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#1c1c1c",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  ghostBtnText: {
    fontFamily: fonts.sansBold,
    color: "#F4F4F5",
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  gatedCopy: {
    fontFamily: fonts.sansRegular,
    color: "#A1A1AA",
    fontSize: 14,
    lineHeight: 20,
  },
  gatedBlock: {
    gap: 14,
  },
  primaryBtn: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  primaryBtnText: {
    fontFamily: fonts.sansBold,
    color: colors.text,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  perfGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    overflow: "hidden",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  perfCell: {
    width: "50%",
    backgroundColor: "#111111",
    padding: 12,
  },
  perfCellBorderL: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: "rgba(255,255,255,0.06)",
  },
  perfCellBorderT: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  perfCellLabel: {
    fontFamily: fonts.sansSemiBold,
    color: "#71717A",
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  perfCellValue: {
    fontFamily: fonts.displayBold,
    color: colors.text,
    fontSize: 18,
    marginTop: 4,
    fontVariant: ["tabular-nums"],
  },
  pnlCard: {
    borderRadius: 12,
    backgroundColor: "#111111",
    padding: 12,
    gap: 4,
  },
  pnlLabel: {
    fontFamily: fonts.sansSemiBold,
    color: "#71717A",
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  pnlValue: {
    fontFamily: fonts.displayBold,
    color: colors.text,
    fontSize: 24,
    fontVariant: ["tabular-nums"],
  },
  pnlNegative: {
    color: "#F87171",
  },
  pnlHint: {
    fontFamily: fonts.sansRegular,
    color: "#52525B",
    fontSize: 12,
    marginTop: 6,
  },
  quickSection: {
    gap: 12,
  },
  quickEyebrow: {
    fontFamily: fonts.sansSemiBold,
    color: colors.text,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  quickCard: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "#161616",
    padding: 16,
  },
  quickBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    borderRadius: 4,
    backgroundColor: "rgba(139,92,246,0.2)",
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  quickBadgeText: {
    fontFamily: fonts.sansBold,
    color: "#C4B5FD",
    fontSize: 9,
    letterSpacing: 0.8,
  },
  quickIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  quickCopy: {
    flex: 1,
    minWidth: 0,
    paddingRight: 28,
    gap: 2,
  },
  quickTitle: {
    fontFamily: fonts.sansSemiBold,
    color: colors.text,
    fontSize: 14,
  },
  quickDesc: {
    fontFamily: fonts.sansRegular,
    color: colors.text,
    fontSize: 12,
  },
  howSub: {
    fontFamily: fonts.sansRegular,
    color: "#71717A",
    fontSize: 12,
  },
  howList: {
    marginTop: 8,
    gap: 14,
  },
  howRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  howNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    // Web `bg-emerald-500`
    backgroundColor: "#10B981",
  },
  howNumberText: {
    fontFamily: fonts.sansBold,
    color: "#000000",
    fontSize: 12,
  },
  howText: {
    flex: 1,
    fontFamily: fonts.sansRegular,
    color: "#D4D4D8",
    fontSize: 12,
    lineHeight: 18,
    paddingTop: 4,
  },
  telegramCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "#161616",
    padding: 16,
    overflow: "hidden",
  },
  telegramCopyCol: {
    gap: 8,
  },
  telegramCopy: {
    fontFamily: fonts.sansRegular,
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  telegramBtn: {
    marginTop: 8,
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 8,
    backgroundColor: "#0EA5E9",
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  telegramBtnText: {
    fontFamily: fonts.sansBold,
    color: colors.text,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  eliteCard: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,30,30,0.3)",
    backgroundColor: "#161616",
    padding: 16,
    gap: 12,
  },
  eliteGlow: {
    position: "absolute",
    right: -32,
    top: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(255,30,30,0.2)",
  },
  eliteCopy: {
    fontFamily: fonts.sansRegular,
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  eliteList: {
    gap: 8,
  },
  eliteItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  eliteItemText: {
    flex: 1,
    fontFamily: fonts.sansRegular,
    color: "#D4D4D8",
    fontSize: 12,
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.88,
  },
});
