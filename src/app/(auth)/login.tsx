import { Redirect, type Href } from "expo-router";

/** Login lives on the marketing homepage mock for this UI pass. */
export default function LoginRoute() {
  return <Redirect href={"/(marketing)" as Href} />;
}
