import { Redirect, type Href } from "expo-router";

/** Old /dashboard bookmarks → home tab. */
export default function DashboardRedirect() {
  return <Redirect href={"/(app)/(tabs)/" as Href} />;
}
