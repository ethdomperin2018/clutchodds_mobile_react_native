/** Matches the web app: Geist (body), Rajdhani (display), Geist Mono (labels). */
export const fonts = {
  sansRegular: "Geist_400Regular",
  sansMedium: "Geist_500Medium",
  sansSemiBold: "Geist_600SemiBold",
  sansBold: "Geist_700Bold",
  sansExtraBold: "Geist_800ExtraBold",
  displayMedium: "Rajdhani_500Medium",
  displaySemiBold: "Rajdhani_600SemiBold",
  displayBold: "Rajdhani_700Bold",
  monoRegular: "GeistMono_400Regular",
  monoMedium: "GeistMono_500Medium",
  monoSemiBold: "GeistMono_600SemiBold",
} as const;

/**
 * Direct font file requires are more reliable with Metro than package barrel
 * imports from the newer @expo-google-fonts packages.
 */
export const appFontMap = {
  Geist_400Regular: require("@expo-google-fonts/geist/400Regular/Geist_400Regular.ttf"),
  Geist_500Medium: require("@expo-google-fonts/geist/500Medium/Geist_500Medium.ttf"),
  Geist_600SemiBold: require("@expo-google-fonts/geist/600SemiBold/Geist_600SemiBold.ttf"),
  Geist_700Bold: require("@expo-google-fonts/geist/700Bold/Geist_700Bold.ttf"),
  Geist_800ExtraBold: require("@expo-google-fonts/geist/800ExtraBold/Geist_800ExtraBold.ttf"),
  GeistMono_400Regular: require("@expo-google-fonts/geist-mono/400Regular/GeistMono_400Regular.ttf"),
  GeistMono_500Medium: require("@expo-google-fonts/geist-mono/500Medium/GeistMono_500Medium.ttf"),
  GeistMono_600SemiBold: require("@expo-google-fonts/geist-mono/600SemiBold/GeistMono_600SemiBold.ttf"),
  Rajdhani_500Medium: require("@expo-google-fonts/rajdhani/500Medium/Rajdhani_500Medium.ttf"),
  Rajdhani_600SemiBold: require("@expo-google-fonts/rajdhani/600SemiBold/Rajdhani_600SemiBold.ttf"),
  Rajdhani_700Bold: require("@expo-google-fonts/rajdhani/700Bold/Rajdhani_700Bold.ttf"),
};

export const typography = {
  body: {
    fontFamily: fonts.sansRegular,
    fontSize: 15,
    lineHeight: 22,
  },
  bodyMuted: {
    fontFamily: fonts.sansRegular,
    fontSize: 14,
    lineHeight: 22,
  },
  bodyStrong: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    lineHeight: 20,
  },
  label: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
  },
  eyebrow: {
    fontFamily: fonts.monoMedium,
    fontSize: 11,
    letterSpacing: 2.2,
    textTransform: "uppercase" as const,
  },
  sectionTitle: {
    fontFamily: fonts.displaySemiBold,
    fontSize: 28,
    lineHeight: 32,
  },
  pageTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 30,
    lineHeight: 34,
  },
  heroTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 40,
    lineHeight: 42,
  },
  cardTitle: {
    fontFamily: fonts.displaySemiBold,
    fontSize: 18,
    letterSpacing: 0.3,
  },
  button: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase" as const,
  },
  nav: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: "uppercase" as const,
  },
  mono: {
    fontFamily: fonts.monoRegular,
    fontSize: 13,
  },
} as const;
