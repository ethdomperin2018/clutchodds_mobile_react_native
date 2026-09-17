import { StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { TeamLogo } from "@/components/TeamLogo";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import {
  formatConfidence10,
  modelEdgeTone,
} from "@/features/prediction/predictionDisplay";
import type { ModelPredictionRow } from "@/lib/modelPredictions/modelPredictionRows";
import { shortTeamName } from "@/lib/teamDisplay";
import { displayConfidenceScore } from "@/lib/valueBets/format";
import { fonts } from "@/theme/typography";

const STAR_PATH =
  "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z";

export function PredictionMetricsBlock({
  row,
}: {
  row: ModelPredictionRow;
}) {
  const { pick, insights, favoriteTeam, winProb, modelEdge } = row;
  const edgeTone = modelEdgeTone(modelEdge);

  return (
    <View style={styles.grid}>
      <View style={styles.cell}>
        <Text style={styles.label}>Model favorite</Text>
        <View style={styles.favoriteRow}>
          <TeamLogo
            size={20}
            sportKey={pick.sportKey}
            teamName={favoriteTeam}
          />
          <Text numberOfLines={1} style={styles.favoriteText}>
            {shortTeamName(favoriteTeam)}
          </Text>
        </View>
      </View>

      <View style={styles.cell}>
        <Text style={styles.label}>Model win prob</Text>
        <WinProbBar value={winProb} />
      </View>

      <View style={styles.cell}>
        <Text style={styles.label}>Confidence</Text>
        <View style={styles.confidenceCol}>
          <ConfidenceStars score={insights.confidenceScore} />
          <Text style={styles.confidenceScore}>
            {formatConfidence10(insights.confidenceScore)}
          </Text>
        </View>
      </View>

      <View style={styles.cell}>
        <Text style={styles.label}>Model edge</Text>
        <AnimatedNumber
          format="signed-percent-2"
          style={[
            styles.edgeValue,
            edgeTone === "pos"
              ? styles.edgePos
              : edgeTone === "neg"
                ? styles.edgeNeg
                : styles.edgeFlat,
          ]}
          value={modelEdge}
        />
      </View>
    </View>
  );
}

function WinProbBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <View style={styles.winWrap}>
      <AnimatedNumber format="percent-2" style={styles.winValue} value={pct} />
      <View style={styles.winTrack}>
        <View style={[styles.winFill, { width: `${pct}%` }]} />
      </View>
    </View>
  );
}

function ConfidenceStars({ score }: { score: number }) {
  const rating = displayConfidenceScore(score);
  return (
    <View
      accessibilityLabel={`${rating.toFixed(1)} out of 10`}
      style={styles.stars}
    >
      {Array.from({ length: 10 }).map((_, i) => {
        const fill = Math.max(0, Math.min(1, rating - i));
        return (
          <View key={i} style={styles.starSlot}>
            <Svg
              fill="#3F3F46"
              height={10}
              style={StyleSheet.absoluteFill}
              viewBox="0 0 20 20"
              width={10}
            >
              <Path d={STAR_PATH} />
            </Svg>
            {fill > 0 ? (
              <View style={[styles.starFillClip, { width: 10 * fill }]}>
                <Svg fill="#FBBF24" height={10} viewBox="0 0 20 20" width={10}>
                  <Path d={STAR_PATH} />
                </Svg>
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 16,
    rowGap: 12,
  },
  cell: {
    width: "45%",
    flexGrow: 1,
    minWidth: 0,
  },
  label: {
    fontFamily: fonts.sansSemiBold,
    color: "#71717A",
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  favoriteRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minWidth: 0,
  },
  favoriteText: {
    flexShrink: 1,
    fontFamily: fonts.sansMedium,
    color: "#34D399",
    fontSize: 14,
  },
  winWrap: {
    marginTop: 4,
    minWidth: 88,
  },
  winValue: {
    fontFamily: fonts.displayBold,
    color: "#34D399",
    fontSize: 14,
    fontVariant: ["tabular-nums"],
  },
  winTrack: {
    marginTop: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  winFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#10B981",
  },
  confidenceCol: {
    marginTop: 4,
    gap: 4,
  },
  confidenceScore: {
    fontFamily: fonts.sansRegular,
    color: "#A1A1AA",
    fontSize: 11,
    fontVariant: ["tabular-nums"],
  },
  stars: {
    flexDirection: "row",
    alignItems: "center",
    gap: 1,
  },
  starSlot: {
    width: 10,
    height: 10,
    position: "relative",
  },
  starFillClip: {
    position: "absolute",
    left: 0,
    top: 0,
    height: 10,
    overflow: "hidden",
  },
  edgeValue: {
    marginTop: 4,
    fontFamily: fonts.displayBold,
    fontSize: 18,
    fontVariant: ["tabular-nums"],
  },
  edgePos: {
    color: "#34D399",
  },
  edgeNeg: {
    color: "#F87171",
  },
  edgeFlat: {
    color: "#A1A1AA",
  },
});
