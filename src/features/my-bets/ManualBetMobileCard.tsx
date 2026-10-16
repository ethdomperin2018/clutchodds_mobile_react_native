import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { BookLogo } from "@/components/BookLogo";
import { TeamLogo } from "@/components/TeamLogo";
import type { ManualBetLeg, ManualBetResult, ManualBetRow } from "@/lib/api/types";
import { effectiveExpectedProfit } from "@/lib/betProfit";
import { formatAmerican, formatLocalDateTime } from "@/lib/format";
import {
  isLineShopPlaceholderLeg,
  type ParsedLineShopBetNote,
} from "@/lib/lineShopBetNotes";
import { shortTeamName } from "@/lib/teamDisplay";
import { formatSignedPercent } from "@/lib/valueBets/format";
import { colors } from "@/theme/tokens";
import { fonts } from "@/theme/typography";

const RESULTS: ManualBetResult[] = [
  "pending",
  "won",
  "lost",
  "push",
  "partial",
];

/** Fixed trigger/menu width — sized for longest label ("Pending"). */
const RESULT_TRIGGER_WIDTH = 112;

function formatResultLabel(result: string): string {
  return result.charAt(0).toUpperCase() + result.slice(1);
}

function parseMatchupTeams(matchup: string): [string, string] | null {
  const parts = matchup.split(/\s+vs\.?\s+/i);
  if (parts.length !== 2) return null;
  const homeTeam = parts[0]?.trim();
  const awayTeam = parts[1]?.trim();
  if (!homeTeam || !awayTeam) return null;
  return [homeTeam, awayTeam];
}

function shortMatchupLabel(matchup: string): string {
  const teams = parseMatchupTeams(matchup);
  if (!teams) return matchup;
  return `${shortTeamName(teams[1])} @ ${shortTeamName(teams[0])}`;
}

/** Mirrors web `MatchupLabel` — logo+name @ logo+name, recommended in emerald. */
function MatchupLabel({
  homeTeam,
  awayTeam,
  recommendedTeam,
  sportKey,
  logoSize = 16,
}: {
  homeTeam: string;
  awayTeam: string;
  recommendedTeam: string;
  sportKey?: string;
  logoSize?: number;
}) {
  return (
    <View style={styles.matchupRow}>
      <View style={styles.matchupTeamWrap}>
        {sportKey ? (
          <TeamLogo size={logoSize} sportKey={sportKey} teamName={awayTeam} />
        ) : null}
        <Text
          numberOfLines={1}
          style={[
            styles.matchupTeam,
            recommendedTeam === awayTeam ? styles.matchupRec : null,
          ]}
        >
          {shortTeamName(awayTeam)}
        </Text>
      </View>
      <Text style={styles.matchupAt}>@</Text>
      <View style={styles.matchupTeamWrap}>
        {sportKey ? (
          <TeamLogo size={logoSize} sportKey={sportKey} teamName={homeTeam} />
        ) : null}
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
    </View>
  );
}

/** Mirrors web `BetGameCell`. */
function BetGameCell({
  matchup,
  sportKey,
  lineShop,
  arbitrage,
  recommendedTeam,
}: {
  matchup: string;
  sportKey: string | null;
  lineShop: boolean;
  arbitrage: boolean;
  recommendedTeam: string;
}) {
  const teams = sportKey ? parseMatchupTeams(matchup) : null;

  return (
    <View style={styles.gameCell}>
      {teams ? (
        <MatchupLabel
          awayTeam={teams[1]}
          homeTeam={teams[0]}
          logoSize={16}
          recommendedTeam={lineShop ? recommendedTeam : ""}
          sportKey={sportKey ?? undefined}
        />
      ) : (
        <Text numberOfLines={2} style={styles.matchupFallback}>
          {shortMatchupLabel(matchup)}
        </Text>
      )}
      {lineShop ? (
        <Text style={styles.sourceValue}>Value Bets</Text>
      ) : arbitrage ? (
        <Text style={styles.sourceArb}>Arbitrage</Text>
      ) : null}
    </View>
  );
}

