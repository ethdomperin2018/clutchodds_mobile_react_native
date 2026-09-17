import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { AppScreen } from "@/components/layout/AppScreen";
import { PlaceholderScreen } from "@/features/shared/PlaceholderScreen";
import { useSession } from "@/features/auth/SessionProvider";
import { openPricing } from "@/lib/openLinks";
import { isEliteUser, isProUser } from "@/lib/planAccess";
import { colors } from "@/theme/tokens";
import { fonts, typography } from "@/theme/typography";

const ELITE_PRICE_LABEL = "$99/mo";

export function PredictionScreen() {
  const { user, ready } = useSession();
  const elite = isEliteUser(user);
  const pro = isProUser(user);

  if (!ready) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.success} />
      </View>
    );
  }

  if (!elite) {
    return (
      <AppScreen>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Model Predictions</Text>
            <View style={styles.eliteBadge}>
              <Text style={styles.eliteBadgeText}>ELITE</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>
            AI-powered pre-game win probability, confidence, and projected edge.
          </Text>
        </View>
        <EliteUpgradeCard pro={pro} />
      </AppScreen>
    );
  }

  return (
    <PlaceholderScreen
      title="Model Predictions"
      subtitle="AI-powered pre-game win probability, confidence, and projected edge."
      bullets={[
        "sport filters + confidence / edge thresholds",
        "top prediction card + ranked opportunity list",
        "Elite-gated engine predictions wired to the existing API",
      ]}
      tone="info"
    />
  );
}

function EliteUpgradeCard({ pro }: { pro: boolean }) {
  return (
    <View style={styles.gate}>
      <View style={styles.gateIcon}>
        <Ionicons color="#C4B5FD" name="sparkles-outline" size={22} />
      </View>
      <View style={styles.gatePill}>
        <Text style={styles.gatePillText}>Elite</Text>
      </View>
      <Text style={styles.gateTitle}>Unlock Model Predictions</Text>
      <Text style={styles.gateCopy}>
        {pro
          ? `Upgrade to Elite (${ELITE_PRICE_LABEL}) for AI win probability, confidence, and model edge across MLB, NBA, NFL, and NHL.`
          : "Elite unlocks the Prediction Engine — model win probability, confidence, and projected edge. Start with Pro or go straight to Elite."}
      </Text>
      <Pressable
        onPress={() => void openPricing("/model-predictions")}
        style={({ pressed }) => [styles.primaryBtn, pressed ? styles.pressed : null]}
      >
        <Text style={styles.primaryBtnText}>
          {pro ? "Upgrade to Elite" : "View Elite plans"}
        </Text>
      </Pressable>
      <Pressable
        onPress={() => router.push("/(app)/(tabs)/value-bets")}
        style={({ pressed }) => [styles.secondaryBtn, pressed ? styles.pressed : null]}
      >
        <Text style={styles.secondaryBtnText}>Open Value Bets</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  header: {
    gap: 6,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    ...typography.pageTitle,
    color: "#FFFFFF",
  },
  subtitle: {
    ...typography.pageSubtitle,
  },
  eliteBadge: {
    borderRadius: 999,
    backgroundColor: "#7C3AED",
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  eliteBadgeText: {
    fontFamily: fonts.sansBold,
    color: "#FFFFFF",
    fontSize: 10,
    letterSpacing: 0.8,
  },
  gate: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.3)",
    backgroundColor: "rgba(139,92,246,0.06)",
    paddingHorizontal: 24,
    paddingVertical: 40,
    alignItems: "center",
  },
  gateIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.4)",
    backgroundColor: "rgba(139,92,246,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  gatePill: {
    marginTop: 16,
    borderRadius: 999,
    backgroundColor: "rgba(139,92,246,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  gatePillText: {
    fontFamily: fonts.sansBold,
    color: "#C4B5FD",
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  gateTitle: {
    marginTop: 12,
    fontFamily: fonts.displaySemiBold,
    color: "#FFFFFF",
    fontSize: 20,
    textAlign: "center",
  },
  gateCopy: {
    marginTop: 12,
    maxWidth: 360,
    fontFamily: fonts.sansRegular,
    color: "#A1A1AA",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  primaryBtn: {
    marginTop: 32,
    alignSelf: "stretch",
    borderRadius: 6,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  primaryBtnText: {
    fontFamily: fonts.sansBold,
    color: "#FFFFFF",
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  secondaryBtn: {
    marginTop: 12,
    alignSelf: "stretch",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  secondaryBtnText: {
    fontFamily: fonts.sansBold,
    color: "#E4E4E7",
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  pressed: {
    opacity: 0.85,
  },
});
