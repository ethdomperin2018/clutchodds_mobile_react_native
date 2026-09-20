import { StyleSheet, Text, View } from "react-native";
import {
  formatSignedPercent,
  primaryEvPercent,
  sportLeagueLabel,
} from "@/lib/valueBets/format";
import type { ValueBetsSummary } from "@/lib/valueBets/summary";
import { shortTeamName } from "@/lib/teamDisplay";
import { fonts } from "@/theme/typography";

/** Phone compact strip — matches web `ValueBetsSummaryStrip` <xl layout. */
export function ValueBetsSummaryStrip({
  summary,
}: {
  summary: ValueBetsSummary;
}) {
  const best = summary.bestPick;
  const bestEv = best ? primaryEvPercent(best) : 0;

  const avgEdge =
    summary.opportunityCount > 0
      ? `${summary.averageEvPercent >= 0 ? "+" : ""}${summary.averageEvPercent.toFixed(2)}%`
      : "—";
  const positiveEv =
    summary.opportunityCount > 0
      ? `${Math.round(summary.positiveEvPercent)}%`
      : "—";
  const topSport = summary.topSportKey
    ? sportLeagueLabel(summary.topSportTitle ?? summary.topSportKey)
    : "—";

  return (
    <View style={styles.strip}>
      <SummaryStat
        label="Best"
        title={
          best
            ? `${shortTeamName(best.teamName)} · Best Value Bet`
            : "Best Value Bet"
        }
        value={best ? formatSignedPercent(bestEv) : "—"}
      />
      <View style={styles.divider} />
      <SummaryStat label="Avg Edge" title="Average Value Edge" value={avgEdge} />
      <View style={styles.divider} />
      <SummaryStat label="+EV" title="Positive EV Bets" value={positiveEv} />
      <View style={styles.divider} />
      <SummaryStat label="Top Sport" value={topSport} />
    </View>
  );
}

function SummaryStat({
  label,
  value,
  title,
}: {
  label: string;
  value: string;
  title?: string;
}) {
  return (
    <View accessibilityHint={title} style={styles.stat}>
      <Text numberOfLines={1} style={styles.value}>
        {value}
      </Text>
      <Text numberOfLines={1} style={styles.label}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: "row",
    overflow: "hidden",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#161616",
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  stat: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    paddingVertical: 12,
  },
  value: {
    width: "100%",
    textAlign: "center",
    fontFamily: fonts.displayBold,
    color: "#34D399",
    fontSize: 18,
    lineHeight: 20,
    fontVariant: ["tabular-nums"],
  },
  label: {
    marginTop: 6,
    width: "100%",
    textAlign: "center",
    fontFamily: fonts.sansSemiBold,
    color: "#71717A",
    fontSize: 9,
    letterSpacing: 1.08,
    textTransform: "uppercase",
  },
});
