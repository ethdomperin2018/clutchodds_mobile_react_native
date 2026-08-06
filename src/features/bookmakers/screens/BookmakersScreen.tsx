import { FlashList } from "@shopify/flash-list";
import { StyleSheet, Text, View } from "react-native";
import { AppScreen } from "@/components/layout/AppScreen";
import { SectionCard } from "@/components/ui/SectionCard";
import { colors, radii, spacing } from "@/theme/tokens";
import { fonts, typography } from "@/theme/typography";

const placeholderBookmakers = [
  "FanDuel",
  "DraftKings",
  "BetMGM",
  "Caesars",
  "Fanatics",
  "ESPN BET",
];

export function BookmakersScreen() {
  return (
    <AppScreen scrollable={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Bookmakers</Text>
        <Text style={styles.subtitle}>
          FlashList is in place for fast scrolling once sportsbook metadata, deep links, and state availability are wired in.
        </Text>
      </View>

      <SectionCard
        title="Bookmaker directory"
        description="This is a placeholder list intended to evolve into logo-rich cards with geo/state support."
      >
        <View style={styles.listContainer}>
          <FlashList
            data={placeholderBookmakers}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <Text style={styles.rowTitle}>{item}</Text>
                <Text style={styles.rowMeta}>Connected later</Text>
              </View>
            )}
          />
        </View>
      </SectionCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: spacing.lg,
    paddingBottom: 0,
    gap: spacing.sm,
    backgroundColor: colors.background,
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
  listContainer: {
    minHeight: 320,
  },
  row: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  rowTitle: {
    fontFamily: fonts.displaySemiBold,
    color: colors.text,
    fontSize: 16,
  },
  rowMeta: {
    ...typography.bodyMuted,
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
});
