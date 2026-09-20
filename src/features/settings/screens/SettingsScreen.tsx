import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AppScreen } from "@/components/layout/AppScreen";
import { pageHeaderStyles } from "@/components/layout/pageHeaderStyles";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SectionCard } from "@/components/ui/SectionCard";
import { useSession } from "@/features/auth/SessionProvider";
import { useOnboarding } from "@/features/onboarding/OnboardingProvider";
import { colors, radii } from "@/theme/tokens";
import { fonts } from "@/theme/typography";

export function SettingsScreen() {
  const { logout, user } = useSession();
  const { replayTour } = useOnboarding();

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  return (
    <AppScreen>
      <View style={pageHeaderStyles.header}>
        <Text style={pageHeaderStyles.title}>Profile</Text>
        <Text allowFontScaling={false} style={pageHeaderStyles.subtitle}>
          Account session and profile details for your Clutch Odds login.
        </Text>
      </View>

      <SectionCard
        title="Account session"
        description="Signed-in identity and session controls for this device."
      >
        <Text style={styles.row}>
          Signed in as:{" "}
          <Text style={styles.value}>{user?.email ?? "Guest"}</Text>
        </Text>
        <Text style={styles.row}>
          Name: <Text style={styles.value}>{user?.name ?? "—"}</Text>
        </Text>
        <PrimaryButton
          label="Log out"
          onPress={() => void handleLogout()}
          variant="ghost"
        />
      </SectionCard>

      {user ? (
        <SectionCard
          title="Product tour"
          description="Replay the 5-step intro covering expected value, Arbitrage, Value Bets, and Model Predictions."
        >
          <Pressable
            onPress={() => void replayTour()}
            style={({ pressed }) => [
              styles.replayBtn,
              pressed ? styles.pressed : null,
            ]}
          >
            <Text style={styles.replayText}>Replay tour</Text>
          </Pressable>
        </SectionCard>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  row: {
    fontFamily: fonts.sansRegular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
  },
  value: {
    color: colors.text,
    fontFamily: fonts.sansBold,
  },
  replayBtn: {
    alignSelf: "flex-start",
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  replayText: {
    fontFamily: fonts.sansBold,
    color: "#D4D4D8",
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  pressed: {
    opacity: 0.85,
  },
});
