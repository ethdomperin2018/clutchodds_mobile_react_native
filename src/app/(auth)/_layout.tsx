import { Redirect, Stack, usePathname } from "expo-router";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useSession } from "@/features/auth/SessionProvider";

export default function AuthLayout() {
  const { ready, user } = useSession();
  const pathname = usePathname();
  const onVerifyEmail = pathname.includes("verify-email");
  const onResetPassword = pathname.includes("reset-password");
  const allowSignedInAuthFlow = onVerifyEmail || onResetPassword;

  if (!ready) {
    return <LoadingScreen label="Checking session..." />;
  }

  // Allow verify/reset flows even if a stale session exists.
  if (user && !allowSignedInAuthFlow) {
    return <Redirect href="/(app)/(tabs)/dashboard" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="verify-email" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="reset-password" />
    </Stack>
  );
}
