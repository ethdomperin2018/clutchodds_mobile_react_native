import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { TeamLogo } from "@/components/TeamLogo";
import { PredictionMetricsBlock } from "@/features/prediction/PredictionMetricsBlock";
import { formatKickoffWhen } from "@/features/prediction/predictionDisplay";
import type { PredictionHistoryRow } from "@/lib/predictions/history";
import { awayAtHomeLabel } from "@/lib/teamDisplay";
import { fonts } from "@/theme/typography";

export function TopPredictionCard({
  row,
  nowMs,
  title,
}: {
  row: PredictionHistoryRow;
  nowMs: number;
  title: string;
}) {
  const settled = row.outcome !== "pending";
  const subline = `${formatKickoffWhen(row.commenceTime, nowMs, settled)} · ${row.sportTitle}`;

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>{title}</Text>

      <View style={styles.matchup}>
        <TeamLogo size={44} sportKey={row.sportKey} teamName={row.awayTeam} />
        <View style={styles.matchupCopy}>
          <Text numberOfLines={2} style={styles.matchupTitle}>
            {awayAtHomeLabel(row.awayTeam, row.homeTeam)}
          </Text>
          <Text style={styles.matchupSub}>{subline}</Text>
        </View>
        <TeamLogo size={44} sportKey={row.sportKey} teamName={row.homeTeam} />
      </View>

      <PredictionMetricsBlock row={row} />
    </View>
  );
}

export function TopPredictionEmpty({
  message,
  title = "Top Prediction Right Now",
  loading = false,
}: {
  message: string;
  title?: string;
  loading?: boolean;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>{title}</Text>
      <View style={styles.emptyBody}>
        {loading ? <ActivityIndicator color="#A78BFA" /> : null}
        <Text style={loading ? styles.loadingCopy : styles.emptyCopy}>
          {message}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#161616",
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  eyebrow: {
    fontFamily: fonts.sansSemiBold,
    color: "#A78BFA",
    fontSize: 14,
    textAlign: "center",
  },
  matchup: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 4,
  },
  matchupCopy: {
    minWidth: 0,
    flexShrink: 1,
    maxWidth: 176,
    alignItems: "center",
  },
  matchupTitle: {
    fontFamily: fonts.displaySemiBold,
    color: "#FFFFFF",
    fontSize: 18,
    lineHeight: 22,
    letterSpacing: -0.3,
    textAlign: "center",
  },
  matchupSub: {
    marginTop: 4,
    fontFamily: fonts.sansRegular,
    color: "#71717A",
    fontSize: 12,
    textAlign: "center",
  },
  emptyBody: {
    marginTop: 16,
    minHeight: 120,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 8,
  },
  emptyCopy: {
    fontFamily: fonts.sansRegular,
    color: "#A1A1AA",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  loadingCopy: {
    fontFamily: fonts.sansRegular,
    color: "#E4E4E7",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
});
