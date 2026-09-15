import { Image, StyleSheet, Text, View } from "react-native";
import { teamBadgeColors, teamMonogram } from "@/lib/teamDisplay";
import {
  getTeamLogoSource,
  teamLogoNeedsLightPlate,
} from "@/lib/teamLogos";
import { fonts } from "@/theme/typography";

type TeamLogoProps = {
  teamName: string;
  sportKey?: string;
  size?: number;
};

export function TeamLogo({ teamName, sportKey, size = 36 }: TeamLogoProps) {
  const source = getTeamLogoSource(sportKey, teamName);
  const needsLightPlate = teamLogoNeedsLightPlate(sportKey, teamName);
  const { bg, fg } = teamBadgeColors(teamName);
  const monogram = teamMonogram(teamName);
  const fontSize = size <= 20 ? 8 : size <= 28 ? 9 : 11;
  const imagePad = needsLightPlate
    ? size <= 20
      ? 4
      : size <= 28
        ? 5
        : 6
    : 2;

  if (source != null) {
    return (
      <View
        style={[
          styles.badge,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: needsLightPlate ? "#FFFFFF" : "#09090B",
            borderColor: needsLightPlate
              ? "rgba(161,161,170,0.7)"
              : "rgba(255,255,255,0.3)",
          },
        ]}
      >
        <Image
          source={source}
          style={{
            width: size - imagePad * 2,
            height: size - imagePad * 2,
          }}
          resizeMode="contain"
        />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.badge,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
        },
      ]}
    >
      <Text style={[styles.text, { color: fg, fontSize }]} numberOfLines={1}>
        {monogram.slice(0, size <= 18 ? 2 : 3)}
      </Text>
    </View>
  );
}

type TeamLogoPairProps = {
  awayTeam: string;
  homeTeam: string;
  sportKey?: string;
  size?: number;
};

export function TeamLogoPair({
  awayTeam,
  homeTeam,
  sportKey,
  size = 28,
}: TeamLogoPairProps) {
  return (
    <View style={styles.pair}>
      <TeamLogo size={size} sportKey={sportKey} teamName={awayTeam} />
      <View style={[styles.overlap, { marginLeft: -size * 0.28 }]}>
        <TeamLogo size={size} sportKey={sportKey} teamName={homeTeam} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
  },
  text: {
    fontFamily: fonts.displayBold,
    textTransform: "uppercase",
  },
  pair: {
    flexDirection: "row",
    alignItems: "center",
  },
  overlap: {
    zIndex: 0,
  },
});
