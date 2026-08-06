import { Redirect, Stack } from "expo-router";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useSession } from "@/features/auth/SessionProvider";

export default function AppLayout() {
  const { ready, user } = useSession();

  if (!ready) {
    return <LoadingScreen label="Restoring session..." />;
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
