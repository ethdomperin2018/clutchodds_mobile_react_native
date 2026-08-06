import { usePollingQuery } from "@/lib/query/use-polling-query";
import { oddsApi } from "@/lib/api/endpoints/odds";
import { AppScreen } from "@/components/layout/AppScreen";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusPill } from "@/components/ui/StatusPill";
import { colors, spacing } from "@/theme/tokens";
import { fonts, typography } from "@/theme/typography";
import { StyleSheet, Text, View } from "react-native";

export function DashboardScreen() {
  const snapshotQuery = usePollingQuery({
    queryKey: ["dashboard", "snapshot"],
    queryFn: () => oddsApi.getSnapshot(),
    pollMs: 20_000,
  });

  const snapshot = snapshotQuery.data;

  return (
    <AppScreen>
      <StatusPill label="Live-ready" tone="success" />
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>
          The home surface is already wired for polling so odds snapshots can refresh without rebuilding screen contracts later.
        </Text>
      </View>

      <SectionCard
        title="Backend snapshot"
        description="Currently points to the existing `/api/odds?snapshot=1` endpoint."
      >
        <Text style={styles.metric}>
          Fetch state:{" "}
          <Text style={styles.metricValue}>
            {snapshotQuery.isLoading ? "loading" : snapshotQuery.isError ? "error" : "ready"}
          </Text>
        </Text>
        <Text style={styles.metric}>
          Arbitrage count:{" "}
          <Text style={styles.metricValue}>{snapshot?.arbitrageCount ?? "--"}</Text>
        </Text>
        <Text style={styles.metric}>
          Line shop count:{" "}
          <Text style={styles.metricValue}>{snapshot?.lineShopCount ?? "--"}</Text>
        </Text>
      </SectionCard>

      <SectionCard
        title="Next slices"
        description="Suggested first real widgets once native data design starts."
      >
        <Text style={styles.bullet}>- bankroll summary and PnL strip</Text>
        <Text style={styles.bullet}>- fast market status cards</Text>
        <Text style={styles.bullet}>- shortcuts into arbitrage and edge center</Text>
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
  metric: {
    ...typography.bodyMuted,
    color: colors.textMuted,
  },
  metricValue: {
    color: colors.text,
    fontFamily: fonts.sansBold,
  },
  bullet: {
    color: colors.text,
    fontFamily: fonts.sansRegular,
    fontSize: 14,
    lineHeight: 20,
  },
});
