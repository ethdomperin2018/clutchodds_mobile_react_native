import Constants from "expo-constants";
import { Platform } from "react-native";

function getDefaultApiBaseUrl() {
  if (Platform.OS === "android") {
    return "http://10.0.2.2:3000";
  }

  if (Platform.OS === "ios") {
    return "http://127.0.0.1:3000";
  }

  return "http://localhost:3000";
}

const expoExtra = Constants.expoConfig?.extra as
  | {
      apiBaseUrl?: string;
    }
  | undefined;

export const env = {
  apiBaseUrl:
    process.env.EXPO_PUBLIC_API_BASE_URL ??
    expoExtra?.apiBaseUrl ??
    getDefaultApiBaseUrl(),
  appName: "Clutch Odds Mobile",
};
