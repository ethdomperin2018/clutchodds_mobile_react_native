import { ScrollView, StyleSheet, Text, View } from "react-native";
import { BookLogo } from "@/components/BookLogo";
import {
  pageChromeStyles,
  pageHeaderStyles,
} from "@/components/layout/pageHeaderStyles";
import { getBookDisplayName } from "@/lib/bookmakerDisplay";
import {
  TRACKED_EXCHANGE_KEYS,
  TRACKED_SPORTSBOOK_KEYS,
} from "@/lib/odds/venues";
import { fonts } from "@/theme/typography";

export function BookmakersScreen() {
  return (
    <ScrollView
      contentContainerStyle={pageChromeStyles.scroll}
      showsVerticalScrollIndicator={false}
      style={pageChromeStyles.root}
    >
      <View style={pageHeaderStyles.header}>
        <Text style={pageHeaderStyles.title}>Bookmakers</Text>
        <Text allowFontScaling={false} style={pageHeaderStyles.subtitle}>
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
              <View style={styles.card} accessibilityLabel={name}>
                <BookLogo bookKey={key} bookTitle={name} size={20} />
                <Text numberOfLines={2} style={styles.cardTitle}>
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
    marginHorizontal: -4,
  },
  cell: {
    width: "33.333%",
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  card: {
    alignItems: "center",
    gap: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#161616",
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  cardTitle: {
    width: "100%",
    fontFamily: fonts.sansMedium,
    color: "#E4E4E7",
    fontSize: 10,
    lineHeight: 12,
    textAlign: "center",
  },
});
