import { StyleSheet, Text, View } from "react-native";
import { AppScreen } from "@/components/layout/AppScreen";
import { SectionCard } from "@/components/ui/SectionCard";
import { colors, spacing } from "@/theme/tokens";
import { typography } from "@/theme/typography";

export function AlertsScreen() {
  return (
    <AppScreen>
      <View style={styles.header}>
        <Text style={styles.title}>Alerts</Text>
        <Text style={styles.subtitle}>
          Telegram and in-app alert preferences will live here.
        </Text>
      </View>

      <SectionCard
        title="Coming soon"
        description="Connect alert channels and manage notification preferences from this tab."
      >
        <Text style={styles.body}>
          No alert settings are wired yet. This tab is ready for the Alerts experience.
        </Text>
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
  body: {
    ...typography.bodyMuted,
    color: colors.textMuted,
  },
});
