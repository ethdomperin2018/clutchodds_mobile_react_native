import { QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SessionProvider } from "@/features/auth/SessionProvider";
import { queryClient } from "@/lib/query/query-client";
import type { PropsWithChildren } from "react";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <SessionProvider>{children}</SessionProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
