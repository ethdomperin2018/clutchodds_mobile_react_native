import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type TextStyle,
} from "react-native";
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import { openTelegramValueBetsChannel } from "@/lib/openLinks";
import { fonts } from "@/theme/typography";

/** Demo numbers for Understanding Value Edge — same as web. */
const DEMO_FAIR_WIN_PCT = 52;
const DEMO_VALUE_EDGE_PCT = 10;
const demoFairDecimal = 1 / (DEMO_FAIR_WIN_PCT / 100);
const demoBestDecimal = demoFairDecimal * (1 + DEMO_VALUE_EDGE_PCT / 100);
const DEMO_BEST_IMPLIED_PCT = (1 / demoBestDecimal) * 100;

/**
 * Mobile extras under the board — mirrors web `ValueBetsSidebarExtras`
 * (Understanding Value Edge + Telegram alerts).
 */
export function ValueBetsExtras() {
  return (
    <View style={styles.stack}>
      <UnderstandingValueEdgeCard />
      <ValueBetAlertsCard />
    </View>
  );
}

function UnderstandingValueEdgeCard() {
  return (
    <View style={styles.edgeCard}>
      <Text style={styles.cardTitle}>Understanding Value Edge</Text>
      <Text style={styles.cardBody}>
        Value Edge (EV%) is how much better the best available odds are compared
        to our fair odds.
      </Text>
      <View style={styles.demoBox}>
        <View style={styles.demoRow}>
          <View style={styles.demoCol}>
            <Text style={styles.demoLabel}>Our Fair Odds (Win Prob)</Text>
            <View style={styles.demoValueRow}>
              <Text style={styles.demoFair}>
                {DEMO_FAIR_WIN_PCT.toFixed(1)}%
              </Text>
              <Text style={styles.demoHint}>(Implied Prob)</Text>
            </View>
          </View>
          <View style={[styles.demoCol, styles.demoColRight]}>
            <Text style={styles.demoLabel}>Best Odds (Win Prob)</Text>
            <Text style={styles.demoBest}>
              {DEMO_BEST_IMPLIED_PCT.toFixed(1)}%
            </Text>
          </View>
        </View>
        <View style={styles.demoEdgeRow}>
          <Text style={styles.demoEdgeLabel}>Value Edge</Text>
          <Text style={styles.demoEdgeValue}>
            +{DEMO_VALUE_EDGE_PCT.toFixed(1)}%
          </Text>
        </View>
      </View>
      <Text style={styles.cardBody}>
        Positive value edge = long term profit potential.
      </Text>
    </View>
  );
}

function ValueBetAlertsCard() {
  const [wash, setWash] = useState({ w: 1, h: 1 });

  function onLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    if (width !== wash.w || height !== wash.h) setWash({ w: width, h: height });
  }

  return (
    <View onLayout={onLayout} style={styles.alertsCard}>
      <Svg
        height={wash.h}
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
        width={wash.w}
      >
        <Defs>
          <LinearGradient id="vbAlertsWash" x1="0" x2="1" y1="0" y2="1">
            <Stop offset="0" stopColor="#2e1065" stopOpacity="0.45" />
            <Stop offset="0.5" stopColor="#161616" stopOpacity="1" />
            <Stop offset="1" stopColor="#161616" stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect fill="url(#vbAlertsWash)" height={wash.h} width={wash.w} />
      </Svg>
      <View style={styles.alertsRow}>
        <View style={styles.alertsCopy}>
          <Text style={styles.cardTitle}>Get Value Bet Alerts</Text>
          <Text style={styles.cardBody}>
            Never miss high value opportunities, delivered to Telegram.
          </Text>
          <Pressable
            onPress={() => void openTelegramValueBetsChannel()}
            style={({ pressed }) => [
              styles.telegramBtn,
              pressed ? styles.telegramBtnPressed : null,
            ]}
          >
            <Text style={styles.telegramText}>Join Telegram</Text>
            <TelegramIcon />
          </Pressable>
        </View>
        <ValueBetTelegramPhoneMock />
      </View>
    </View>
  );
}

