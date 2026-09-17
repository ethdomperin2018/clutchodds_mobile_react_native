import { Image, Platform, StyleSheet, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { env } from "@/config/env";

type SportTabIconId = "all" | "mlb" | "nba" | "nfl" | "nhl";

export function sportKeyToTabIcon(sportKey: string): SportTabIconId {
  const key = sportKey.toLowerCase();
  if (key === "all") return "all";
  if (key.includes("nba")) return "nba";
  if (key.includes("nfl") || key.includes("football_nfl")) return "nfl";
  if (key.includes("nhl") || key.includes("hockey")) return "nhl";
  if (key.includes("mlb") || key.includes("baseball")) return "mlb";
  return "all";
}

export function SportTabIcon({
  sportKey,
  size = 20,
  color = "#A1A1AA",
}: {
  sportKey: string;
  size?: number;
  color?: string;
}) {
  const icon = sportKeyToTabIcon(sportKey);
  if (icon === "all") {
    return (
      <Svg fill="none" height={size} viewBox="0 0 24 24" width={size}>
        <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={1.75} />
        <Path
          d="M12 3c2.5 2.8 4 6.2 4 9s-1.5 6.2-4 9M12 3c-2.5 2.8-4 6.2-4 9s1.5 6.2 4 9M3 12h18"
          stroke={color}
          strokeWidth={1.75}
        />
      </Svg>
    );
  }

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Image
        resizeMode="contain"
        source={{
          uri:
            Platform.OS === "web"
              ? `/leagues/${icon}.svg`
              : `${env.apiBaseUrl}/leagues/${icon}.svg`,
        }}
        style={{ width: size, height: size }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
  },
});
