import { Redirect, Stack } from "expo-router";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useSession } from "@/features/auth/SessionProvider";
import { useAppStoreSync } from "@/lib/billing/inAppPayment";

export default function AppLayout() {
  const { ready, user } = useSession();
  useAppStoreSync();

  if (!ready) {
    return <LoadingScreen label="Restoring session..." />;
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="pricing"
        options={{
          animation: "slide_from_right",
          gestureEnabled: true,
        }}
      />
    </Stack>
  );
}
