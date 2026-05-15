import { useEffect, useState } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import * as SplashScreen from "expo-splash-screen";
import {
  useFonts,
  Sora_500Medium,
  Sora_600SemiBold,
  Sora_700Bold,
  Sora_800ExtraBold,
} from "@expo-google-fonts/sora";
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";
import { createQueryClient } from "@/lib/query-client";
import { initSentry } from "@/lib/sentry";
import { env } from "@/lib/env";
import { AuthGate } from "@/features/auth/auth-gate";
import { useAuthStore } from "@/features/auth/auth-store";

initSentry(env.sentryDsn);
SplashScreen.preventAutoHideAsync().catch(() => {});

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
  const [fontsLoaded] = useFonts({
    Sora_500Medium,
    Sora_600SemiBold,
    Sora_700Bold,
    Sora_800ExtraBold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={client}>
          <AuthGate>
            <RouteRedirect />
            <Slot />
          </AuthGate>
          <StatusBar style="light" />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
