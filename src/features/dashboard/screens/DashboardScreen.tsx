import { useState } from "react";
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
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from "react-native-svg";
import {
  NavIconArbitrage,
  NavIconBookmakers,
  NavIconEdgeCenter,
  NavIconPrediction,
} from "@/components/icons/appNavIcons";
import { useSession } from "@/features/auth/SessionProvider";
import { colors } from "@/theme/tokens";
import { fonts } from "@/theme/typography";

const TEAM = {
  atl: require("../../../../assets/images/teams/mlb/atl.png"),
  tex: require("../../../../assets/images/teams/mlb/tex.png"),
  nyy: require("../../../../assets/images/teams/mlb/nyy.png"),
  pit: require("../../../../assets/images/teams/mlb/pit.png"),
  bos: require("../../../../assets/images/teams/mlb/bos.png"),
  lal: require("../../../../assets/images/teams/nba/lal.png"),
  bosNba: require("../../../../assets/images/teams/nba/bos.png"),
  edm: require("../../../../assets/images/teams/nhl/edm.png"),
} as const;

const PORTFOLIO_POINTS = [18, 28, 22, 36, 42, 38, 55, 62, 58, 78];

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

function PortfolioSparkline({
  width,
  height = 56,
}: {
  width: number;
  height?: number;
}) {
  if (width <= 0) return null;

  const padX = 4;
  const padY = 6;
  const min = Math.min(...PORTFOLIO_POINTS);
  const max = Math.max(...PORTFOLIO_POINTS);
  const range = Math.max(max - min, 1);
  const step = (width - padX * 2) / (PORTFOLIO_POINTS.length - 1);

  const coords = PORTFOLIO_POINTS.map((value, index) => {
    const x = padX + index * step;
    const y = padY + (1 - (value - min) / range) * (height - padY * 2);
    return { x, y };
  });

  const line = coords
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`)
    .join(" ");
  const area = `${line} L${coords[coords.length - 1]!.x} ${height} L${coords[0]!.x} ${height} Z`;

  return (
    <Svg height={height} width={width}>
      <Defs>
        <LinearGradient id="portfolioFill" x1="0" x2="0" y1="0" y2="1">
          <Stop offset="0" stopColor={colors.success} stopOpacity="0.35" />
          <Stop offset="1" stopColor={colors.success} stopOpacity="0.02" />
        </LinearGradient>
      </Defs>
      <Path d={area} fill="url(#portfolioFill)" />
      <Path
        d={line}
        fill="none"
        stroke={colors.success}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      />
      {coords.map((point, index) => (
        <Circle
          key={index}
          cx={point.x}
          cy={point.y}
          fill={colors.success}
          r={3}
          stroke={colors.surface}
          strokeWidth={1.5}
        />
      ))}
    </Svg>
  );
}

function PortfolioSparklineMeasured() {
  const [width, setWidth] = useState(0);
  return (
    <View
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={styles.sparkInner}
    >
      <PortfolioSparkline height={52} width={width} />
    </View>
  );
}

function greetingForHour(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const MOCK_VALUE_BETS = [
  {
    id: "1",
    title: "Lakers -4.5",
    meta: "NBA vs GSW",
    edge: "+5.12%",
    logo: TEAM.lal,
    lightPlate: true,
  },
  {
    id: "2",
    title: "Oilers ML",
    meta: "NHL vs CGY",
    edge: "+4.32%",
    logo: TEAM.edm,
    lightPlate: false,
  },
  {
    id: "3",
    title: "Over 8.5",
    meta: "MLB NYY @ BOS",
    edge: "+3.87%",
    logo: TEAM.nyy,
    lightPlate: true,
  },
];

/** Ranked by highest pre-game model win probability. */
const MOCK_PREDICTIONS = [
  {
    id: "1",
    title: "Celtics",
    meta: "NBA vs MIA",
    winPct: "68%",
    marketPct: "Mkt 61%",
    logo: TEAM.bosNba,
    lightPlate: true,
  },
  {
    id: "2",
    title: "Yankees",
    meta: "MLB @ BOS",
    winPct: "64%",
    marketPct: "Mkt 58%",
    logo: TEAM.nyy,
    lightPlate: true,
  },
  {
    id: "3",
    title: "Oilers",
    meta: "NHL vs CGY",
    winPct: "61%",
    marketPct: "Mkt 55%",
    logo: TEAM.edm,
    lightPlate: false,
  },
];

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
    key: "prediction",
    title: "Prediction",
    subtitle: "Model favorites",
    href: "/(app)/(tabs)/prediction",
    Icon: NavIconPrediction,
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

        <View style={styles.splitRow}>
          <View style={[styles.splitCard, styles.listCard]}>
            <View style={styles.splitHeader}>
              <Text style={styles.splitTitle}>TOP VALUE BETS</Text>
              <Pressable
                onPress={() => router.push("/(app)/(tabs)/edge-center")}
              >
                <Text style={styles.viewAllSm}>View All</Text>
              </Pressable>
            </View>

            {MOCK_VALUE_BETS.map((bet, index) => (
              <Pressable
                key={bet.id}
                onPress={() => router.push("/(app)/(tabs)/edge-center")}
                style={[
                  styles.valueRow,
                  index < MOCK_VALUE_BETS.length - 1
                    ? styles.valueRowBorder
                    : null,
                ]}
              >
                <TeamLogo
                  lightPlate={bet.lightPlate}
                  size={26}
                  source={bet.logo}
                />
                <View style={styles.valueCopy}>
                  <Text style={styles.valueTitle} numberOfLines={1}>
                    {bet.title}
                  </Text>
                  <Text style={styles.valueMeta} numberOfLines={1}>
                    {bet.meta}
                  </Text>
                </View>
                <Text style={styles.valueEdge}>{bet.edge}</Text>
              </Pressable>
            ))}
          </View>

          <View style={[styles.splitCard, styles.listCard]}>
            <View style={styles.splitHeader}>
              <Text style={styles.splitTitle}>TOP PREDICTIONS</Text>
              <Pressable
                onPress={() => router.push("/(app)/(tabs)/edge-center")}
              >
                <Text style={styles.viewAllSm}>View All</Text>
              </Pressable>
            </View>

            {MOCK_PREDICTIONS.map((pick, index) => (
              <Pressable
                key={pick.id}
                onPress={() => router.push("/(app)/(tabs)/edge-center")}
                style={[
                  styles.valueRow,
                  index < MOCK_PREDICTIONS.length - 1
                    ? styles.valueRowBorder
                    : null,
                ]}
              >
                <TeamLogo
                  lightPlate={pick.lightPlate}
                  size={26}
                  source={pick.logo}
                />
                <View style={styles.valueCopy}>
                  <Text style={styles.valueTitle} numberOfLines={1}>
                    {pick.title}
                  </Text>
                  <Text style={styles.valueMeta} numberOfLines={1}>
                    {pick.meta}
                  </Text>
                </View>
                <View style={styles.predRight}>
                  <Text style={styles.predWin}>{pick.winPct}</Text>
                  <Text style={styles.predMarket}>{pick.marketPct}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={[styles.splitCard, styles.portfolioCard]}>
          <Text style={styles.splitTitle}>PORTFOLIO SUMMARY</Text>
          <View style={styles.portfolioBody}>
            <View style={styles.portfolioMain}>
              <Text style={styles.portfolioLabel}>{"Today's P/L"}</Text>
              <Text style={styles.portfolioPnL}>+$166.93</Text>
              <View style={styles.portfolioStats}>
                <View style={styles.portfolioStat}>
                  <Text style={styles.portfolioLabelTight}>Win Rate</Text>
                  <Text style={styles.portfolioStatValue}>65%</Text>
                </View>
                <View style={styles.portfolioStat}>
                  <Text style={styles.portfolioLabelTight}>Bets</Text>
                  <Text style={styles.portfolioStatValue}>20</Text>
                </View>
              </View>
            </View>
            <View style={styles.sparkWrapWide}>
              <PortfolioSparklineMeasured />
            </View>
          </View>
        </View>

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
    marginBottom: 10,
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
  splitRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  splitCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    minWidth: 0,
  },
  listCard: {
    paddingBottom: 4,
  },
  portfolioCard: {
    marginBottom: 16,
    flex: undefined,
  },
  portfolioBody: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
    marginTop: 4,
  },
  portfolioMain: {
    flex: 1,
    minWidth: 0,
  },
  splitHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
    marginBottom: 6,
  },
  splitTitle: {
    fontFamily: fonts.sansSemiBold,
    color: colors.text,
    fontSize: 10,
    letterSpacing: 0.6,
  },
  viewAllSm: {
    fontFamily: fonts.sansSemiBold,
    color: colors.primary,
    fontSize: 11,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 9,
  },
  valueRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  valueCopy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  valueTitle: {
    fontFamily: fonts.sansSemiBold,
    color: colors.text,
    fontSize: 12,
  },
  valueMeta: {
    fontFamily: fonts.sansRegular,
    color: colors.textMuted,
    fontSize: 10,
  },
  valueEdge: {
    fontFamily: fonts.sansBold,
    color: colors.success,
    fontSize: 12,
  },
  predRight: {
    alignItems: "flex-end",
    gap: 1,
  },
  predWin: {
    fontFamily: fonts.sansBold,
    color: colors.text,
    fontSize: 13,
  },
  predMarket: {
    fontFamily: fonts.sansRegular,
    color: colors.textMuted,
    fontSize: 9,
  },
  portfolioLabel: {
    fontFamily: fonts.sansRegular,
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  portfolioLabelTight: {
    fontFamily: fonts.sansRegular,
    color: colors.textMuted,
    fontSize: 11,
  },
  portfolioPnL: {
    fontFamily: fonts.sansBold,
    color: colors.success,
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: -0.3,
    marginTop: 2,
  },
  portfolioStats: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
  },
  portfolioStat: {
    flex: 1,
    gap: 2,
  },
  portfolioStatValue: {
    fontFamily: fonts.sansBold,
    color: colors.text,
    fontSize: 18,
    lineHeight: 22,
  },
  sparkWrapWide: {
    width: "46%",
    maxWidth: 160,
  },
  sparkInner: {
    width: "100%",
    height: 52,
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
