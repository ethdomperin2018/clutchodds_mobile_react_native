import { useQuery } from "@tanstack/react-query";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import {
  pageChromeStyles,
  pageHeaderStyles,
} from "@/components/layout/pageHeaderStyles";
import { SectionCard } from "@/components/ui/SectionCard";
import { betsApi } from "@/lib/api/endpoints/bets";
import { colors } from "@/theme/tokens";
import { fonts } from "@/theme/typography";

export function MyBetsScreen() {
  const betsQuery = useQuery({
    queryKey: ["bets", "recent"],
    queryFn: () => betsApi.list(20),
  });

  return (
    <ScrollView
      contentContainerStyle={pageChromeStyles.scroll}
      showsVerticalScrollIndicator={false}
      style={pageChromeStyles.root}
    >
      <View style={pageHeaderStyles.header}>
        <Text style={pageHeaderStyles.title}>My Bets</Text>
        <Text allowFontScaling={false} style={pageHeaderStyles.subtitle}>
          Manual bet log. Log arbs from the arbitrage board or picks from value
          bets.
        </Text>
      </View>

      <SectionCard
        title="Query status"
        description="The list layer is intentionally minimal until the real mobile bet log card design is in place."
      >
        <Text style={styles.row}>
          State:{" "}
          <Text style={styles.value}>
            {betsQuery.isLoading
              ? "loading"
              : betsQuery.isError
                ? "error"
                : "ready"}
          </Text>
        </Text>
        <Text style={styles.row}>
          Recent bets:{" "}
          <Text style={styles.value}>
            {betsQuery.data?.bets.length ?? "--"}
          </Text>
        </Text>
      </SectionCard>
    </ScrollView>
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
});