function TelegramIcon() {
  return (
    <Svg fill="#FFFFFF" height={14} viewBox="0 0 24 24" width={14}>
      <Path d="M21.8 4.2L2.9 11.5c-1.3.5-1.3 1.2-.2 1.5l4.8 1.5 1.8 5.6c.2.7.4.9 1 .9.6 0 .8-.3 1.1-.6l2.7-2.6 5.6 4.1c1 .6 1.8.3 2-.9l3.6-17c.4-1.5-.5-2.1-1.5-1.7z" />
    </Svg>
  );
}

function PhoneText({
  children,
  numberOfLines,
  style,
}: {
  children: string;
  numberOfLines?: number;
  style: TextStyle;
}) {
  return (
    <Text allowFontScaling={false} numberOfLines={numberOfLines} style={style}>
      {children}
    </Text>
  );
}

function ValueBetTelegramPhoneMock() {
  return (
    <View style={styles.phoneShadow}>
      <View style={styles.phoneMock}>
        <View collapsable={false} style={styles.phoneInner}>
          <View style={styles.phoneBar} />
          <View style={styles.phoneHeader}>
            <PhoneText numberOfLines={1} style={styles.phoneHeaderText}>
              Clutch Odds Value Bets
            </PhoneText>
          </View>
          <View style={styles.phoneBody}>
            <View style={styles.phoneValueCard}>
              <Svg
                height="100%"
                pointerEvents="none"
                style={StyleSheet.absoluteFill}
                width="100%"
              >
                <Defs>
                  <LinearGradient id="vbPhoneCard" x1="0" x2="1" y1="0" y2="1">
                    <Stop offset="0" stopColor="#0f1a14" />
                    <Stop offset="1" stopColor="#111111" />
                  </LinearGradient>
                </Defs>
                <Rect fill="url(#vbPhoneCard)" height="100%" width="100%" />
              </Svg>
              <PhoneText style={styles.phoneLive}>Live Value Bet</PhoneText>
              <PhoneText style={styles.phoneMatch}>Dodgers ML</PhoneText>
              <PhoneText style={styles.phoneOdds}>-118 · FanDuel</PhoneText>
              <PhoneText style={styles.phoneEv}>+3.30% EV</PhoneText>
            </View>
            <View style={styles.phoneMsg}>
              <PhoneText style={styles.phoneMsgTitle}>
                LIVE VALUE BET · MLB
              </PhoneText>
              <PhoneText style={styles.phoneMsgBody}>
                Dodgers vs Phillies. Dodgers -118 at FanDuel. Best of 11 books,
                worth +3.30% vs sharp fair odds.
              </PhoneText>
              <PhoneText style={styles.phoneMsgLink}>Open Value Bets</PhoneText>
              <PhoneText style={styles.phoneMsgNote}>
                Snapshot — lines move fast. Recheck before betting.
              </PhoneText>
            </View>
            <Svg
              height={48}
              pointerEvents="none"
              style={styles.phoneFade}
              width="100%"
            >
              <Defs>
                <LinearGradient id="vbPhoneFade" x1="0" x2="0" y1="0" y2="1">
                  <Stop offset="0" stopColor="#0e1621" stopOpacity="0" />
                  <Stop offset="1" stopColor="#0e1621" stopOpacity="1" />
                </LinearGradient>
              </Defs>
              <Rect fill="url(#vbPhoneFade)" height="100%" width="100%" />
            </Svg>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 16,
  },
  edgeCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#161616",
    padding: 16,
    gap: 12,
  },
  cardTitle: {
    fontFamily: fonts.sansSemiBold,
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 20,
  },
  cardBody: {
    fontFamily: fonts.sansRegular,
    color: "#A1A1AA",
    fontSize: 12,
    lineHeight: 18,
  },
  demoBox: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "#111111",
    padding: 12,
    gap: 12,
  },
  demoRow: {
    flexDirection: "row",
    gap: 12,
  },
  demoCol: {
    flex: 1,
    minWidth: 0,
  },
  demoColRight: {
    alignItems: "flex-end",
  },
  demoLabel: {
    fontFamily: fonts.sansRegular,
    color: "#71717A",
    fontSize: 9,
    lineHeight: 12,
  },
  demoValueRow: {
    marginTop: 4,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 4,
  },
  demoFair: {
    fontFamily: fonts.displayBold,
    color: "#2DD4BF",
    fontSize: 14,
    fontVariant: ["tabular-nums"],
  },
  demoHint: {
    fontFamily: fonts.sansRegular,
    color: "#71717A",
    fontSize: 9,
  },
  demoBest: {
    marginTop: 4,
    fontFamily: fonts.displayBold,
    color: "#FFFFFF",
    fontSize: 14,
    fontVariant: ["tabular-nums"],
  },
  demoEdgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    paddingTop: 10,
  },
  demoEdgeLabel: {
    fontFamily: fonts.sansSemiBold,
    color: "#FFFFFF",
    fontSize: 12,
  },
  demoEdgeValue: {
    fontFamily: fonts.displayBold,
    color: "#34D399",
    fontSize: 14,
    fontVariant: ["tabular-nums"],
  },
  alertsCard: {
    minWidth: 0,
    overflow: "hidden",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.25)",
    backgroundColor: "#161616",
    padding: 16,
  },
  alertsRow: {
    zIndex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  alertsCopy: {
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  telegramBtn: {
    marginTop: 4,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 8,
    backgroundColor: "#7C3AED",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  telegramBtnPressed: {
    backgroundColor: "#8B5CF6",
  },
  telegramText: {
    fontFamily: fonts.sansBold,
    color: "#FFFFFF",
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  phoneShadow: {
    flexShrink: 0,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 16,
  },
  phoneMock: {
    width: 100,
    height: 172,
    borderRadius: 18.4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "#0E1621",
    overflow: "hidden",
    pointerEvents: "none",
  },
  phoneInner: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 200,
    height: 344,
    transformOrigin: "0% 0%",
    transform: [{ scale: 0.5 }],
  },
  phoneBar: {
    alignSelf: "center",
    width: 48,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginTop: 12,
  },
  phoneHeader: {
    marginTop: 12,
    backgroundColor: "#17212B",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: "rgba(0,0,0,0.3)",
  },
  phoneHeaderText: {
    fontFamily: fonts.sansSemiBold,
    color: "#FFFFFF",
    fontSize: 13,
    lineHeight: 16,
    includeFontPadding: false,
  },
  phoneBody: {
    position: "relative",
    flex: 1,
    margin: 12,
    gap: 8,
  },
  phoneValueCard: {
    overflow: "hidden",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.2)",
    padding: 12,
    gap: 4,
  },
  phoneLive: {
    fontFamily: fonts.sansBold,
    color: "#34D399",
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  phoneMatch: {
    fontFamily: fonts.sansSemiBold,
    color: "#FFFFFF",
    fontSize: 12,
    lineHeight: 14,
  },
  phoneOdds: {
    fontFamily: fonts.sansRegular,
    color: "#D4D4D8",
    fontSize: 11,
    fontVariant: ["tabular-nums"],
  },
  phoneEv: {
    fontFamily: fonts.sansBold,
    color: "#34D399",
    fontSize: 12,
    fontVariant: ["tabular-nums"],
  },
  phoneMsg: {
    borderRadius: 12,
    backgroundColor: "#182533",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 4,
  },
  phoneMsgTitle: {
    fontFamily: fonts.sansSemiBold,
    color: "#FFFFFF",
    fontSize: 11,
  },
  phoneMsgBody: {
    fontFamily: fonts.sansRegular,
    color: "#C5D0DB",
    fontSize: 10,
    lineHeight: 13,
  },
  phoneMsgLink: {
    marginTop: 4,
    fontFamily: fonts.sansMedium,
    color: "#6AB3F3",
    fontSize: 10,
  },
  phoneMsgNote: {
    fontFamily: fonts.sansRegular,
    fontStyle: "italic",
    color: "#8B98A5",
    fontSize: 9,
    lineHeight: 12,
  },
  phoneFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
});
