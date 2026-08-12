import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import {
  Image,
  type ImageSourcePropType,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  NavIconAlerts,
  NavIconArbitrage,
  NavIconBookmakers,
  NavIconEdgeCenter,
} from "@/components/icons/appNavIcons";
import { useSession } from "@/features/auth/SessionProvider";
import { colors } from "@/theme/tokens";
import { fonts } from "@/theme/typography";

const TEAM = {
  atl: require("../../../../assets/images/teams/mlb/atl.png"),
  tex: require("../../../../assets/images/teams/mlb/tex.png"),
  nyy: require("../../../../assets/images/teams/mlb/nyy.png"),
  pit: require("../../../../assets/images/teams/mlb/pit.png"),
} as const;

type TeamLogoProps = {
  source: ImageSourcePropType;
  size?: number;
  /** Dark ink logos (Yankees, etc.) need a light plate on dark cards. */
  lightPlate?: boolean;
};

function TeamLogo({ source, size = 36, lightPlate = false }: TeamLogoProps) {
  return (
    <View
      style={[
        styles.teamLogoWrap,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: lightPlate ? colors.text : "transparent",
        },
      ]}
    >
      <Image
        source={source}
        style={{ width: size * 0.78, height: size * 0.78 }}
        resizeMode="contain"
      />
    </View>
  );
}

