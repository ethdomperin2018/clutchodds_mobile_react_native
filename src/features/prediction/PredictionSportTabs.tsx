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
  onChange,
}: {
  active: string;
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
                <SportTabIcon
                  color={isActive ? "#FFFFFF" : "#71717A"}
                  size={20}
                  sportKey={tab.key}
                />
                <Text
                  numberOfLines={1}
                  style={[styles.tabText, isActive ? styles.tabTextOn : null]}
                >
                  {tab.label}
                </Text>
              </View>
              <View
                style={[
                  styles.underline,
                  isActive ? styles.underlineOn : null,
                ]}
              />
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
    alignItems: "stretch",
  },
  tabInner: {
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
  },
  tabTextOn: {
    color: "#FFFFFF",
  },
  underline: {
    height: 2,
    width: "100%",
    backgroundColor: "transparent",
  },
  underlineOn: {
    backgroundColor: colors.primary,
  },
});
