import { Redirect, type Href } from "expo-router";

/** More is a tab-bar menu only — deep links fall back to Dashboard. */
export default function MoreRoute() {
  return <Redirect href={"/(app)/(tabs)/" as Href} />;
}
