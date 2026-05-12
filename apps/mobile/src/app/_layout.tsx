import { useEffect, useState } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { createQueryClient } from "@/lib/query-client";
import { initSentry } from "@/lib/sentry";
import { env } from "@/lib/env";
import { AuthGate } from "@/features/auth/auth-gate";
import { useAuthStore } from "@/features/auth/auth-store";

initSentry(env.sentryDsn);

function RouteRedirect() {
  const router = useRouter();
  const segments = useSegments();
  const accessToken = useAuthStore((s) => s.accessToken);
  const hydrated = useAuthStore((s) => s.hydrated);

  useEffect(() => {
    if (!hydrated) return;
    const inAuthGroup = segments[0] === "(auth)";
    if (!accessToken && !inAuthGroup) {
      router.replace("/(auth)/email");
    } else if (accessToken && inAuthGroup) {
      router.replace("/projects");
    }
  }, [accessToken, hydrated, segments, router]);

  return null;
}

export default function RootLayout() {
  const [client] = useState(() => createQueryClient());

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={client}>
          <AuthGate>
            <RouteRedirect />
            <Slot />
          </AuthGate>
          <StatusBar style="auto" />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