function greetingForHour(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const MOCK_ALERTS = [
  {
    id: "1",
    tone: "neutral" as const,
    icon: "star-four-points" as const,
    title: "New Arbitrage",
    body: "4.57% profit on NYY @ PIT",
    time: "5m ago",
  },
  {
    id: "2",
    tone: "edge" as const,
    icon: "bell" as const,
    title: "Edge Alert",
    body: "Braves @ Rangers +6.24% edge",
    time: "8m ago",
  },
];

const QUICK_ACCESS: {
  key: string;
  title: string;
  subtitle: string;
  href: Href;
  Icon: typeof NavIconEdgeCenter;
}[] = [
  {
    key: "edge",
    title: "Edge Center",
    subtitle: "Find the best value bets",
    href: "/(app)/(tabs)/edge-center",
    Icon: NavIconEdgeCenter,
  },
  {
    key: "arb",
    title: "Arbitrage",
    subtitle: "Find risk-free profit",
    href: "/(app)/(tabs)/arbitrage",
    Icon: NavIconArbitrage,
  },
  {
    key: "books",
    title: "Line Shopping",
    subtitle: "Compare every book",
    href: "/(app)/(tabs)/bookmakers",
    Icon: NavIconBookmakers,
  },
  {
    key: "alerts",
    title: "Alerts",
    subtitle: "Your notifications",
    href: "/(app)/(tabs)/alerts",
    Icon: NavIconAlerts,
  },
];

export function DashboardScreen() {
  const { user } = useSession();
  const firstName = (user?.name ?? "Alan").trim().split(/\s+/)[0] || "Alan";
  const greeting = greetingForHour(new Date().getHours());

  return (
    <View style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Dashboard</Text>
        <Text style={styles.greeting}>
          {greeting}, {firstName} 👋
        </Text>

        <Pressable style={styles.edgeCard}>
          <Text style={styles.edgeEyebrow}>{"TODAY'S BEST EDGE"}</Text>

          <View style={styles.edgeTop}>
            <TeamLogo source={TEAM.atl} size={40} lightPlate />
            <View style={styles.edgeMatch}>
              <Text style={styles.matchTitle}>Braves @ Rangers</Text>
              <Text style={styles.matchMeta}>MLB · Today 8:05 PM</Text>
            </View>
            <View style={styles.edgeRight}>
              <Text style={styles.edgeLabel}>Edge</Text>
              <Text style={styles.edgePct}>+6.24%</Text>
            </View>
          </View>

          <View style={styles.edgeDivider} />

          <View style={styles.edgeStats}>
            <View style={styles.edgeStatCell}>
              <TeamLogo source={TEAM.tex} size={28} lightPlate />
              <View style={styles.edgeStatEnd}>
                <Text style={styles.edgeStatLabel}>EV</Text>
                <Text style={styles.edgeStatGreen}>+124</Text>
              </View>
            </View>

            <View style={styles.edgeStatRule} />

            <View style={styles.edgeStatCell}>
              <View style={styles.edgeStatStart}>
                <Text style={styles.edgeStatLabel}>Confidence</Text>
                <Text style={styles.edgeStatValue}>8.6/10</Text>
              </View>
              <TeamLogo source={TEAM.tex} size={28} lightPlate />
            </View>
          </View>
        </Pressable>

        <Pressable style={[styles.pairCard, styles.arbCard]}>
          <Text style={styles.pairEyebrow}>BEST ARBITRAGE</Text>
          <View style={styles.pairBody}>
            <View style={styles.pairCopy}>
              <Text style={styles.pairMatch}>Yankees @ Pirates</Text>
              <Text style={styles.pairPct}>4.57%</Text>
              <Text style={styles.pairSub}>Profit</Text>
              <Text style={styles.pairMoney}>$45.67</Text>
            </View>
            <View style={styles.pairMarksRow}>
              <TeamLogo source={TEAM.nyy} size={28} lightPlate />
              <TeamLogo source={TEAM.pit} size={28} />
            </View>
          </View>
        </Pressable>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionEyebrowInline}>RECENT ALERTS</Text>
          <Pressable onPress={() => router.push("/(app)/(tabs)/alerts")}>
            <Text style={styles.viewAll}>View All</Text>
          </Pressable>
        </View>

        <View style={styles.alertList}>
          {MOCK_ALERTS.map((alert, index) => (
            <Pressable
              key={alert.id}
              style={[
                styles.alertRow,
                index < MOCK_ALERTS.length - 1 ? styles.alertRowBorder : null,
              ]}
            >
              <View
                style={[
                  styles.alertIcon,
                  alert.tone === "edge"
                    ? styles.alertIconEdge
                    : styles.alertIconNeutral,
                ]}
              >
                <MaterialCommunityIcons
                  color={
                    alert.tone === "edge" ? colors.success : colors.textMuted
                  }
                  name={alert.icon}
                  size={14}
                />
              </View>
              <View style={styles.alertCopy}>
                <View style={styles.alertTitleRow}>
                  <Text style={styles.alertTitle} numberOfLines={1}>
                    {alert.title}
                  </Text>
                  <Text style={styles.alertTime}>{alert.time}</Text>
                </View>
                <Text style={styles.alertBody} numberOfLines={2}>
                  {alert.body}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.sectionEyebrow, styles.quickLabel]}>
          QUICK ACCESS
        </Text>
        <View style={styles.quickGrid}>
          {QUICK_ACCESS.map((item) => (
            <Pressable
              key={item.key}
              onPress={() => router.push(item.href)}
              style={({ pressed }) => [
                styles.quickCard,
                pressed ? styles.pressed : null,
              ]}
            >
              <View style={styles.quickIcon}>
                <item.Icon color={colors.text} size={17} />
              </View>
              <View style={styles.quickCopy}>
                <Text style={styles.quickTitle}>{item.title}</Text>
                <Text style={styles.quickSub} numberOfLines={2}>
                  {item.subtitle}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28,
  },
  pageTitle: {
    fontFamily: fonts.sansBold,
    color: colors.text,
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  greeting: {
    fontFamily: fonts.sansRegular,
    color: colors.text,
    fontSize: 15,
    marginTop: 4,
    marginBottom: 14,
    opacity: 0.92,
  },
  sectionEyebrow: {
    fontFamily: fonts.sansSemiBold,
    color: colors.textMuted,
    fontSize: 11,
    letterSpacing: 1.05,
    marginBottom: 8,
  },
  sectionEyebrowInline: {
    fontFamily: fonts.sansSemiBold,
    color: colors.textMuted,
    fontSize: 11,
    letterSpacing: 1.05,
  },
  edgeCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  edgeEyebrow: {
    fontFamily: fonts.sansSemiBold,
    color: colors.text,
    fontSize: 11,
    letterSpacing: 1.05,
    marginBottom: 12,
  },
  edgeTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  edgeMatch: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  matchTitle: {
    fontFamily: fonts.sansSemiBold,
    color: colors.text,
    fontSize: 15,
  },
  matchMeta: {
    fontFamily: fonts.sansRegular,
    color: colors.textMuted,
    fontSize: 12,
  },
  edgeRight: {
    alignItems: "flex-end",
  },
  edgeLabel: {
    fontFamily: fonts.sansMedium,
    color: colors.textMuted,
    fontSize: 11,
  },
  edgePct: {
    fontFamily: fonts.sansBold,
    color: colors.success,
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: -0.4,
  },
  edgeDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  edgeStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  edgeStatCell: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  edgeStatStart: {
    gap: 3,
    alignItems: "flex-start",
  },
  edgeStatEnd: {
    gap: 3,
    alignItems: "flex-end",
  },
  edgeStatLabel: {
    fontFamily: fonts.sansRegular,
    color: colors.textMuted,
    fontSize: 11,
  },
  edgeStatGreen: {
    fontFamily: fonts.sansBold,
    color: colors.success,
    fontSize: 16,
  },
  edgeStatValue: {
    fontFamily: fonts.sansSemiBold,
    color: colors.text,
    fontSize: 15,
  },
  edgeStatRule: {
    width: StyleSheet.hairlineWidth,
    alignSelf: "stretch",
    backgroundColor: colors.border,
    marginHorizontal: 12,
  },
  teamLogoWrap: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  arbCard: {
    marginBottom: 16,
  },
  pairCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  pairEyebrow: {
    fontFamily: fonts.sansSemiBold,
    color: colors.textMuted,
    fontSize: 10,
    letterSpacing: 0.7,
    marginBottom: 8,
  },
  pairBody: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  pairCopy: {
    flex: 1,
    minWidth: 0,
  },
  pairMatch: {
    fontFamily: fonts.sansSemiBold,
    color: colors.text,
    fontSize: 14,
    marginBottom: 4,
  },
  pairPct: {
    fontFamily: fonts.sansBold,
    color: colors.text,
    fontSize: 24,
    lineHeight: 28,
  },
  pairSub: {
    fontFamily: fonts.sansRegular,
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  pairMoney: {
    fontFamily: fonts.sansSemiBold,
    color: colors.text,
    fontSize: 14,
    marginTop: 2,
    opacity: 0.85,
  },
  pairMarksRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  viewAll: {
    fontFamily: fonts.sansSemiBold,
    color: colors.primary,
    fontSize: 13,
  },
  alertList: {
    marginBottom: 16,
  },
  alertRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 11,
  },
  alertRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  alertIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  alertIconEdge: {
    backgroundColor: "rgba(34,197,94,0.15)",
  },
  alertIconNeutral: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  alertCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  alertTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  alertTitle: {
    flex: 1,
    fontFamily: fonts.sansSemiBold,
    color: colors.text,
    fontSize: 13,
  },
  alertBody: {
    fontFamily: fonts.sansRegular,
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
  },
  alertTime: {
    fontFamily: fonts.sansRegular,
    color: colors.textMuted,
    fontSize: 11,
  },
  quickLabel: {
    marginBottom: 8,
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  quickCard: {
    width: "47.5%",
    flexGrow: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 11,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  quickIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  quickCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  quickTitle: {
    fontFamily: fonts.sansSemiBold,
    color: colors.text,
    fontSize: 13,
  },
  quickSub: {
    fontFamily: fonts.sansRegular,
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 14,
  },
  pressed: {
    opacity: 0.88,
  },
});