function CardLegRow({
  leg,
  sportKey,
  compact = false,
}: {
  leg: ManualBetLeg;
  sportKey: string | null;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <View style={styles.legCompact}>
        <View style={styles.legCompactTop}>
          <BookLogo
            bookKey={leg.bookKey ?? leg.bookTitle}
            bookTitle={leg.bookTitle}
            size={22}
          />
          {sportKey ? (
            <TeamLogo teamName={leg.teamName} sportKey={sportKey} size={16} />
          ) : null}
          <Text numberOfLines={1} style={styles.legTeam}>
            {shortTeamName(leg.teamName)}
          </Text>
        </View>
        <Text style={styles.legOdds}>{formatAmerican(leg.american)}</Text>
        <Text numberOfLines={1} style={styles.legMeta}>
          <Text>{leg.bookTitle}</Text>
          <Text style={styles.legMetaDim}> · </Text>
          <Text style={styles.legMetaTabular}>${leg.stake.toFixed(2)}</Text>
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.legRow}>
      <BookLogo
        bookKey={leg.bookKey ?? leg.bookTitle}
        bookTitle={leg.bookTitle}
        size={28}
      />
      <View style={styles.legRowBody}>
        <View style={styles.legRowTop}>
          {sportKey ? (
            <TeamLogo teamName={leg.teamName} sportKey={sportKey} size={18} />
          ) : null}
          <Text numberOfLines={1} style={styles.legTeamFlex}>
            {shortTeamName(leg.teamName)}
          </Text>
          <Text style={styles.legOddsInline}>
            {formatAmerican(leg.american)}
          </Text>
        </View>
        <Text numberOfLines={1} style={styles.legMetaSingle}>
          {leg.bookTitle}
          <Text style={styles.legMetaDim}> · </Text>
          <Text style={styles.legMetaMuted}>${leg.stake.toFixed(2)}</Text>
        </Text>
      </View>
    </View>
  );
}

