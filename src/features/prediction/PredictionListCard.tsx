import { StyleSheet, Text, View } from "react-native";
import { TeamLogo } from "@/components/TeamLogo";
import { PredictionMetricsBlock } from "@/features/prediction/PredictionMetricsBlock";
import {
  formatKickoffWhen,
  startsInLabel,
} from "@/features/prediction/predictionDisplay";
import type { ModelPredictionRow } from "@/lib/modelPredictions/modelPredictionRows";
import { awayAtHomeLabel } from "@/lib/teamDisplay";
import { fonts } from "@/theme/typography";

export function PredictionListCard({
  row,
  nowMs,
}: {
  row: ModelPredictionRow;
  nowMs: number;
}) {
  const { pick } = row;
  const startsIn = startsInLabel(pick.commenceTime, nowMs);
  const isLive = startsIn === "Live";
  const subline = `${formatKickoffWhen(pick.commenceTime, nowMs)} · ${pick.sportTitle}`;

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View
          style={[styles.startsPill, isLive ? styles.startsLive : null]}
        >
          <Text style={[styles.startsText, isLive ? styles.startsLiveText : null]}>
            {startsIn}
          </Text>
        </View>

        <View style={styles.matchup}>
          <TeamLogo size={36} sportKey={pick.sportKey} teamName={pick.awayTeam} />
          <View style={styles.matchupCopy}>
            <Text numberOfLines={2} style={styles.matchupTitle}>
              {awayAtHomeLabel(pick.awayTeam, pick.homeTeam)}
            </Text>
            <Text style={styles.matchupSub}>{subline}</Text>
          </View>
          <TeamLogo size={36} sportKey={pick.sportKey} teamName={pick.homeTeam} />
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
    position: "relative",
    paddingTop: 4,
    paddingHorizontal: 4,
  },
  startsPill: {
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 1,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  startsLive: {
    backgroundColor: "rgba(16,185,129,0.15)",
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
  matchup: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingTop: 8,
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
