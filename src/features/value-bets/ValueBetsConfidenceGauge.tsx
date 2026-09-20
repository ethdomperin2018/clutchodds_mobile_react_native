import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { displayConfidenceScore } from "@/lib/valueBets/format";
import { fonts } from "@/theme/typography";

function gaugeColor(scoreOutOf10: number): { stroke: string; text: string } {
  if (scoreOutOf10 >= 7) return { stroke: "#34d399", text: "#34D399" };
  if (scoreOutOf10 >= 5) return { stroke: "#fbbf24", text: "#FCD34D" };
  return { stroke: "#fb7185", text: "#FDA4AF" };
}

export function ValueBetsConfidenceGauge({
  score,
  label,
  size = "sm",
  showLabel = true,
}: {
  score: number;
  label: string;
  size?: "sm" | "md";
  showLabel?: boolean;
}) {
  const clamped = displayConfidenceScore(score);
  const { stroke, text } = gaugeColor(clamped);
  const box = size === "sm" ? 36 : 44;
  const radius = size === "sm" ? 15 : 18;
  const center = box / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 10) * circumference;

  return (
    <View style={styles.wrap}>
      <View style={{ width: box, height: box }}>
        <Svg
          height={box}
          style={{ transform: [{ rotate: "-90deg" }] }}
          viewBox={`0 0 ${box} ${box}`}
          width={box}
        >
          <Circle
            cx={center}
            cy={center}
            fill="none"
            r={radius}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={3.5}
          />
          <Circle
            cx={center}
            cy={center}
            fill="none"
            r={radius}
            stroke={stroke}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
            strokeWidth={3.5}
          />
        </Svg>
        <View style={styles.scoreOverlay}>
          <Text style={[styles.score, size === "sm" ? styles.scoreSm : null]}>
            {clamped.toFixed(1)}
          </Text>
        </View>
      </View>
      {showLabel ? (
        <Text style={[styles.label, { color: text }]}>{label}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    gap: 2,
  },
  scoreOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
  score: {
    fontFamily: fonts.displayBold,
    color: "#FFFFFF",
    fontSize: 12,
    fontVariant: ["tabular-nums"],
  },
  scoreSm: {
    fontSize: 11,
  },
  label: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 10,
  },
});
