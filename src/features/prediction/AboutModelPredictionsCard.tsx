import { StyleSheet, Text, View } from "react-native";
import { NavIconPrediction } from "@/components/icons/appNavIcons";
import { fonts } from "@/theme/typography";

const FEATURES = [
  "Injuries + lineup availability",
  "Recent form + rest / schedule",
  "Head-to-head + historical matchups",
  "Home/away splits + venue context",
  "Market prices for model edge",
  "Pre-game lock — not updated live",
] as const;

export function AboutModelPredictionsCard() {
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={styles.iconWrap}>
          <NavIconPrediction color="#A78BFA" size={20} />
        </View>
        <Text style={styles.title}>About Model Predictions</Text>
      </View>
      <Text style={styles.copy}>
        Our models generate win probabilities, confidence, and projected edges
        for upcoming MLB, NBA, NFL, and NHL moneylines before tip-off. Once a
        game is live, we still show that same pre-game prediction — it is not
        updated with in-game data.
      </Text>
      <View style={styles.list}>
        {FEATURES.map((item) => (
          <View key={item} style={styles.row}>
            <Text style={styles.check}>✓</Text>
            <Text style={styles.item}>{item}</Text>
          </View>
        ))}
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
    padding: 16,
  },
  head: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "rgba(124,58,237,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    fontFamily: fonts.sansSemiBold,
    color: "#FFFFFF",
    fontSize: 14,
  },
  copy: {
    marginTop: 12,
    fontFamily: fonts.sansRegular,
    color: "#A1A1AA",
    fontSize: 12,
    lineHeight: 18,
  },
  list: {
    marginTop: 12,
    gap: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  check: {
    marginTop: 1,
    fontFamily: fonts.sansMedium,
    color: "#34D399",
    fontSize: 12,
  },
  item: {
    flex: 1,
    fontFamily: fonts.sansRegular,
    color: "#A1A1AA",
    fontSize: 12,
    lineHeight: 18,
  },
});
