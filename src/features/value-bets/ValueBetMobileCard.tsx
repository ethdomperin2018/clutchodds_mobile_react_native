import { useMemo, type ReactNode } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { BookLogo } from "@/components/BookLogo";
import { TeamLogo } from "@/components/TeamLogo";
import {
  ValueBetsEliteBadge,
  ValueBetsEliteLock,
  ValueBetsEliteUnavailable,
} from "@/features/value-bets/ValueBetsEliteLock";
import { americanPayout, probabilityToAmerican } from "@/lib/odds/american";
import {
  exchangeBetLimitCaption,
  stakeExceedsBetLimit,
} from "@/lib/odds/betLimits";
import { formatAmerican, formatLocalDateTime } from "@/lib/format";
import type { LineShopPick } from "@/lib/odds/types";
import type { PickEliteInsights } from "@/lib/valueBets/engineEliteInsights";
import {
  displayConfidenceShortLabel,
  formatSignedPercent,
  sportLeagueLabel,
} from "@/lib/valueBets/format";
import { valueBetTableBlurb } from "@/lib/valueBets/valueBetCopy";
import { shortTeamName } from "@/lib/teamDisplay";
import { fonts } from "@/theme/typography";
import { ValueBetsConfidenceGauge } from "@/features/value-bets/ValueBetsConfidenceGauge";

function MatchupLabel({
  homeTeam,
  awayTeam,
  recommendedTeam,
  sportKey,
}: {
  homeTeam: string;
  awayTeam: string;
  recommendedTeam: string;
  sportKey?: string;
}) {
  return (
    <View style={styles.matchupRow}>
      <TeamLogo size={18} sportKey={sportKey} teamName={awayTeam} />
      <Text
        numberOfLines={1}
        style={[
          styles.matchupTeam,
          recommendedTeam === awayTeam ? styles.matchupRec : null,
        ]}
      >
        {shortTeamName(awayTeam)}
      </Text>
      <Text style={styles.matchupAt}>@</Text>
      <TeamLogo size={18} sportKey={sportKey} teamName={homeTeam} />
      <Text
        numberOfLines={1}
        style={[
          styles.matchupTeam,
          recommendedTeam === homeTeam ? styles.matchupRec : null,
        ]}
      >
        {shortTeamName(homeTeam)}
      </Text>
    </View>
  );
}

function MetricSlot({
  label,
  primary,
  secondary,
}: {
  label: string;
  primary: ReactNode;
  secondary?: ReactNode;
}) {
  return (
    <View style={styles.metricSlot}>
      <Text style={styles.metricLabel}>{label}</Text>
      <View style={styles.metricPrimary}>{primary}</View>
      <View style={styles.metricSecondary}>
        {secondary ?? <Text style={styles.metricGhost}>—</Text>}
      </View>
    </View>
  );
}

/**
 * Phone opportunity card — matches web `ValueBetMobileCard`.
 * Elite Fair Odds / Confidence show engine insights when available.
 */
