import { useMemo, useState, type ReactNode } from "react";
import {
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { BookLogo } from "@/components/BookLogo";
import { MatchupHero } from "@/components/MatchupHero";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { colors } from "@/theme/tokens";
import { getBookSportsbookUrl } from "@/lib/bookmakerLinks";
import {
  exchangeBetLimitCaption,
  stakeExceedsBetLimit,
} from "@/lib/odds/betLimits";
import {
  parseAmericanInput,
  quoteFromManualOdds,
  quoteRoiPercent,
  type EventQuote,
} from "@/lib/odds/eventQuote";
import { formatAmerican, formatLocalDateTime } from "@/lib/format";
import {
  STALE_LINE_MS,
  legOddsAgeLabel,
  legOddsAgeMs,
  legOddsAgeTone,
} from "@/lib/odds/oddsAge";
import type { ArbitrageOpportunity } from "@/lib/odds/types";
import { arbVenueKindLabel, classifyArbVenue } from "@/lib/odds/venues";
import { awayAtHomeLabel, shortTeamName } from "@/lib/teamDisplay";
import { fonts } from "@/theme/typography";

function initOddsInputs(quote: EventQuote): Record<"home" | "away", string> {
  const home = quote.legs.find((l) => l.side === "home");
  const away = quote.legs.find((l) => l.side === "away");
  return {
    home: home ? formatAmerican(home.american) : "",
    away: away ? formatAmerican(away.american) : "",
  };
}

function ageColor(tone: ReturnType<typeof legOddsAgeTone>, manual: boolean) {
  if (manual) return "#A1A1AA";
  if (tone === "stale") return "#F87171";
  if (tone === "warning") return "rgba(252,211,77,0.9)";
  return "#71717A";
}

function profitColor(active: boolean) {
  return active ? "#34D399" : "#FCA5A5";
}

export function ArbitrageOpportunityCard({
  quote: feedQuote,
  targetTotalStake,
  nowMs,
  recalculating,
  recalcError,
  loggingBet,
  betLogged,
  logError,
  expanded,
  onExpandedChange,
  onRecalculate,
  onLogBet,
}: {
  quote: EventQuote;
  originalQuote: EventQuote;
  targetTotalStake: number;
  nowMs: number;
  recalculating: boolean;
  recalcError?: string;
  loggingBet: boolean;
  betLogged: boolean;
  logError?: string | null;
  expanded: boolean;
  onExpandedChange: (next: boolean) => void;
  onRecalculate: () => void;
  onLogBet: (arb: ArbitrageOpportunity) => Promise<boolean>;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [logConfirmOpen, setLogConfirmOpen] = useState(false);
  const [manualQuote, setManualQuote] = useState<EventQuote | null>(null);
  const [manualOdds, setManualOdds] = useState(() => initOddsInputs(feedQuote));
  const [manualError, setManualError] = useState<string | null>(null);

  const usingManualOdds = Boolean(manualQuote);
  const displayQuote = manualQuote ?? feedQuote;
  const expired = !displayQuote.stillArbitrage;
  const currentRoi = quoteRoiPercent(displayQuote);
  const feedSyncKey = `${feedQuote.fetchedAt}-${feedQuote.guaranteedProfit}-${feedQuote.totalStake}`;
  const isLive = new Date(displayQuote.commenceTime).getTime() <= nowMs;
  const arbTypeLabel = arbVenueKindLabel(classifyArbVenue(displayQuote.legs));
  const tone = profitColor(displayQuote.stillArbitrage);
  const homeTeam =
    displayQuote.legs.find((l) => l.side === "home")?.teamName ?? "";
  const awayTeam =
    displayQuote.legs.find((l) => l.side === "away")?.teamName ?? "";
  const stale = displayQuote.legs.some(
    (leg) =>
      !usingManualOdds &&
      legOddsAgeMs(leg, displayQuote.fetchedAt, nowMs) > STALE_LINE_MS
  );

  const logPayload = useMemo((): ArbitrageOpportunity => {
    return {
      eventId: displayQuote.eventId,
      sportKey: displayQuote.sportKey,
      sportTitle: displayQuote.sportTitle,
      commenceTime: displayQuote.commenceTime,
      matchup: displayQuote.matchup,
      homeTeam,
      awayTeam,
      impliedProbabilitySum: displayQuote.impliedProbabilitySum,
      legs: displayQuote.legs,
      totalStake: displayQuote.totalStake,
      guaranteedProfit: displayQuote.guaranteedProfit,
    };
  }, [displayQuote, homeTeam, awayTeam]);

  function applyManualOdds() {
    const homeAmerican = parseAmericanInput(manualOdds.home);
    const awayAmerican = parseAmericanInput(manualOdds.away);
    if (homeAmerican === null || awayAmerican === null) {
      setManualError("Enter American odds for both legs (e.g. +150 or -110).");
      return;
    }
    const result = quoteFromManualOdds(
      feedQuote,
      { home: homeAmerican, away: awayAmerican },
      targetTotalStake
    );
    if ("error" in result) {
      setManualError(result.error);
      setManualQuote(null);
      return;
    }
    setManualError(null);
    setManualQuote(result.quote);
  }

  async function confirmLogBet() {
    return onLogBet(logPayload);
  }

  function openLogConfirm() {
    const fromDetails = detailsOpen;
    setDetailsOpen(false);
    if (fromDetails) {
      setTimeout(() => setLogConfirmOpen(true), 50);
      return;
    }
    setLogConfirmOpen(true);
  }

  return (
    <View style={[styles.card, expired ? styles.cardExpired : null]}>
      <View style={expanded ? styles.headerExpanded : null}>
        <View style={styles.pillRow}>
          <View style={styles.pills}>
            {isLive ? <LivePill /> : null}
            <SportPill label={displayQuote.sportTitle} />
            {expired ? <StatusBadge /> : null}
          </View>
          <Pressable
            accessibilityLabel={expanded ? "Collapse arb details" : "Expand arb details"}
            onPress={() => onExpandedChange(!expanded)}
            style={styles.chevronBtn}
          >
            <View style={expanded ? styles.chevronOpen : null}>
              <Svg fill="#A1A1AA" height={16} viewBox="0 0 20 20" width={16}>
                <Path
                  clipRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                  fillRule="evenodd"
                />
              </Svg>
            </View>
          </Pressable>
        </View>

        <View style={{ marginTop: 12 }}>
          <MatchupHero
            align="center"
            awayTeam={awayTeam}
            homeTeam={homeTeam}
            sportKey={displayQuote.sportKey}
            subline={formatLocalDateTime(displayQuote.commenceTime)}
          />
        </View>

        <View style={styles.typeWrap}>
          <ArbTypeBadge label={arbTypeLabel} />
        </View>

        <View style={styles.metrics}>
          <HeaderMetric label="ROI" tone={tone}>
            <AnimatedNumber
              format="percent-2"
              resetKey={feedSyncKey}
              style={[styles.metricValue, { color: tone }]}
              value={currentRoi}
            />
          </HeaderMetric>
          <HeaderMetric align="end" label="Profit" tone={tone}>
            <View style={styles.metricRow}>
              {displayQuote.guaranteedProfit >= 0 ? (
                <Text style={[styles.metricValue, { color: tone }]}>+</Text>
              ) : null}
              <AnimatedNumber
                delayMs={60}
                format="currency-2"
                resetKey={feedSyncKey}
                style={[styles.metricValue, { color: tone }]}
                value={displayQuote.guaranteedProfit}
              />
            </View>
          </HeaderMetric>
        </View>

        <MobileArbLegRows quote={displayQuote} resetKey={feedSyncKey} />
      </View>

      {expanded ? (
        <View style={styles.expanded}>
          <PayoutPanel
            profit={displayQuote.guaranteedProfit}
            resetKey={feedSyncKey}
            roi={currentRoi}
            tone={tone}
            totalStake={displayQuote.totalStake}
          />
          <View style={styles.actions}>
            <View style={styles.actionsLeft}>
              <Pressable onPress={() => setDetailsOpen(true)} style={styles.secondaryBtn}>
                <Text style={styles.secondaryBtnText}>View details</Text>
              </Pressable>
              <Pressable
                disabled={recalculating}
                onPress={onRecalculate}
                style={[styles.secondaryBtn, recalculating ? styles.btnDisabled : null]}
              >
                <Text style={styles.secondaryBtnText}>
                  {recalculating ? "Recalculating…" : "Recalculate"}
                </Text>
              </Pressable>
            </View>
            {displayQuote.stillArbitrage ? (
              <Pressable
                disabled={loggingBet || betLogged}
                onPress={openLogConfirm}
                style={[
                  styles.logBtn,
                  betLogged ? styles.logBtnDone : null,
                  loggingBet || betLogged ? styles.btnDisabled : null,
                ]}
              >
                <BookmarkIcon />
                <Text style={styles.logBtnText}>
                  {loggingBet ? "Logging…" : betLogged ? "Logged" : "Log bet"}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}

      {recalcError ? <Text style={styles.recalcError}>{recalcError}</Text> : null}

      <Modal
        animationType="fade"
        onRequestClose={() => setDetailsOpen(false)}
        transparent
        visible={detailsOpen}
      >
        <View style={styles.modalRoot}>
          <Pressable
            onPress={() => setDetailsOpen(false)}
            style={styles.modalBackdrop}
          />
          <View style={styles.modalDialog}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Arbitrage details</Text>
                <Text style={styles.modalSub}>
                  {shortTeamName(awayTeam)} @ {shortTeamName(homeTeam)} ·{" "}
                  {displayQuote.sportTitle}
                </Text>
              </View>
              <Pressable
                accessibilityLabel="Close"
                onPress={() => setDetailsOpen(false)}
                style={styles.closeBtn}
              >
                <Svg fill="none" height={16} viewBox="0 0 24 24" width={16}>
                  <Path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="#A1A1AA"
                    strokeLinecap="round"
                    strokeWidth={2}
                  />
                </Svg>
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.modalBody}>
              <ArbDetailsHero
                arbTypeLabel={arbTypeLabel}
                awayTeam={awayTeam}
                homeTeam={homeTeam}
                isLive={isLive}
                kickoff={formatLocalDateTime(displayQuote.commenceTime)}
                profit={displayQuote.guaranteedProfit}
                resetKey={feedSyncKey}
                roi={currentRoi}
                sportKey={displayQuote.sportKey}
                sportTitle={displayQuote.sportTitle}
                tone={tone}
                totalStake={displayQuote.totalStake}
              />

              {stale ? (
                <View style={styles.staleBanner}>
                  <View style={styles.staleBang}>
                    <Text style={styles.staleBangText}>!</Text>
                  </View>
                  <Text style={styles.staleText}>
                    Odds may be stale — recalculate from the board or use manual
                    odds before placing bets.
                  </Text>
                </View>
              ) : null}

              <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Place each leg</Text>
              <View style={styles.detailLegs}>
                {displayQuote.legs.map((leg) => {
                  const toneAge = usingManualOdds
                    ? "unknown"
                    : legOddsAgeTone(leg, displayQuote.fetchedAt, nowMs);
                  const url = getBookSportsbookUrl(
                    leg.bookKey,
                    displayQuote.sportKey,
                    leg.deepLink
                  );
                  const overLimit = stakeExceedsBetLimit(leg.stake, leg.betLimit);
                  const limitCaption = exchangeBetLimitCaption({
                    bookKey: leg.bookKey,
                    betLimit: leg.betLimit,
                    stake: leg.stake,
                    compact: true,
                  });
                  return (
                    <View key={leg.side} style={styles.detailLeg}>
                      <LegRow
                        leg={leg}
                        overLimit={overLimit}
                        resetKey={feedSyncKey}
                        limitCaption={limitCaption}
                      />
                      <View style={styles.detailLegFooter}>
                        <Text
                          style={[
                            styles.ageLabel,
                            { color: ageColor(toneAge, usingManualOdds) },
                          ]}
                        >
                          {usingManualOdds
                            ? "entered manually"
                            : legOddsAgeLabel(leg, displayQuote.fetchedAt, nowMs)}
                        </Text>
                        {url ? (
                          <Pressable
                            onPress={() => void Linking.openURL(url)}
                            style={styles.openBtn}
                          >
                            <Text style={styles.openBtnText}>Open</Text>
                          </Pressable>
                        ) : null}
                      </View>
                    </View>
                  );
                })}
              </View>
              </View>

              <View style={styles.manualCard}>
                <View style={styles.manualHead}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.manualTitle}>Manual odds</Text>
                    <Text style={styles.manualHint}>
                      Enter prices from your sportsbooks
                    </Text>
                  </View>
                  {usingManualOdds ? (
                    <View style={styles.activePill}>
                      <Text style={styles.activePillText}>Active</Text>
                    </View>
                  ) : null}
                </View>
                {(["home", "away"] as const).map((side) => {
                  const leg = feedQuote.legs.find((item) => item.side === side);
                  if (!leg) return null;
                  return (
                    <View key={`manual-${side}`} style={styles.manualRow}>
                      <BookLogo
                        bookKey={leg.bookKey}
                        bookTitle={leg.bookTitle}
                        size={18}
                      />
                      <View style={styles.manualCopy}>
                        <Text numberOfLines={1} style={styles.manualTeam}>
                          {shortTeamName(leg.teamName)}
                        </Text>
                        <Text numberOfLines={1} style={styles.manualBook}>
                          {leg.bookTitle}
                        </Text>
                      </View>
                      <TextInput
                        keyboardType="numbers-and-punctuation"
                        onChangeText={(value) => {
                          setManualOdds((prev) => ({ ...prev, [side]: value }));
                          setManualError(null);
                        }}
                        placeholder="+150"
                        placeholderTextColor="#52525B"
                        style={styles.manualInput}
                        value={manualOdds[side]}
                      />
                      <View style={styles.feedCol}>
                        <Text style={styles.feedLabel}>Feed</Text>
                        <Text style={styles.feedValue}>
                          {formatAmerican(leg.american)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
                <View style={styles.manualFoot}>
                  <Text style={styles.manualFootText} numberOfLines={1}>
                    {manualError ?? "Applies to ROI, profit, and stakes above"}
                  </Text>
                  <View style={styles.manualActions}>
                    {usingManualOdds ? (
                      <Pressable
                        onPress={() => {
                          setManualQuote(null);
                          setManualOdds(initOddsInputs(feedQuote));
                          setManualError(null);
                        }}
                        style={styles.secondaryBtn}
                      >
                        <Text style={styles.secondaryBtnText}>Use feed</Text>
                      </Pressable>
                    ) : null}
                    <Pressable onPress={applyManualOdds} style={styles.applyBtn}>
                      <Text style={styles.logBtnText}>Apply</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </ScrollView>
            <View style={styles.modalFooter}>
              <Pressable
                disabled={recalculating}
                onPress={onRecalculate}
                style={[styles.secondaryBtn, styles.modalFooterBtn]}
              >
                <Text style={styles.secondaryBtnText}>
                  {recalculating ? "Recalculating…" : "Recalculate"}
                </Text>
              </Pressable>
              {displayQuote.stillArbitrage ? (
                <Pressable
                  disabled={loggingBet || betLogged}
                  onPress={openLogConfirm}
                  style={[
                    styles.logBtn,
                    styles.modalFooterBtn,
                    betLogged ? styles.logBtnDone : null,
                    loggingBet || betLogged ? styles.btnDisabled : null,
                  ]}
                >
                  <BookmarkIcon />
                  <Text style={styles.logBtnText}>
                    {loggingBet ? "Logging…" : betLogged ? "Logged" : "Log bet"}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        </View>
      </Modal>

      <LogBetConfirmModal
        error={logError}
        loading={loggingBet}
        matchup={awayAtHomeLabel(awayTeam, homeTeam)}
        onClose={() => setLogConfirmOpen(false)}
        onConfirm={confirmLogBet}
        open={logConfirmOpen}
        profit={displayQuote.guaranteedProfit}
        stake={displayQuote.totalStake}
      />
    </View>
  );
}

function BookmarkIcon() {
  return (
    <Svg fill="#FFFFFF" height={14} viewBox="0 0 20 20" width={14}>
      <Path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
    </Svg>
  );
}

function LogBetConfirmModal({
  open,
  matchup,
  stake,
  profit,
  loading,
  error,
  onClose,
  onConfirm,
}: {
  open: boolean;
  matchup: string;
  stake: number;
  profit: number;
  loading: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: () => boolean | void | Promise<boolean | void>;
}) {
  const stakeLabel = `$${stake.toLocaleString("en-US", {
    maximumFractionDigits: 0,
  })}`;

  async function handleConfirm() {
    try {
      const result = await onConfirm();
      if (result === true) onClose();
    } catch {
      // Keep open so the user can retry, same as web ConfirmModal.
    }
  }

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={open}>
      <View style={styles.confirmRoot}>
        <Pressable disabled={loading} onPress={onClose} style={styles.modalBackdrop} />
        <View style={styles.confirmCard}>
          <Text style={styles.confirmTitle}>Log this bet?</Text>
          <Text style={styles.confirmCopy}>
            Add <Text style={styles.confirmStrong}>{matchup}</Text> to My Bets with
            a <Text style={styles.confirmStrong}>{stakeLabel}</Text> total wager
            {profit > 0 ? (
              <>
                {" "}
                and{" "}
                <Text style={styles.confirmProfit}>+${profit.toFixed(2)}</Text>{" "}
                guaranteed profit
              </>
            ) : null}
            .
          </Text>
          {error ? <Text style={styles.confirmError}>{error}</Text> : null}
          <View style={styles.confirmActions}>
            <Pressable
              disabled={loading}
              onPress={onClose}
              style={[styles.confirmCancel, loading ? styles.btnDisabled : null]}
            >
              <Text style={styles.confirmCancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              disabled={loading}
              onPress={() => void handleConfirm()}
              style={[styles.confirmOk, loading ? styles.btnDisabled : null]}
            >
              <Text style={styles.confirmOkText}>{loading ? "…" : "Log bet"}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function LivePill() {
  return (
    <View style={styles.livePill}>
      <View style={styles.liveDot} />
      <Text style={styles.livePillText}>Live</Text>
    </View>
  );
}

function SportPill({ label }: { label: string }) {
  return (
    <View style={styles.sportPill}>
      <Text style={styles.sportPillText}>{label}</Text>
    </View>
  );
}

function StatusBadge() {
  return (
    <View style={styles.expiredPill}>
      <Text style={styles.expiredPillText}>Expired</Text>
    </View>
  );
}

function ArbTypeBadge({ label }: { label: string }) {
  return (
    <View style={styles.typeBadge}>
      <Text style={styles.typeBadgeText}>{label}</Text>
    </View>
  );
}

function HeaderMetric({
  label,
  children,
  align = "start",
}: {
  label: string;
  children: ReactNode;
  align?: "start" | "end";
  tone: string;
}) {
  return (
    <View style={[styles.metric, align === "end" ? styles.metricEnd : null]}>
      <Text style={styles.metricLabel}>{label}</Text>
      {children}
    </View>
  );
}

function MobileArbLegRows({
  quote,
  resetKey,
}: {
  quote: EventQuote;
  resetKey: string;
}) {
  return (
    <View style={styles.legs}>
      {quote.legs.map((leg, index) => {
        const overLimit = stakeExceedsBetLimit(leg.stake, leg.betLimit);
        const limitCaption = exchangeBetLimitCaption({
          bookKey: leg.bookKey,
          betLimit: leg.betLimit,
          stake: leg.stake,
          compact: true,
        });
        return (
          <LegRow
            key={leg.side}
            last={index === quote.legs.length - 1}
            leg={leg}
            limitCaption={limitCaption}
            overLimit={overLimit}
            resetKey={resetKey}
          />
        );
      })}
    </View>
  );
}

function LegRow({
  leg,
  overLimit,
  resetKey,
  limitCaption,
  last,
}: {
  leg: EventQuote["legs"][number];
  overLimit: boolean;
  resetKey: string;
  limitCaption: string | null;
  last?: boolean;
}) {
  return (
    <View style={[styles.legRow, last ? styles.legRowLast : null]}>
      <View style={styles.legBook}>
        <View style={styles.legBookTitle}>
          <BookLogo bookKey={leg.bookKey} bookTitle={leg.bookTitle} size={20} />
          <Text numberOfLines={1} style={styles.bookTitle}>
            {leg.bookTitle}
          </Text>
        </View>
        {limitCaption ? (
          <Text
            numberOfLines={1}
            style={[styles.limitCaption, overLimit ? styles.limitOver : null]}
          >
            {limitCaption}
          </Text>
        ) : null}
      </View>
      <Text numberOfLines={1} style={styles.legOdds}>
        <Text style={styles.legTeam}>{shortTeamName(leg.teamName)} </Text>
        <Text style={styles.legAmerican}>{formatAmerican(leg.american)}</Text>
      </Text>
      <AnimatedNumber
        format="currency-2"
        resetKey={resetKey}
        style={[styles.legStake, overLimit ? styles.limitOver : null]}
        value={leg.stake}
      />
    </View>
  );
}

function PayoutPanel({
  totalStake,
  profit,
  roi,
  resetKey,
  tone,
}: {
  totalStake: number;
  profit: number;
  roi: number;
  resetKey: string;
  tone: string;
}) {
  return (
    <View style={styles.payout}>
      <Text style={styles.payoutTitle}>Payout (if both bet)</Text>
      <View style={styles.payoutRow}>
        <Text style={styles.payoutLabel}>Total wager</Text>
        <AnimatedNumber
          format="currency-2"
          resetKey={resetKey}
          style={styles.payoutValue}
          value={totalStake}
        />
      </View>
      <View style={styles.payoutRow}>
        <Text style={styles.payoutLabel}>Total return</Text>
        <Text style={styles.payoutValue}>
          ${(totalStake + profit).toFixed(2)}
        </Text>
      </View>
      <View style={[styles.payoutRow, styles.payoutProfit]}>
        <Text style={styles.payoutLabel}>Profit</Text>
        <View style={styles.metricRow}>
          {profit >= 0 ? (
            <Text style={[styles.payoutProfitValue, { color: tone }]}>+</Text>
          ) : null}
          <AnimatedNumber
            format="currency-2"
            resetKey={resetKey}
            style={[styles.payoutProfitValue, { color: tone }]}
            value={profit}
          />
          <Text style={[styles.payoutRoi, { color: tone }]}>
            {" "}
            ({roi.toFixed(2)}%)
          </Text>
        </View>
      </View>
    </View>
  );
}

function ArbDetailsHero({
  isLive,
  sportTitle,
  arbTypeLabel,
  homeTeam,
  awayTeam,
  sportKey,
  kickoff,
  roi,
  profit,
  totalStake,
  tone,
  resetKey,
}: {
  isLive: boolean;
  sportTitle: string;
  arbTypeLabel: string;
  homeTeam: string;
  awayTeam: string;
  sportKey: string;
  kickoff: string;
  roi: number;
  profit: number;
  totalStake: number;
  tone: string;
  resetKey: string;
}) {
  return (
    <View style={styles.hero}>
      <View style={styles.heroHead}>
        <View style={styles.heroTop}>
          <View style={styles.pills}>
            {isLive ? <LivePill /> : null}
            <SportPill label={sportTitle} />
          </View>
          <ArbTypeBadge label={arbTypeLabel} />
        </View>
        <View>
          <MatchupHero
            align="center"
            awayTeam={awayTeam}
            homeTeam={homeTeam}
            sportKey={sportKey}
            subline={kickoff}
          />
        </View>
      </View>
      <View style={styles.heroStats}>
        <View style={styles.heroStat}>
          <Text style={styles.heroStatLabel}>ROI</Text>
          <Text style={[styles.heroStatValue, { color: tone }]}>
            {roi.toFixed(2)}%
          </Text>
        </View>
        <View style={[styles.heroStat, styles.heroStatMid]}>
          <Text style={styles.heroStatLabel}>Profit</Text>
          <View style={styles.metricRow}>
            {profit >= 0 ? (
              <Text style={[styles.heroStatValue, { color: tone }]}>+</Text>
            ) : null}
            <AnimatedNumber
              format="currency-2"
              resetKey={resetKey}
              style={[styles.heroStatValue, { color: tone }]}
              value={profit}
            />
          </View>
        </View>
        <View style={styles.heroStat}>
          <Text style={styles.heroStatLabel}>Wager</Text>
          <Text style={[styles.heroStatValue, { color: "#FFFFFF" }]}>
            ${Math.round(totalStake).toLocaleString("en-US")}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#161616",
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
  },
  cardExpired: {
    borderColor: "rgba(239,68,68,0.3)",
    backgroundColor: "#09090B",
  },
  headerExpanded: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  pillRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  pills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    flex: 1,
  },
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    backgroundColor: "rgba(16,185,129,0.15)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.3)",
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#34D399",
  },
  livePillText: {
    fontFamily: fonts.sansBold,
    color: "#6EE7B7",
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  sportPill: {
    borderRadius: 999,
    backgroundColor: "rgba(39,39,42,0.9)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  sportPillText: {
    fontFamily: fonts.sansSemiBold,
    color: "#D4D4D8",
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  expiredPill: {
    borderRadius: 999,
    backgroundColor: "rgba(239,68,68,0.15)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.25)",
  },
  expiredPillText: {
    fontFamily: fonts.sansSemiBold,
    color: "#FCA5A5",
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  chevronBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  chevronOpen: {
    transform: [{ rotate: "180deg" }],
  },
  typeWrap: {
    marginTop: 10,
    alignItems: "center",
  },
  typeBadge: {
    borderRadius: 999,
    backgroundColor: "rgba(16,185,129,0.1)",
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.25)",
  },
  typeBadgeText: {
    fontFamily: fonts.sansBold,
    color: "#34D399",
    fontSize: 9,
    letterSpacing: 0.9,
    textTransform: "uppercase",
  },
  metrics: {
    marginTop: 16,
    flexDirection: "row",
    gap: 16,
  },
  metric: {
    flex: 1,
  },
  metricEnd: {
    alignItems: "flex-end",
  },
  metricLabel: {
    fontFamily: fonts.sansMedium,
    color: "#71717A",
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  metricRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  metricValue: {
    marginTop: 4,
    fontFamily: fonts.displayBold,
    fontSize: 24,
    lineHeight: 24,
    fontVariant: ["tabular-nums"],
  },
  legs: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  legRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  legRowLast: {
    borderBottomWidth: 0,
  },
  legBook: {
    flex: 1,
    minWidth: 0,
  },
  legBookTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bookTitle: {
    flex: 1,
    fontFamily: fonts.sansMedium,
    color: "#FFFFFF",
    fontSize: 14,
  },
  limitCaption: {
    marginTop: 2,
    fontFamily: fonts.sansRegular,
    color: "#71717A",
    fontSize: 9,
  },
  limitOver: {
    color: "#F87171",
  },
  legOdds: {
    flex: 1,
    textAlign: "center",
    fontFamily: fonts.displaySemiBold,
    fontSize: 14,
  },
  legTeam: {
    color: "#FFFFFF",
  },
  legAmerican: {
    color: "#34D399",
  },
  legStake: {
    fontFamily: fonts.sansSemiBold,
    color: "#FFFFFF",
    fontSize: 14,
    fontVariant: ["tabular-nums"],
  },
  expanded: {
    marginTop: 16,
    gap: 16,
  },
  payout: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#111111",
    padding: 16,
    gap: 10,
  },
  payoutTitle: {
    fontFamily: fonts.sansSemiBold,
    color: "#FFFFFF",
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  payoutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  payoutProfit: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
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
  payoutProfitValue: {
    fontFamily: fonts.sansBold,
    fontSize: 16,
    fontVariant: ["tabular-nums"],
  },
  payoutRoi: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    opacity: 0.8,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  actionsLeft: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    flex: 1,
  },
  secondaryBtn: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#52525B",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  secondaryBtnText: {
    fontFamily: fonts.sansMedium,
    color: "#E4E4E7",
    fontSize: 12,
    textAlign: "center",
  },
  logBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 8,
    backgroundColor: "#059669",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  logBtnDone: {
    backgroundColor: "rgba(6,95,70,0.8)",
  },
  logBtnText: {
    fontFamily: fonts.sansMedium,
    color: "#FFFFFF",
    fontSize: 12,
  },
  applyBtn: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#059669",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  recalcError: {
    marginTop: 8,
    fontFamily: fonts.sansRegular,
    color: "#F87171",
    fontSize: 12,
  },
  modalRoot: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 32,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  modalDialog: {
    width: "100%",
    maxWidth: 576,
    maxHeight: "90%",
    alignSelf: "center",
    borderRadius: 16,
    backgroundColor: "#09090B",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  modalTitle: {
    fontFamily: fonts.displaySemiBold,
    color: "#FFFFFF",
    fontSize: 18,
  },
  modalSub: {
    marginTop: 4,
    fontFamily: fonts.sansRegular,
    color: "#A1A1AA",
    fontSize: 14,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(63,63,70,0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBody: {
    padding: 20,
    gap: 20,
    paddingBottom: 24,
  },
  hero: {
    overflow: "hidden",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#141414",
  },
  heroHead: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
    gap: 12,
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  heroStats: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  heroStat: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 4,
  },
  heroStatMid: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.06)",
  },
  heroStatLabel: {
    fontFamily: fonts.sansSemiBold,
    color: "#71717A",
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  heroStatValue: {
    marginTop: 4,
    fontFamily: fonts.displayBold,
    fontSize: 20,
    lineHeight: 24,
    fontVariant: ["tabular-nums"],
  },
  staleBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.25)",
    backgroundColor: "rgba(245,158,11,0.1)",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  staleBang: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "rgba(251,191,36,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  staleBangText: {
    fontFamily: fonts.sansBold,
    color: "#FDE68A",
    fontSize: 11,
  },
  staleText: {
    flex: 1,
    fontFamily: fonts.sansRegular,
    color: "#FEF3C7",
    fontSize: 12,
    lineHeight: 18,
  },
  sectionTitle: {
    fontFamily: fonts.sansSemiBold,
    color: "#71717A",
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  detailSection: {
    gap: 10,
  },
  detailLegs: {
    overflow: "hidden",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#111111",
  },
  detailLeg: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  detailLegFooter: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ageLabel: {
    fontFamily: fonts.sansRegular,
    fontSize: 10,
  },
  openBtn: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.3)",
    backgroundColor: "rgba(16,185,129,0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  openBtnText: {
    fontFamily: fonts.sansSemiBold,
    color: "#A7F3D0",
    fontSize: 11,
  },
  manualCard: {
    overflow: "hidden",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#111111",
  },
  manualHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  manualTitle: {
    fontFamily: fonts.sansMedium,
    color: "#FFFFFF",
    fontSize: 14,
  },
  manualHint: {
    fontFamily: fonts.sansRegular,
    color: "#71717A",
    fontSize: 10,
  },
  activePill: {
    borderRadius: 999,
    backgroundColor: "rgba(245,158,11,0.15)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.25)",
  },
  activePillText: {
    fontFamily: fonts.sansSemiBold,
    color: "#FDE68A",
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  manualRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  manualCopy: {
    flex: 1,
    minWidth: 0,
  },
  manualTeam: {
    fontFamily: fonts.sansMedium,
    color: "#FFFFFF",
    fontSize: 14,
  },
  manualBook: {
    fontFamily: fonts.sansRegular,
    color: "#71717A",
    fontSize: 10,
  },
  manualInput: {
    width: 84,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#3F3F46",
    backgroundColor: "#09090B",
    color: "#FFFFFF",
    paddingHorizontal: 8,
    textAlign: "right",
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    fontVariant: ["tabular-nums"],
  },
  feedCol: {
    width: 44,
    alignItems: "flex-end",
  },
  feedLabel: {
    fontFamily: fonts.sansSemiBold,
    color: "#52525B",
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  feedValue: {
    fontFamily: fonts.sansMedium,
    color: "#71717A",
    fontSize: 11,
    fontVariant: ["tabular-nums"],
  },
  manualFoot: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(9,9,11,0.4)",
  },
  manualFootText: {
    flex: 1,
    fontFamily: fonts.sansRegular,
    color: "#71717A",
    fontSize: 10,
  },
  manualActions: {
    flexDirection: "row",
    gap: 8,
  },
  modalFooter: {
    flexDirection: "row",
    gap: 8,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(9,9,11,0.6)",
  },
  modalFooterBtn: {
    flex: 1,
  },
  confirmRoot: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  confirmCard: {
    width: "100%",
    maxWidth: 448,
    alignSelf: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#09090B",
    padding: 24,
  },
  confirmTitle: {
    fontFamily: fonts.displaySemiBold,
    color: "#FFFFFF",
    fontSize: 20,
  },
  confirmCopy: {
    marginTop: 8,
    fontFamily: fonts.sansRegular,
    color: "#A1A1AA",
    fontSize: 14,
    lineHeight: 20,
  },
  confirmError: {
    marginTop: 12,
    fontFamily: fonts.sansRegular,
    color: "#F87171",
    fontSize: 13,
    lineHeight: 18,
  },
  confirmStrong: {
    fontFamily: fonts.sansMedium,
    color: "#E4E4E7",
  },
  confirmProfit: {
    fontFamily: fonts.sansMedium,
    color: "#34D399",
  },
  confirmActions: {
    marginTop: 24,
    flexDirection: "row",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    gap: 12,
  },
  confirmCancel: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  confirmCancelText: {
    fontFamily: fonts.sansBold,
    color: "#D4D4D8",
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  confirmOk: {
    borderRadius: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  confirmOkText: {
    fontFamily: fonts.sansBold,
    color: "#FFFFFF",
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
});
