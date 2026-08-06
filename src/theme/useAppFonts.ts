import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { applyDefaultFonts } from "@/theme/applyDefaultFonts";
import { appFontMap } from "@/theme/typography";

void SplashScreen.preventAutoHideAsync();

export function useAppFonts() {
  const [loaded, error] = useFonts(appFontMap);

  useEffect(() => {
    if (!loaded && !error) return;

    if (loaded) {
      applyDefaultFonts();
    }

    void SplashScreen.hideAsync();
  }, [loaded, error]);

  return { loaded: loaded || Boolean(error), error };
}
