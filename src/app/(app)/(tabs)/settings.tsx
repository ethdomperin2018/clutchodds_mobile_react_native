import { Redirect, type Href } from "expo-router";

/** Old /settings bookmarks → /profile. */
export default function SettingsRedirect() {
  return <Redirect href={"/(app)/(tabs)/profile" as Href} />;
}
