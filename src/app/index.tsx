import { Redirect, type Href } from "expo-router";

export default function IndexRoute() {
  return <Redirect href={"/(marketing)" as Href} />;
}