function ResultPicker({
  value,
  updating,
  onChange,
}: {
  value: ManualBetResult;
  updating: boolean;
  onChange: (next: ManualBetResult) => void;
}) {
  const triggerRef = useRef<View>(null);
  const [anchor, setAnchor] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  function openMenu() {
    if (updating) return;
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

  const menuWidth = RESULT_TRIGGER_WIDTH;
  const menuTop = anchor
    ? Math.min(
        anchor.y + anchor.height + 4,
        Dimensions.get("window").height - 220
      )
    : 0;
  // Right-align under the trigger (result sits on the card’s right).
  const menuLeft = anchor
    ? Math.max(
        8,
        Math.min(
          anchor.x + anchor.width - menuWidth,
          Dimensions.get("window").width - menuWidth - 8
        )
      )
    : 0;

  return (
    <>
      <View style={styles.resultRow}>
        <View collapsable={false} ref={triggerRef}>
          <Pressable
            accessibilityLabel="Bet result"
            disabled={updating}
            onPress={() => (anchor ? setAnchor(null) : openMenu())}
            style={[styles.resultBtn, { width: RESULT_TRIGGER_WIDTH }]}
          >
            <Text numberOfLines={1} style={styles.resultBtnText}>
              {formatResultLabel(value)}
            </Text>
            <View style={anchor ? styles.resultChevronOpen : null}>
              <Svg fill="#A1A1AA" height={14} viewBox="0 0 20 20" width={14}>
                <Path
                  clipRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                  fillRule="evenodd"
                />
              </Svg>
            </View>
          </Pressable>
        </View>
        {updating ? (
          <ActivityIndicator color={colors.success} size="small" />
        ) : null}
      </View>

      <Modal
        animationType="none"
        transparent
        visible={!!anchor}
        onRequestClose={() => setAnchor(null)}
      >
        <View style={styles.resultModalRoot}>
          <Pressable
            style={styles.resultBackdrop}
            onPress={() => setAnchor(null)}
          />
          {anchor ? (
            <View
              style={[
                styles.resultMenu,
                { top: menuTop, left: menuLeft, width: menuWidth },
              ]}
            >
              {RESULTS.map((result) => {
                const active = result === value;
                return (
                  <Pressable
                    key={result}
                    onPress={() => {
                      setAnchor(null);
                      if (result !== value) onChange(result);
                    }}
                    style={[
                      styles.resultOption,
                      active ? styles.resultOptionOn : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.resultOptionText,
                        active ? styles.resultOptionTextOn : null,
                      ]}
                    >
                      {formatResultLabel(result)}
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

/** Phone card — mirrors web `ManualBetMobileCard`. */
export function ManualBetMobileCard({
  bet,
  lineShop,
  lineShopMeta,
  arbitrage = false,
  updating,
  onUpdateResult,
}: {
  bet: ManualBetRow;
  lineShop: boolean;
  lineShopMeta: ParsedLineShopBetNote | null;
  arbitrage?: boolean;
  updating: boolean;
  onUpdateResult: (id: string, result: ManualBetResult) => void;
}) {
  const showLegB = !isLineShopPlaceholderLeg(bet.legB);
  const edgePercent = lineShopMeta?.edgePercent;
  const expected = effectiveExpectedProfit(bet);
  const hasEdge = lineShop && edgePercent != null;
  const hasProfit = bet.expectedProfit != null;
  const betDate = bet.betDate || bet.createdAt || "";

  return (
    <View style={styles.card}>
      {/* Header: matchup + result — same as web */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <BetGameCell
            arbitrage={arbitrage}
            lineShop={lineShop}
            matchup={bet.matchup}
            recommendedTeam={bet.legA.teamName}
            sportKey={bet.sportKey}
          />
          {betDate ? (
            <Text style={styles.date}>{formatLocalDateTime(betDate)}</Text>
          ) : null}
        </View>
        <ResultPicker
          updating={updating}
          value={bet.result}
          onChange={(next) => onUpdateResult(bet.id, next)}
        />
      </View>

      {/* Legs box */}
      <View style={styles.legsBox}>
        {showLegB ? (
          <View style={styles.legsGrid}>
            <View style={styles.legCol}>
              <Text style={styles.legLabel}>Bet A</Text>
              <CardLegRow compact leg={bet.legA} sportKey={bet.sportKey} />
            </View>
            <View style={[styles.legCol, styles.legColBorder]}>
              <Text style={styles.legLabel}>Bet B</Text>
              <CardLegRow compact leg={bet.legB} sportKey={bet.sportKey} />
            </View>
          </View>
        ) : (
          <>
            <Text style={styles.legLabelSingle}>Bet</Text>
            <CardLegRow leg={bet.legA} sportKey={bet.sportKey} />
          </>
        )}
      </View>

      {/* Edge / profit footer */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <Text style={styles.footerLabel}>{hasEdge ? "Edge" : "Profit"}</Text>
          {hasEdge ? (
            <Text style={styles.footerValue}>
              {formatSignedPercent(edgePercent)}
            </Text>
          ) : hasProfit ? (
            <Text style={styles.footerValue}>
              ${bet.expectedProfit!.toFixed(2)}
            </Text>
          ) : (
            <Text style={styles.footerEmpty}>—</Text>
          )}
        </View>
        {hasEdge ? (
          <Text style={styles.evHint}>
            ~${expected.toFixed(2)}
            <Text style={styles.evHintUnit}> EV</Text>
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(24,24,27,0.5)",
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  headerLeft: {
    flex: 1,
    minWidth: 0,
  },
  gameCell: {
    gap: 2,
  },
  matchupRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    columnGap: 6,
    rowGap: 4,
  },
  matchupTeamWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    maxWidth: "100%",
    flexShrink: 1,
  },
  matchupTeam: {
    flexShrink: 1,
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    lineHeight: 18,
    color: "#FFFFFF",
  },
  matchupRec: {
    color: colors.success,
  },
  matchupAt: {
    marginHorizontal: 2,
    fontFamily: fonts.sansRegular,
    fontSize: 14,
    color: colors.textMuted,
  },
  matchupFallback: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    lineHeight: 18,
    color: "#FFFFFF",
  },
  sourceValue: {
    marginTop: 2,
    fontFamily: fonts.sansBold,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "rgba(56,189,248,0.8)",
  },
  sourceArb: {
    marginTop: 2,
    fontFamily: fonts.sansBold,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "rgba(167,139,250,0.8)",
  },
  date: {
    marginTop: 6,
    fontFamily: fonts.sansRegular,
    fontSize: 12,
    color: colors.textMuted,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  resultBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  resultBtnText: {
    flexShrink: 1,
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: "#FFFFFF",
  },
  resultChevronOpen: {
    transform: [{ rotate: "180deg" }],
  },
  resultModalRoot: {
    flex: 1,
  },
  resultBackdrop: {
    ...StyleSheet.absoluteFill,
  },
  resultMenu: {
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
  resultOption: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  resultOptionOn: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  resultOptionText: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: "#D4D4D8",
  },
  resultOptionTextOn: {
    color: "#FFFFFF",
    fontFamily: fonts.sansBold,
  },
  legsBox: {
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(0,0,0,0.25)",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  legsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  legCol: {
    flex: 1,
    minWidth: 0,
  },
  legColBorder: {
    borderLeftWidth: 1,
    borderLeftColor: "rgba(255,255,255,0.06)",
    paddingLeft: 12,
  },
  legLabel: {
    marginBottom: 8,
    fontFamily: fonts.sansBold,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: colors.textMuted,
  },
  legLabelSingle: {
    marginBottom: 10,
    fontFamily: fonts.sansBold,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: colors.textMuted,
  },
  legCompact: {
    minWidth: 0,
  },
  legCompactTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 0,
  },
  legRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  legRowBody: {
    flex: 1,
    minWidth: 0,
  },
  legRowTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 0,
  },
  legTeam: {
    flexShrink: 1,
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: "#FFFFFF",
  },
  legTeamFlex: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: "#FFFFFF",
  },
  legOdds: {
    marginTop: 6,
    fontFamily: fonts.displayBold,
    fontSize: 14,
    color: colors.success,
    fontVariant: ["tabular-nums"],
  },
  legOddsInline: {
    flexShrink: 0,
    fontFamily: fonts.displayBold,
    fontSize: 14,
    color: colors.success,
    fontVariant: ["tabular-nums"],
  },
  legMeta: {
    marginTop: 2,
    fontFamily: fonts.sansRegular,
    fontSize: 11,
    color: colors.textMuted,
  },
  legMetaSingle: {
    marginTop: 2,
    fontFamily: fonts.sansRegular,
    fontSize: 12,
    color: colors.textMuted,
  },
  legMetaDim: {
    color: "#52525B",
  },
  legMetaTabular: {
    fontVariant: ["tabular-nums"],
  },
  legMetaMuted: {
    color: "#A1A1AA",
    fontVariant: ["tabular-nums"],
  },
  footer: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
  },
  footerLeft: {
    minWidth: 0,
  },
  footerLabel: {
    fontFamily: fonts.sansBold,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: colors.textMuted,
  },
  footerValue: {
    marginTop: 4,
    fontFamily: fonts.displayBold,
    fontSize: 20,
    lineHeight: 22,
    color: colors.success,
    fontVariant: ["tabular-nums"],
  },
  footerEmpty: {
    marginTop: 4,
    fontFamily: fonts.sansRegular,
    fontSize: 14,
    color: "#52525B",
  },
  evHint: {
    flexShrink: 0,
    textAlign: "right",
    fontFamily: fonts.sansRegular,
    fontSize: 14,
    color: "#A1A1AA",
    fontVariant: ["tabular-nums"],
  },
  evHintUnit: {
    fontSize: 12,
    color: colors.textMuted,
  },
});
