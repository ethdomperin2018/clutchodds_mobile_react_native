import { ScrollView, StyleSheet, Text, View } from "react-native";
import { BookLogo } from "@/components/BookLogo";
import { getBookDisplayName } from "@/lib/bookmakerDisplay";
import {
  TRACKED_EXCHANGE_KEYS,
  TRACKED_SPORTSBOOK_KEYS,
} from "@/lib/odds/venues";
import { colors } from "@/theme/tokens";
import { fonts, typography } from "@/theme/typography";

export function BookmakersScreen() {
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.header}>
        <Text style={styles.title}>Bookmakers</Text>
        <Text style={styles.subtitle}>
          Sportsbooks and exchanges we track from The Odds API — US books,
          Polymarket, Kalshi, Novig, and Pinnacle.
        </Text>
      </View>
      <BookmakerSection keys={TRACKED_SPORTSBOOK_KEYS} title="Sportsbooks" />
      <BookmakerSection keys={TRACKED_EXCHANGE_KEYS} title="Exchanges" />
    </ScrollView>
  );
}

function BookmakerSection({
  title,
  keys,
}: {
  title: string;
  keys: readonly string[];
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        {title}{" "}
        <Text style={styles.sectionCount}>{keys.length}</Text>
      </Text>
      <View style={styles.grid}>
        {keys.map((key) => {
          const name = getBookDisplayName(key);
          return (
            <View key={key} style={styles.cell}>
              <View style={styles.row}>
                <BookLogo bookKey={key} bookTitle={name} size={32} />
                <Text numberOfLines={1} style={styles.rowTitle}>
                  {name}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 32,
    backgroundColor: colors.background,
  },
  header: {
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(39,39,42,0.8)",
    gap: 6,
  },
  title: {
    ...typography.pageTitle,
    color: "#FFFFFF",
  },
  subtitle: {
    ...typography.pageSubtitle,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontFamily: fonts.sansSemiBold,
    color: "#71717A",
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  sectionCount: {
    fontFamily: fonts.sansSemiBold,
    color: "#52525B",
    fontSize: 11,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
  },
  cell: {
    width: "50%",
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(24,24,27,0.4)",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowTitle: {
    flex: 1,
    fontFamily: fonts.sansMedium,
    color: "#FFFFFF",
    fontSize: 14,
  },
});
