import { Redirect, Stack } from "expo-router";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useSession } from "@/features/auth/SessionProvider";

export default function AuthLayout() {
  const { ready, user } = useSession();

  if (!ready) {
    return <LoadingScreen label="Checking session..." />;
  }

  if (user) {
    return <Redirect href="/(app)/(tabs)/dashboard" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
    </Stack>
  );
}
