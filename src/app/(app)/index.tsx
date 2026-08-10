import { Redirect, type Href } from "expo-router";

/** Signed-in app root always opens the Dashboard tab. */
export default function AppIndex() {
  return <Redirect href={"/(app)/(tabs)/" as Href} />;
}