export function ValueBetMobileCard({
  rank,
  pick,
  ev,
  isLive,
  expanded,
  oddsRefreshing,
  elite,
  insights,
  showEngineInsights,
  eliteInsightsLoading,
  stake,
  stakeInput,
  onStakeChange,
  onToggleExpand,
  onViewDetails,
  onLogPick,
  loggingPick = false,
  pickLogged = false,
}: {
  rank: number;
  pick: LineShopPick;
  ev: number;
  isLive: boolean;
  expanded: boolean;
  oddsRefreshing: boolean;
  elite: boolean;
  insights: PickEliteInsights;
  showEngineInsights: boolean;
  eliteInsightsLoading: boolean;
  stake?: number;
  stakeInput: string;
  onStakeChange: (value: string) => void;
  onToggleExpand: () => void;
  onViewDetails: () => void;
  onLogPick: () => void;
  loggingPick?: boolean;
  pickLogged?: boolean;
}) {
  const limitCaptionFull = exchangeBetLimitCaption({
    bookKey: pick.bestLine.bookKey,
    betLimit: pick.bestLine.betLimit,
    stake,
  });
  const limitCaption = limitCaptionFull
    ? exchangeBetLimitCaption({
        bookKey: pick.bestLine.bookKey,
        betLimit: pick.bestLine.betLimit,
        stake,
        compact: true,
      })
    : null;
  const overLimit = stakeExceedsBetLimit(stake, pick.bestLine.betLimit);

  const stakeNum = Number(stakeInput);
  const stakeForMath =
    Number.isFinite(stakeNum) && stakeNum > 0 ? stakeNum : 100;
  const payoutIfWin = americanPayout(stakeForMath, pick.bestLine.american);
  const expectedValueDollars = (ev / 100) * stakeForMath;

  const blurb = useMemo(
    () =>
      valueBetTableBlurb(pick, insights, ev, isLive, showEngineInsights),
    [pick, insights, ev, isLive, showEngineInsights]
  );

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.rank}>
          <Text style={styles.rankText}>{rank}</Text>
        </View>
        <View style={styles.headerCopy}>
          <MatchupLabel
            awayTeam={pick.awayTeam}
            homeTeam={pick.homeTeam}
            recommendedTeam={pick.teamName}
            sportKey={pick.sportKey}
          />
          <Text numberOfLines={1} style={styles.meta}>
            {sportLeagueLabel(pick.sportTitle)} ·{" "}
            {isLive ? "Live" : formatLocalDateTime(pick.commenceTime)}
          </Text>
        </View>
        <View style={styles.headerRight}>
          {oddsRefreshing ? (
            <ActivityIndicator color="#34D399" size="small" />
          ) : (
            <Text style={styles.evHeader}>{formatSignedPercent(ev)}</Text>
          )}
          <Pressable
            accessibilityLabel={expanded ? "Hide details" : "Show details"}
            onPress={onToggleExpand}
            style={({ pressed }) => [
              styles.expandBtn,
              pressed ? styles.pressed : null,
            ]}
          >
            <Svg
              fill="#A1A1AA"
              height={14}
              style={{ transform: [{ rotate: expanded ? "180deg" : "0deg" }] }}
              viewBox="0 0 20 20"
              width={14}
            >
              <Path
                clipRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                fillRule="evenodd"
              />
            </Svg>
          </Pressable>
        </View>
      </View>

      <View style={styles.valueBetBlock}>
        {oddsRefreshing ? (
          <ActivityIndicator color="#34D399" size="small" />
        ) : (
          <>
            <View style={styles.valueBetTitleRow}>
              <View style={styles.valueBetPill}>
                <Text style={styles.valueBetPillText}>Value Bet</Text>
              </View>
              <Text style={styles.valueBetTeam}>
                {shortTeamName(pick.teamName)}{" "}
                <Text style={styles.valueBetOdds}>
                  {formatAmerican(pick.bestLine.american)}
                </Text>
              </Text>
            </View>
            <Text style={styles.blurb}>{blurb}</Text>
          </>
        )}
      </View>

      <View style={styles.metricsCard}>
        <View style={styles.metricsHeader}>
          <Text style={styles.metricsHeaderLabel}>Model insights</Text>
          <ValueBetsEliteBadge />
        </View>
        <View style={styles.metricsGrid}>
          <MetricSlot
            label="Fair Odds"
            primary={
              !elite ? (
                <ValueBetsEliteLock field="Our Fair Odds" />
              ) : eliteInsightsLoading ? (
                <ActivityIndicator color="#A78BFA" size="small" />
              ) : showEngineInsights ? (
                <Text style={styles.fairOdds}>
                  {formatAmerican(
                    probabilityToAmerican(insights.modelWinProbability)
                  )}
                </Text>
              ) : (
                <ValueBetsEliteUnavailable />
              )
            }
            secondary={
              elite && showEngineInsights && !eliteInsightsLoading ? (
                <Text style={styles.metricSub}>
                  {insights.modelWinProbability.toFixed(1)}%
                </Text>
              ) : undefined
            }
          />
          <View style={styles.metricDivider} />
          <MetricSlot
            label="Best Book"
            primary={
              oddsRefreshing ? (
                <ActivityIndicator color="#34D399" size="small" />
              ) : (
                <View style={styles.bookRow}>
                  <BookLogo
                    bookKey={pick.bestLine.bookKey}
                    bookTitle={pick.bestLine.bookTitle}
                    size={16}
                  />
                  <Text numberOfLines={1} style={styles.bookTitle}>
                    {pick.bestLine.bookTitle}
                  </Text>
                </View>
              )
            }
            secondary={
              !oddsRefreshing && limitCaption ? (
                <Text
                  numberOfLines={1}
                  style={[
                    styles.limitCaption,
                    overLimit ? styles.limitOver : null,
                  ]}
                >
                  {limitCaption}
                </Text>
              ) : undefined
            }
          />
          <View style={styles.metricDivider} />
          <MetricSlot
            label="Confidence"
            primary={
              !elite ? (
                <ValueBetsEliteLock field="Confidence" />
              ) : eliteInsightsLoading ? (
                <ActivityIndicator color="#A78BFA" size="small" />
              ) : showEngineInsights ? (
                <ValueBetsConfidenceGauge
                  label={displayConfidenceShortLabel(insights.confidenceScore)}
                  score={insights.confidenceScore}
                  showLabel={false}
                  size="sm"
                />
              ) : (
                <ValueBetsEliteUnavailable />
              )
            }
            secondary={
              elite && showEngineInsights && !eliteInsightsLoading ? (
                <Text style={styles.metricSub}>
                  {displayConfidenceShortLabel(insights.confidenceScore)}
                </Text>
              ) : undefined
            }
          />
        </View>
      </View>

      {expanded ? (
        <>
          <View style={styles.payoutCard}>
            <Text style={styles.payoutTitle}>Payout</Text>
            <View style={styles.payoutRow}>
              <Text style={styles.payoutLabel}>Bet amount</Text>
              <TextInput
                editable={!loggingPick && !pickLogged}
                keyboardType="number-pad"
                onChangeText={onStakeChange}
                style={styles.stakeInput}
                value={stakeInput}
              />
            </View>
            <View style={styles.payoutRow}>
              <Text style={styles.payoutLabel}>
                If {shortTeamName(pick.teamName)} win
              </Text>
              <Text style={styles.payoutValue}>
                ${payoutIfWin.toFixed(2)}
              </Text>
            </View>
            <View style={[styles.payoutRow, styles.payoutEvRow]}>
              <Text style={styles.payoutLabel}>Expected value</Text>
              <Text
                style={[
                  styles.payoutEv,
                  expectedValueDollars >= 0
                    ? styles.payoutEvPos
                    : styles.payoutEvNeg,
                ]}
              >
                {expectedValueDollars >= 0 ? "+" : ""}$
                {expectedValueDollars.toFixed(2)}
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={onViewDetails}
              style={({ pressed }) => [
                styles.detailsBtn,
                pressed ? styles.pressed : null,
              ]}
            >
              <Text style={styles.detailsText}>View details</Text>
            </Pressable>
            <Pressable
              disabled={loggingPick || pickLogged}
              onPress={onLogPick}
              style={({ pressed }) => [
                styles.logBtn,
                pickLogged ? styles.logBtnDone : null,
                (loggingPick || pickLogged) && !pickLogged
                  ? styles.logBtnDisabled
                  : null,
                pressed && !loggingPick && !pickLogged
                  ? styles.pressed
                  : null,
              ]}
            >
              <Ionicons color="#FFFFFF" name="bookmark-outline" size={14} />
              <Text style={styles.logText}>
                {loggingPick ? "Logging…" : pickLogged ? "Logged" : "Log pick"}
              </Text>
            </Pressable>
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#09090B",
    padding: 10,
    gap: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  rank: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.3)",
    backgroundColor: "rgba(6,78,59,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: {
    fontFamily: fonts.displayBold,
    color: "#6EE7B7",
    fontSize: 11,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  matchupRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexWrap: "wrap",
  },
  matchupTeam: {
    fontFamily: fonts.sansMedium,
    color: "#FFFFFF",
    fontSize: 13,
  },
  matchupRec: {
    color: "#34D399",
  },
  matchupAt: {
    fontFamily: fonts.sansRegular,
    color: "#71717A",
    fontSize: 12,
    marginHorizontal: 2,
  },
  meta: {
    fontFamily: fonts.sansRegular,
    color: "#71717A",
    fontSize: 11,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  evHeader: {
    fontFamily: fonts.displayBold,
    color: "#34D399",
    fontSize: 14,
    fontVariant: ["tabular-nums"],
  },
  expandBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  valueBetBlock: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    paddingTop: 10,
    gap: 6,
  },
  valueBetTitleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  valueBetPill: {
    borderRadius: 4,
    backgroundColor: "rgba(16,185,129,0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  valueBetPillText: {
    fontFamily: fonts.sansBold,
    color: "#34D399",
    fontSize: 9,
    letterSpacing: 1.08,
    textTransform: "uppercase",
  },
  valueBetTeam: {
    fontFamily: fonts.sansSemiBold,
    color: "#FFFFFF",
    fontSize: 14,
  },
  valueBetOdds: {
    color: "#34D399",
    fontVariant: ["tabular-nums"],
  },
  blurb: {
    fontFamily: fonts.sansRegular,
    color: "#71717A",
    fontSize: 11,
    lineHeight: 16,
  },
  metricsCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(0,0,0,0.2)",
    overflow: "hidden",
  },
  metricsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  metricsHeaderLabel: {
    fontFamily: fonts.sansSemiBold,
    color: "#71717A",
    fontSize: 9,
    letterSpacing: 1.08,
    textTransform: "uppercase",
  },
  metricsGrid: {
    flexDirection: "row",
  },
  metricDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  metricSlot: {
    flex: 1,
    minWidth: 0,
    minHeight: 84,
    paddingHorizontal: 6,
    paddingVertical: 8,
    alignItems: "center",
    gap: 4,
  },
  metricLabel: {
    fontFamily: fonts.sansSemiBold,
    color: "#71717A",
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  metricPrimary: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  metricSecondary: {
    minHeight: 14,
    width: "100%",
    alignItems: "center",
  },
  metricGhost: {
    color: "transparent",
    fontSize: 10,
  },
  bookRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    maxWidth: "100%",
  },
  bookTitle: {
    flexShrink: 1,
    fontFamily: fonts.sansSemiBold,
    color: "#F4F4F5",
    fontSize: 12,
  },
  fairOdds: {
    fontFamily: fonts.displayBold,
    color: "#FFFFFF",
    fontSize: 14,
    fontVariant: ["tabular-nums"],
  },
  metricSub: {
    fontFamily: fonts.sansRegular,
    color: "#71717A",
    fontSize: 10,
    fontVariant: ["tabular-nums"],
  },
  limitCaption: {
    fontFamily: fonts.sansRegular,
    color: "#71717A",
    fontSize: 10,
  },
  limitOver: {
    color: "#F87171",
  },
  payoutCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#111111",
    padding: 12,
    gap: 10,
  },
  payoutTitle: {
    fontFamily: fonts.sansSemiBold,
    color: "#FFFFFF",
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  payoutRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  payoutEvRow: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    paddingTop: 8,
  },
  payoutLabel: {
    fontFamily: fonts.sansRegular,
    color: "#71717A",
    fontSize: 12,
  },
  payoutValue: {
    fontFamily: fonts.sansSemiBold,
    color: "#FFFFFF",
    fontSize: 14,
    fontVariant: ["tabular-nums"],
  },
  payoutEv: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    fontVariant: ["tabular-nums"],
  },
  payoutEvPos: {
    color: "#34D399",
  },
  payoutEvNeg: {
    color: "#F87171",
  },
  stakeInput: {
    width: 88,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#0A0A0A",
    paddingHorizontal: 8,
    textAlign: "right",
    fontFamily: fonts.sansSemiBold,
    color: "#FFFFFF",
    fontSize: 14,
    fontVariant: ["tabular-nums"],
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  detailsBtn: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.35)",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  detailsText: {
    fontFamily: fonts.sansSemiBold,
    color: "#34D399",
    fontSize: 12,
  },
  logBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 8,
    backgroundColor: "#059669",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  logBtnDone: {
    backgroundColor: "rgba(6,95,70,0.85)",
  },
  logBtnDisabled: {
    opacity: 0.6,
  },
  logText: {
    fontFamily: fonts.sansSemiBold,
    color: "#FFFFFF",
    fontSize: 12,
  },
  pressed: {
    opacity: 0.85,
  },
});
