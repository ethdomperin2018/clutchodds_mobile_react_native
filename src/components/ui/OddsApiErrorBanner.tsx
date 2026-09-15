import { StyleSheet, Text, View } from "react-native";
import {
  resolveOddsApiErrorDisplay,
  type OddsApiErrorCode,
} from "@/lib/odds/oddsApiErrors";
import { fonts } from "@/theme/typography";

type OddsApiErrorBannerProps = {
  error: string;
  errorCode?: string;
  errorTitle?: string;
};

const TONE: Record<
  OddsApiErrorCode,
  { border: string; background: string; body: string }
> = {
  OUT_OF_USAGE_CREDITS: {
    border: "rgba(120,53,15,0.6)",
    background: "rgba(69,26,3,0.4)",
    body: "#FEF3C7",
  },
  MISSING_API_KEY: {
    border: "rgba(127,29,29,0.6)",
    background: "rgba(69,10,10,0.4)",
    body: "#FEE2E2",
  },
  UNAUTHORIZED: {
    border: "rgba(127,29,29,0.6)",
    background: "rgba(69,10,10,0.4)",
    body: "#FEE2E2",
  },
  UNKNOWN: {
    border: "rgba(120,53,15,0.6)",
    background: "rgba(69,26,3,0.4)",
    body: "#FDE68A",
  },
};

export function OddsApiErrorBanner({
  error,
  errorCode,
  errorTitle,
}: OddsApiErrorBannerProps) {
  const display = resolveOddsApiErrorDisplay({ error, errorCode, errorTitle });
  const tone = TONE[display.code] ?? TONE.UNKNOWN;

  return (
    <View
      style={[
        styles.banner,
        { borderColor: tone.border, backgroundColor: tone.background },
      ]}
    >
      <Text style={styles.title}>{display.title}</Text>
      <Text style={[styles.message, { color: tone.body }]}>
        {display.message}
      </Text>
      {display.code === "OUT_OF_USAGE_CREDITS" ? (
        <Text style={styles.hint}>
          This is a provider quota limit, not a problem with your Clutch Odds
          account.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
  },
  title: {
    fontFamily: fonts.sansMedium,
    color: "#FFFFFF",
    fontSize: 14,
  },
  message: {
    fontFamily: fonts.sansRegular,
    fontSize: 13,
    lineHeight: 19,
    opacity: 0.9,
  },
  hint: {
    marginTop: 2,
    fontFamily: fonts.sansRegular,
    color: "#FDE68A",
    fontSize: 11,
    lineHeight: 16,
    opacity: 0.75,
  },
});
