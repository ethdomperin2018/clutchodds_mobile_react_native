import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Platform } from "react-native";
import { AppProviders } from "@/providers/AppProviders";
import { useAppFonts } from "@/theme/useAppFonts";

if (Platform.OS === "web") {
  require("@/styles/web-autofill.css");
}

export default function RootLayout() {
  const { loaded } = useAppFonts();

  if (!loaded) {
    return null;
  }

  return (
    <AppProviders>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(marketing)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
    </AppProviders>
  );
}
