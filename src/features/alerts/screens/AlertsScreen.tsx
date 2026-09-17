import { StyleSheet, Text, View } from "react-native";
import { AppScreen } from "@/components/layout/AppScreen";
import { SectionCard } from "@/components/ui/SectionCard";
import { colors } from "@/theme/tokens";
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
    gap: 6,
  },
  title: {
    ...typography.pageTitle,
    color: "#FFFFFF",
  },
  subtitle: {
    ...typography.pageSubtitle,
  },
  body: {
    ...typography.bodyMuted,
    color: colors.textMuted,
  },
});
