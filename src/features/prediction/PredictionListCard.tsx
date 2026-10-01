import { StyleSheet, Text, View } from "react-native";
import { TeamLogo } from "@/components/TeamLogo";
import { PredictionMetricsBlock } from "@/features/prediction/PredictionMetricsBlock";
import {
  formatKickoffWhen,
  outcomeLabel,
  scoreLabel,
} from "@/features/prediction/predictionDisplay";
import type { PredictionHistoryRow } from "@/lib/predictions/history";
import { awayAtHomeLabel } from "@/lib/teamDisplay";
import { fonts } from "@/theme/typography";

export function PredictionListCard({
  row,
  nowMs,
}: {
  row: PredictionHistoryRow;
  nowMs: number;
}) {
  const label = outcomeLabel(row.outcome, row.commenceTime, nowMs);
  const score = scoreLabel(row.outcome, row.awayScore, row.homeScore);
  const isLive = row.outcome === "pending" && label === "Live";
  const settled = row.outcome !== "pending";
  const subline = `${formatKickoffWhen(row.commenceTime, nowMs, settled)} · ${row.sportTitle}`;
  const pillText = score ? `${label} ${score}` : label;

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View
          style={[
            styles.startsPill,
            row.outcome === "win" || isLive ? styles.startsLive : null,
            row.outcome === "loss" ? styles.startsLoss : null,
          ]}
        >
          <Text
            style={[
              styles.startsText,
              row.outcome === "win" || isLive ? styles.startsLiveText : null,
              row.outcome === "loss" ? styles.startsLossText : null,
            ]}
          >
            {pillText}
          </Text>
        </View>

        <View style={styles.matchup}>
          <TeamLogo size={36} sportKey={row.sportKey} teamName={row.awayTeam} />
          <View style={styles.matchupCopy}>
            <Text numberOfLines={2} style={styles.matchupTitle}>
              {awayAtHomeLabel(row.awayTeam, row.homeTeam)}
            </Text>
            <Text style={styles.matchupSub}>{subline}</Text>
          </View>
          <TeamLogo size={36} sportKey={row.sportKey} teamName={row.homeTeam} />
        </View>
      </View>

      <PredictionMetricsBlock row={row} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#111111",
    padding: 16,
  },
  head: {
    paddingHorizontal: 4,
  },
  startsPill: {
    alignSelf: "flex-end",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  startsLive: {
    backgroundColor: "rgba(16,185,129,0.15)",
  },
  startsLoss: {
    backgroundColor: "rgba(239,68,68,0.15)",
  },
  startsText: {
    fontFamily: fonts.sansSemiBold,
    color: "#A1A1AA",
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  startsLiveText: {
    color: "#34D399",
  },
  startsLossText: {
    color: "#F87171",
  },
  matchup: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
  },
  matchupCopy: {
    minWidth: 0,
    flexShrink: 1,
    maxWidth: 160,
    alignItems: "center",
  },
  matchupTitle: {
    fontFamily: fonts.displaySemiBold,
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: -0.2,
    textAlign: "center",
  },
  matchupSub: {
    marginTop: 4,
    fontFamily: fonts.sansRegular,
    color: "#71717A",
    fontSize: 12,
    textAlign: "center",
  },
});
