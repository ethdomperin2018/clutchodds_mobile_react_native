import { StyleSheet, Text, View } from "react-native";
import { TeamLogo } from "@/components/TeamLogo";
import { awayAtHomeLabel } from "@/lib/teamDisplay";
import { fonts } from "@/theme/typography";

export function MatchupHero({
  homeTeam,
  awayTeam,
  sportKey,
  subline,
  align = "center",
}: {
  homeTeam: string;
  awayTeam: string;
  sportKey?: string;
  subline?: string;
  align?: "center" | "start";
}) {
  const label = awayAtHomeLabel(awayTeam, homeTeam);

  return (
    <View
      style={[
        styles.row,
        align === "center" ? styles.center : styles.start,
      ]}
    >
      <TeamLogo size={36} sportKey={sportKey} teamName={awayTeam} />
      <View style={[styles.copy, align === "center" ? styles.copyCenter : null]}>
        <Text numberOfLines={2} style={styles.title}>
          {label}
        </Text>
        {subline ? <Text style={styles.subline}>{subline}</Text> : null}
      </View>
      <TeamLogo size={36} sportKey={sportKey} teamName={homeTeam} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    maxWidth: "100%",
  },
  center: {
    justifyContent: "center",
  },
  start: {
    justifyContent: "flex-start",
  },
  copy: {
    minWidth: 0,
    flexShrink: 1,
    maxWidth: 160,
  },
  copyCenter: {
    alignItems: "center",
  },
  title: {
    fontFamily: fonts.displaySemiBold,
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  subline: {
    marginTop: 4,
    fontFamily: fonts.sansRegular,
    color: "#71717A",
    fontSize: 12,
  },
});
