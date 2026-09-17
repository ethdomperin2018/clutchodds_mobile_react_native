import { StyleSheet, Text, View } from "react-native";
import { TeamLogo } from "@/components/TeamLogo";
import { PredictionMetricsBlock } from "@/features/prediction/PredictionMetricsBlock";
import { formatKickoffWhen } from "@/features/prediction/predictionDisplay";
import type { ModelPredictionRow } from "@/lib/modelPredictions/modelPredictionRows";
import { awayAtHomeLabel } from "@/lib/teamDisplay";
import { fonts } from "@/theme/typography";

export function TopPredictionCard({
  row,
  nowMs,
}: {
  row: ModelPredictionRow;
  nowMs: number;
}) {
  const { pick } = row;
  const subline = `${formatKickoffWhen(pick.commenceTime, nowMs)} · ${pick.sportTitle}`;

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>Top Prediction Right Now</Text>

      <View style={styles.matchup}>
        <TeamLogo size={44} sportKey={pick.sportKey} teamName={pick.awayTeam} />
        <View style={styles.matchupCopy}>
          <Text numberOfLines={2} style={styles.matchupTitle}>
            {awayAtHomeLabel(pick.awayTeam, pick.homeTeam)}
          </Text>
          <Text style={styles.matchupSub}>{subline}</Text>
        </View>
        <TeamLogo size={44} sportKey={pick.sportKey} teamName={pick.homeTeam} />
      </View>

      <PredictionMetricsBlock row={row} />
    </View>
  );
}

export function TopPredictionEmpty({ message }: { message: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyCopy}>{message}</Text>
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
  empty: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#161616",
    paddingHorizontal: 20,
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyCopy: {
    fontFamily: fonts.sansRegular,
    color: "#71717A",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
});
