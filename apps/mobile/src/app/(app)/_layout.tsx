import { Redirect, Stack } from "expo-router";
import { View, StyleSheet } from "react-native";
import { ErrorBoundary } from "react-error-boundary";
import * as Sentry from "@sentry/react-native";
import { FloatingRecordButton } from "@/components/navigation/floating-record-button";
import { FloatingBackButton } from "@/components/navigation/floating-back-button";
import { ErrorScreen } from "@/components/ui/error-screen";
import { ToastContainer } from "@/components/ui/toast";
import { useAuthStore } from "@/features/auth/auth-store";
import { useSocket } from "@/hooks/use-socket";
import { colors } from "@/constants/theme";

export default function AppLayout() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const hydrated = useAuthStore((s) => s.hydrated);
  useSocket();

  if (!hydrated) return null;
  if (!accessToken) return <Redirect href="/(auth)/email" />;

  return (
    <ErrorBoundary
      FallbackComponent={ErrorScreen}
      onError={(error) => Sentry.captureException(error)}
    >
      <View style={styles.container}>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerShadowVisible: false,
            headerTitle: "",
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="projects/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="audios/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="settings" options={{ headerShown: false }} />
          <Stack.Screen
            name="record"
            options={{ presentation: "modal", headerShown: false }}
          />
          <Stack.Screen name="project-form" options={{ headerShown: false }} />
        </Stack>
        <FloatingRecordButton />
        <FloatingBackButton />
        <ToastContainer />
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
