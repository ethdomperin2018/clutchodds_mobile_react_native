import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { openPricing } from "@/lib/openLinks";
import { getPredictionUnavailableCopy } from "@/lib/valueBets/predictionFieldLabels";
import { fonts } from "@/theme/typography";

/** Compact Elite lock — matches web `ValueBetsEliteLock` compact. */
export function ValueBetsEliteLock({ field }: { field?: string }) {
  return (
    <Pressable
      onPress={() => void openPricing("/value-bets")}
      style={styles.lock}
    >
      <Ionicons color="rgba(167,139,250,0.85)" name="lock-closed-outline" size={14} />
      {field ? <Text style={styles.field}>{field}</Text> : null}
      <Text style={styles.cta}>Upgrade to Elite</Text>
    </Pressable>
  );
}

export function ValueBetsEliteBadge() {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>ELITE</Text>
    </View>
  );
}

/** Elite user without a visible prediction — short status for Fair Odds / Confidence. */
export function ValueBetsEliteUnavailable({
  commenceTime,
  nowMs,
}: {
  commenceTime?: string;
  nowMs?: number;
}) {
  const copy =
    commenceTime != null
      ? getPredictionUnavailableCopy(
          commenceTime,
          nowMs != null ? new Date(nowMs) : new Date()
        )
      : {
          short: "Not available yet",
          headline: "Prediction not available yet.",
        };

  return (
    <Text numberOfLines={2} style={styles.unavailable}>
      {copy.short}
    </Text>
  );
}

const styles = StyleSheet.create({
  lock: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 4,
  },
  field: {
    fontFamily: fonts.sansMedium,
    color: "#A1A1AA",
    fontSize: 10,
    textAlign: "center",
  },
  cta: {
    fontFamily: fonts.sansSemiBold,
    color: "#C4B5FD",
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    textAlign: "center",
  },
  unavailable: {
    fontFamily: fonts.sansMedium,
    color: "#A1A1AA",
    fontSize: 10,
    lineHeight: 13,
    textAlign: "center",
  },
  badge: {
    borderRadius: 4,
    backgroundColor: "#7C3AED",
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontFamily: fonts.sansBold,
    color: "#FFFFFF",
    fontSize: 8,
    letterSpacing: 0.6,
  },
});
