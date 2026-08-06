import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { AppScreen } from "@/components/layout/AppScreen";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SectionCard } from "@/components/ui/SectionCard";
import { useSession } from "@/features/auth/SessionProvider";
import { colors, spacing } from "@/theme/tokens";
import { fonts, typography } from "@/theme/typography";

export function SettingsScreen() {
  const { logout, user } = useSession();

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  return (
    <AppScreen>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>
          Account, alerts, and app behavior can all hang off this route group without polluting feature screens.
        </Text>
      </View>

      <SectionCard
        title="Account session"
        description="Current scaffold keeps session state in Zustand, persists the last user snapshot in SecureStore, and exposes refresh/login/logout hooks through context."
      >
        <Text style={styles.row}>Signed in as: <Text style={styles.value}>{user?.email ?? "Guest"}</Text></Text>
        <PrimaryButton label="Log out" onPress={() => void handleLogout()} variant="ghost" />
      </SectionCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm,
  },
  title: {
    ...typography.pageTitle,
    color: colors.text,
  },
  subtitle: {
    ...typography.bodyMuted,
    color: colors.textMuted,
    fontSize: 15,
  },
  row: {
    ...typography.bodyMuted,
    color: colors.textMuted,
  },
  value: {
    color: colors.text,
    fontFamily: fonts.sansBold,
  },
});
