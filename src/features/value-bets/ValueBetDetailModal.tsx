import { useState } from "react";
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
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import { router } from "expo-router";
import { BookLogo } from "@/components/BookLogo";
import { americanPayout, probabilityToAmerican } from "@/lib/odds/american";
import {
  exchangeBetLimitCaption,
  stakeExceedsBetLimit,
} from "@/lib/odds/betLimits";
import { getBookSportsbookUrl } from "@/lib/bookmakerLinks";
import { formatAmerican } from "@/lib/format";
import type { LineShopPick } from "@/lib/odds/types";
import type { PickEliteInsights } from "@/lib/valueBets/engineEliteInsights";
import {
  formatSignedPercent,
  primaryEvPercent,
  sportLeagueLabel,
} from "@/lib/valueBets/format";
import {
  valueBetTableBlurb,
  valueBetWhyBullets,
} from "@/lib/valueBets/valueBetCopy";
import { shortTeamName } from "@/lib/teamDisplay";
import { fonts } from "@/theme/typography";

/**
 * Mobile details dialog — mirrors web `ValueBetDetailPanel` layout="modal".
 */
export function ValueBetDetailModal({
  open,
  pick,
  elite,
  insights,
  showEngineInsights,
  nowMs,
  stakeInput,
  onStakeChange,
  onLogPick,
  loggingPick,
  pickLogged,
  strictLive = true,
  onClose,
}: {
  open: boolean;
  pick: LineShopPick | null;
  elite: boolean;
  insights: PickEliteInsights | null;
  showEngineInsights: boolean;
  nowMs: number;
  stakeInput: string;
  onStakeChange: (value: string) => void;
  onLogPick: () => void;
  loggingPick: boolean;
  pickLogged: boolean;
  strictLive?: boolean;
  onClose: () => void;
}) {
  if (!pick || !insights) {
    return (
      <Modal animationType="fade" onRequestClose={onClose} transparent visible={open}>
        <View style={styles.root} />
      </Modal>
    );
  }

  const isLive = new Date(pick.commenceTime).getTime() <= nowMs;
  const stakeNum = Number(stakeInput);
  const stake =
    Number.isFinite(stakeNum) && stakeNum > 0 ? stakeNum : undefined;
  const stakeForMath = stake ?? 100;
  const ev = primaryEvPercent(pick);
  const modelPct = insights.modelWinProbability;
  const marketPct = insights.marketImpliedProbability;
  const gap = modelPct - marketPct;
  const opponent =
    pick.teamName === pick.homeTeam ? pick.awayTeam : pick.homeTeam;
  const opponentWin = Number.isFinite(modelPct)
    ? Math.max(0, 100 - modelPct)
    : 0;
  const fairAmerican = probabilityToAmerican(modelPct);
  const lead = valueBetTableBlurb(
    pick,
    insights,
    ev,
    isLive,
    showEngineInsights
  );
  const whyBullets = valueBetWhyBullets(
    pick,
    insights,
    ev,
    isLive,
    elite && showEngineInsights
  );
  const payoutIfWin = americanPayout(stakeForMath, pick.bestLine.american);
  const expectedValueDollars = (ev / 100) * stakeForMath;
  const bookUrl = getBookSportsbookUrl(
    pick.bestLine.bookKey,
    pick.sportKey,
    pick.bestLine.deepLink
  );

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={open}>
      <View style={styles.root}>
        <Pressable onPress={onClose} style={styles.backdrop} />
        <View style={styles.dialog}>
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>Value bet details</Text>
              <Text numberOfLines={1} style={styles.subtitle}>
                {shortTeamName(pick.awayTeam)} @ {shortTeamName(pick.homeTeam)}{" "}
                · {sportLeagueLabel(pick.sportTitle)}
              </Text>
            </View>
            <Pressable
              accessibilityLabel="Close"
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeBtn,
                pressed ? styles.pressed : null,
              ]}
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

          <ScrollView
            contentContainerStyle={styles.body}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.section}>
              <View style={styles.heroRow}>
                <Text style={styles.heroTeam}>
                  {shortTeamName(pick.teamName)}{" "}
                  <Text style={styles.heroOdds}>
                    {formatAmerican(pick.bestLine.american)}
                  </Text>
                </Text>
                <Text style={styles.heroEv}>{formatSignedPercent(ev)}</Text>
              </View>
              <Text style={styles.lead}>{lead}</Text>
              {isLive ? (
                <Text style={styles.liveNote}>
                  Live Value Bet is priced vs sharp fair odds
                  {strictLive
                    ? " — near-decided moneylines are hidden."
                    : " — Strict live safety is off."}
                </Text>
              ) : null}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Why it's a value bet</Text>
              <View style={styles.bulletList}>
                {whyBullets.map((item) => (
                  <View key={item} style={styles.bulletRow}>
                    <View style={styles.check}>
                      <Text style={styles.checkMark}>✓</Text>
                    </View>
                    <Text style={styles.bulletText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Probability comparison</Text>
              {elite && showEngineInsights ? (
                <View style={styles.probBlock}>
                  <ProbBar
                    label={`Our model (${shortTeamName(pick.teamName)})`}
                    tone="emerald"
                    value={modelPct}
                  />
                  <ProbBar
                    label="Market implied"
                    tone="zinc"
                    value={marketPct}
                  />
                  <Text style={styles.diffLine}>
                    Difference{" "}
                    <Text
                      style={gap >= 0 ? styles.diffPos : styles.diffNeg}
                    >
                      {gap >= 0 ? "+" : ""}
                      {gap.toFixed(1)}%
                    </Text>
                    {fairAmerican !== 0 ? (
                      <>
                        {" "}
                        · Fair odds{" "}
                        <Text style={styles.fairInline}>
                          {formatAmerican(fairAmerican)}
                        </Text>
                      </>
                    ) : null}
                  </Text>
                </View>
              ) : (
                <Text style={styles.muted}>
                  Elite unlocks model vs market probability comparison.
                </Text>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Potential payout</Text>
              <View style={styles.payoutRows}>
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
                <View style={styles.payoutRow}>
                  <Text style={styles.payoutLabel}>Expected value</Text>
                  <Text
                    style={[
                      styles.payoutEv,
                      expectedValueDollars >= 0
                        ? styles.diffPos
                        : styles.diffNeg,
                    ]}
                  >
                    {expectedValueDollars >= 0 ? "+" : ""}$
                    {expectedValueDollars.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.payoutActions}>
                  <Pressable
                    disabled={loggingPick || pickLogged}
                    onPress={onLogPick}
                    style={({ pressed }) => [
                      styles.logBtn,
                      pickLogged ? styles.logBtnDone : null,
                      (loggingPick || pickLogged) && !pickLogged
                        ? styles.disabled
                        : null,
                      pressed && !loggingPick && !pickLogged
                        ? styles.pressed
                        : null,
                    ]}
                  >
                    <Ionicons
                      color="#FFFFFF"
                      name="bookmark-outline"
                      size={14}
                    />
                    <Text style={styles.logText}>
                      {loggingPick
                        ? "Logging…"
                        : pickLogged
                          ? "Logged"
                          : "Log pick"}
                    </Text>
                  </Pressable>
                  {bookUrl ? (
                    <Pressable
                      onPress={() => void Linking.openURL(bookUrl)}
                      style={({ pressed }) => [
                        styles.openBookBtn,
                        pressed ? styles.pressed : null,
                      ]}
                    >
                      <BookLogo
                        bookKey={pick.bestLine.bookKey}
                        bookTitle={pick.bestLine.bookTitle}
                        size={14}
                      />
                      <Text style={styles.openBookText}>
                        Open {pick.bestLine.bookTitle}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Model snapshot</Text>
              {elite && showEngineInsights ? (
                <View style={styles.snapshotBlock}>
                  <SnapshotRow
                    label={`${shortTeamName(pick.teamName)} win prob`}
                    value={`${modelPct.toFixed(1)}%`}
                  />
                  <SnapshotRow
                    label={`${shortTeamName(opponent)} win prob`}
                    value={`${opponentWin.toFixed(1)}%`}
                  />
                  <Pressable
                    onPress={() => {
                      onClose();
                      router.push("/(app)/(tabs)/model-predictions");
                    }}
                    style={({ pressed }) => [
                      styles.predLink,
                      pressed ? styles.pressed : null,
                    ]}
                  >
                    <Text style={styles.predLinkText}>
                      View full prediction →
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.snapshotBlock}>
                  <Text style={styles.muted}>
                    Elite unlocks the model snapshot for this matchup.
                  </Text>
                  <Pressable
                    onPress={() => {
                      onClose();
                      router.push("/(app)/(tabs)/model-predictions");
                    }}
                    style={({ pressed }) => [
                      styles.predLink,
                      pressed ? styles.pressed : null,
                    ]}
                  >
                    <Text style={styles.predLinkText}>
                      View Model Predictions →
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>

            <AllBooksSection pick={pick} stake={stake} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function ProbBar({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "emerald" | "zinc";
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <View style={styles.probBar}>
      <View style={styles.probBarLabels}>
        <Text numberOfLines={1} style={styles.probBarLabel}>
          {label}
        </Text>
        <Text style={styles.probBarValue}>{pct.toFixed(1)}%</Text>
      </View>
      <View style={styles.probTrack}>
        <View
          style={[
            styles.probFill,
            tone === "emerald" ? styles.probFillEmerald : styles.probFillZinc,
            { width: `${pct}%` },
          ]}
        />
      </View>
    </View>
  );
}

function SnapshotRow({
  label,
  value,
  valueStyle,
}: {
  label: string;
  value: string;
  valueStyle?: object;
}) {
  return (
    <View style={styles.snapshotRow}>
      <Text style={styles.snapshotLabel}>{label}</Text>
      <Text style={[styles.snapshotValue, valueStyle]}>{value}</Text>
    </View>
  );
}

function AllBooksSection({
  pick,
  stake,
}: {
  pick: LineShopPick;
  stake: number | undefined;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>All books</Text>
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        style={({ pressed }) => [
          styles.expandBooksBtn,
          pressed ? styles.pressed : null,
        ]}
      >
        <Text style={styles.expandBooksText}>
          {expanded
            ? "Hide all books"
            : `Show all ${pick.bookCount} books`}
        </Text>
      </Pressable>
      {expanded ? (
        <View style={styles.booksList}>
          {pick.lines.map((line) => {
            const isBest = line.rank === 1;
            const caption = exchangeBetLimitCaption({
              bookKey: line.bookKey,
              betLimit: line.betLimit,
              stake,
            });
            const overLimit = stakeExceedsBetLimit(stake, line.betLimit);
            return (
              <View
                key={`${line.bookKey}-${line.rank}`}
                style={[styles.bookRow, isBest ? styles.bookRowBest : null]}
              >
                <View style={styles.bookLeft}>
                  <Text
                    style={[
                      styles.bookRank,
                      isBest ? styles.bookRankBest : null,
                    ]}
                  >
                    {line.rank}
                  </Text>
                  <BookLogo
                    bookKey={line.bookKey}
                    bookTitle={line.bookTitle}
                    size={18}
                  />
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.bookTitle,
                      isBest ? styles.bookTitleBest : null,
                    ]}
                  >
                    {line.bookTitle}
                  </Text>
                </View>
                <View style={styles.bookRight}>
                  <Text
                    style={[
                      styles.bookOdds,
                      isBest ? styles.bookOddsBest : null,
                    ]}
                  >
                    {formatAmerican(line.american)}
                  </Text>
                  {caption ? (
                    <Text
                      style={[
                        styles.bookLimit,
                        overLimit ? styles.diffNeg : null,
                      ]}
                    >
                      {caption}
                    </Text>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.72)",
  },
  dialog: {
    maxHeight: "88%",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#0A0A0A",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  title: {
    fontFamily: fonts.displaySemiBold,
    color: "#FFFFFF",
    fontSize: 17,
  },
  subtitle: {
    fontFamily: fonts.sansRegular,
    color: "#A1A1AA",
    fontSize: 12,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    padding: 14,
    gap: 12,
    paddingBottom: 24,
  },
  section: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#111111",
    padding: 14,
    gap: 10,
  },
  sectionTitle: {
    fontFamily: fonts.sansSemiBold,
    color: "#FFFFFF",
    fontSize: 14,
  },
  heroRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 8,
  },
  heroTeam: {
    fontFamily: fonts.displayBold,
    color: "#FFFFFF",
    fontSize: 20,
  },
  heroOdds: {
    color: "#34D399",
    fontVariant: ["tabular-nums"],
  },
  heroEv: {
    fontFamily: fonts.displayBold,
    color: "#34D399",
    fontSize: 16,
    fontVariant: ["tabular-nums"],
  },
  lead: {
    fontFamily: fonts.sansRegular,
    color: "#A1A1AA",
    fontSize: 13,
    lineHeight: 18,
  },
  liveNote: {
    fontFamily: fonts.sansRegular,
    color: "#FDE68A",
    fontSize: 11,
    lineHeight: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.25)",
    backgroundColor: "rgba(69,26,3,0.35)",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  bulletList: {
    gap: 10,
  },
  bulletRow: {
    flexDirection: "row",
    gap: 10,
  },
  check: {
    marginTop: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "rgba(16,185,129,0.15)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  checkMark: {
    fontFamily: fonts.sansBold,
    color: "#34D399",
    fontSize: 9,
  },
  bulletText: {
    flex: 1,
    fontFamily: fonts.sansRegular,
    color: "#D4D4D8",
    fontSize: 13,
    lineHeight: 18,
  },
  muted: {
    fontFamily: fonts.sansRegular,
    color: "#71717A",
    fontSize: 13,
    lineHeight: 18,
  },
  probBlock: {
    gap: 12,
  },
  probBar: {
    gap: 4,
  },
  probBarLabels: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  probBarLabel: {
    flex: 1,
    fontFamily: fonts.sansRegular,
    color: "#A1A1AA",
    fontSize: 11,
  },
  probBarValue: {
    fontFamily: fonts.sansSemiBold,
    color: "#E4E4E7",
    fontSize: 11,
    fontVariant: ["tabular-nums"],
  },
  probTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(39,39,42,0.9)",
    overflow: "hidden",
  },
  probFill: {
    height: "100%",
    borderRadius: 999,
  },
  probFillEmerald: {
    backgroundColor: "#10B981",
  },
  probFillZinc: {
    backgroundColor: "#52525B",
  },
  diffLine: {
    fontFamily: fonts.sansRegular,
    color: "#71717A",
    fontSize: 12,
  },
  diffPos: {
    fontFamily: fonts.sansSemiBold,
    color: "#34D399",
    fontVariant: ["tabular-nums"],
  },
  diffNeg: {
    fontFamily: fonts.sansSemiBold,
    color: "#F87171",
    fontVariant: ["tabular-nums"],
  },
  fairInline: {
    fontFamily: fonts.sansSemiBold,
    color: "#D4D4D8",
    fontVariant: ["tabular-nums"],
  },
  payoutRows: {
    gap: 0,
  },
  payoutRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.06)",
    paddingVertical: 10,
  },
  payoutLabel: {
    fontFamily: fonts.sansRegular,
    color: "#A1A1AA",
    fontSize: 13,
  },
  payoutValue: {
    fontFamily: fonts.sansSemiBold,
    color: "#FFFFFF",
    fontSize: 13,
    fontVariant: ["tabular-nums"],
  },
  payoutEv: {
    fontSize: 13,
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
  payoutActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.06)",
    paddingTop: 10,
  },
  logBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 8,
    backgroundColor: "#059669",
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  logBtnDone: {
    backgroundColor: "rgba(6,95,70,0.85)",
  },
  logText: {
    fontFamily: fonts.sansSemiBold,
    color: "#FFFFFF",
    fontSize: 12,
  },
  openBookBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  openBookText: {
    fontFamily: fonts.sansSemiBold,
    color: "#E4E4E7",
    fontSize: 12,
  },
  snapshotBlock: {
    gap: 8,
  },
  snapshotRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  snapshotLabel: {
    fontFamily: fonts.sansRegular,
    color: "#A1A1AA",
    fontSize: 13,
  },
  snapshotValue: {
    fontFamily: fonts.sansSemiBold,
    color: "#E4E4E7",
    fontSize: 13,
    fontVariant: ["tabular-nums"],
  },
  predLink: {
    paddingTop: 4,
  },
  predLinkText: {
    fontFamily: fonts.sansSemiBold,
    color: "#A78BFA",
    fontSize: 13,
  },
  expandBooksBtn: {
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(9,9,11,0.6)",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  expandBooksText: {
    fontFamily: fonts.sansSemiBold,
    color: "#E4E4E7",
    fontSize: 14,
  },
  booksList: {
    marginTop: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(0,0,0,0.25)",
    padding: 8,
    gap: 4,
  },
  bookRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bookRowBest: {
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.3)",
    backgroundColor: "rgba(6,78,59,0.2)",
  },
  bookLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bookRank: {
    width: 16,
    textAlign: "center",
    fontFamily: fonts.sansBold,
    color: "#52525B",
    fontSize: 10,
  },
  bookRankBest: {
    color: "#34D399",
  },
  bookTitle: {
    flexShrink: 1,
    fontFamily: fonts.sansRegular,
    color: "#D4D4D8",
    fontSize: 13,
  },
  bookTitleBest: {
    fontFamily: fonts.sansSemiBold,
    color: "#A7F3D0",
  },
  bookRight: {
    alignItems: "flex-end",
  },
  bookOdds: {
    fontFamily: fonts.sansSemiBold,
    color: "#FFFFFF",
    fontSize: 13,
    fontVariant: ["tabular-nums"],
  },
  bookOddsBest: {
    color: "#34D399",
  },
  bookLimit: {
    fontFamily: fonts.sansRegular,
    color: "#71717A",
    fontSize: 10,
  },
  disabled: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.85,
  },
});
