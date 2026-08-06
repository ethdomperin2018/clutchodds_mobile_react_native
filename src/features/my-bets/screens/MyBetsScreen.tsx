import { useQuery } from "@tanstack/react-query";
import { AppScreen } from "@/components/layout/AppScreen";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusPill } from "@/components/ui/StatusPill";
import { betsApi } from "@/lib/api/endpoints/bets";
import { colors, spacing } from "@/theme/tokens";
import { fonts, typography } from "@/theme/typography";
import { StyleSheet, Text, View } from "react-native";

export function MyBetsScreen() {
  const betsQuery = useQuery({
    queryKey: ["bets", "recent"],
    queryFn: () => betsApi.list(20),
  });

  return (
    <AppScreen>
      <StatusPill label="Backend-linked" tone="success" />
      <View style={styles.header}>
        <Text style={styles.title}>My Bets</Text>
        <Text style={styles.subtitle}>
          Ready for bet logging, history, and tracked outcomes against the existing `/api/bets` endpoint.
        </Text>
      </View>

      <SectionCard
        title="Query status"
        description="The list layer is intentionally minimal until the real mobile bet log card design is in place."
      >
        <Text style={styles.row}>
          State:{" "}
          <Text style={styles.value}>
            {betsQuery.isLoading ? "loading" : betsQuery.isError ? "error" : "ready"}
          </Text>
        </Text>
        <Text style={styles.row}>
          Recent bets:{" "}
          <Text style={styles.value}>{betsQuery.data?.bets.length ?? "--"}</Text>
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
  row: {
    ...typography.bodyMuted,
    color: colors.textMuted,
  },
  value: {
    color: colors.text,
    fontFamily: fonts.sansBold,
  },
});
