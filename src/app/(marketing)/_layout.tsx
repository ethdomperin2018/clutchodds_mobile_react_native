import { Redirect, Stack } from "expo-router";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useSession } from "@/features/auth/SessionProvider";

export default function MarketingLayout() {
  const { ready, user } = useSession();

  if (!ready) {
    return <LoadingScreen label="Preparing app..." />;
  }

  if (user) {
    return <Redirect href="/(app)/(tabs)/dashboard" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
