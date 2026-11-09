import { Pressable, StyleSheet, Text, View } from "react-native";
import { SportTabIcon } from "@/components/SportTabIcon";
import { SCANNER_SPORT_TABS } from "@/lib/scanner/sportTabs";
import { colors } from "@/theme/tokens";
import { fonts } from "@/theme/typography";

/**
 * Same sport chrome as Arbitrage / web `SportTabs` (All · MLB · NBA · NFL · NHL).
 */
export function PredictionSportTabs({
  active,
  counts,
  onChange,
}: {
  active: string;
  counts?: Record<string, number>;
  onChange: (key: string) => void;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {SCANNER_SPORT_TABS.map((tab) => {
          const isActive = active === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => onChange(tab.key)}
              style={styles.tab}
            >
              <View style={styles.tabInner}>
                <View style={styles.labelRow}>
                  <SportTabIcon
                    color={isActive ? "#FFFFFF" : "#71717A"}
                    size={16}
                    sportKey={tab.key}
                  />
                  <Text
                    numberOfLines={1}
                    style={[styles.tabText, isActive ? styles.tabTextOn : null]}
                  >
                    {tab.label}
                    {counts ? (
                      <Text
                        style={[
                          styles.count,
                          isActive ? styles.countOn : null,
                        ]}
                      >
                        {` ${counts[tab.key] ?? 0}`}
                      </Text>
                    ) : null}
                  </Text>
                </View>
                <View
                  style={[
                    styles.underline,
                    isActive ? styles.underlineOn : null,
                  ]}
                />
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(24,24,27,0.8)",
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 4,
  },
  row: {
    flexDirection: "row",
    width: "100%",
  },
  tab: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
  },
  tabInner: {
    maxWidth: "100%",
    alignItems: "center",
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 2,
    paddingTop: 8,
    paddingBottom: 8,
  },
  tabText: {
    fontFamily: fonts.sansMedium,
    color: "#71717A",
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center",
  },
  tabTextOn: {
    color: "#FFFFFF",
  },
  count: {
    fontFamily: fonts.sansMedium,
    color: "#52525B",
    fontSize: 12,
    lineHeight: 16,
  },
  countOn: {
    color: "#FFFFFF",
  },
  underline: {
    height: 2,
    alignSelf: "stretch",
    backgroundColor: "transparent",
  },
  underlineOn: {
    backgroundColor: colors.primary,
  },
});
