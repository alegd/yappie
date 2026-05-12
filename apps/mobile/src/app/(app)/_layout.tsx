import { Stack } from "expo-router";
import { View, StyleSheet } from "react-native";
import { ErrorBoundary } from "react-error-boundary";
import * as Sentry from "@sentry/react-native";
import { FloatingRecordButton } from "@/components/navigation/floating-record-button";
import { ErrorScreen } from "@/components/ui/error-screen";
import { ToastContainer } from "@/components/ui/toast";
import { useSocket } from "@/hooks/use-socket";
import { colors } from "@/constants/theme";

export default function AppLayout() {
  useSocket();
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
          <Stack.Screen name="projects/[id]" />
          <Stack.Screen name="audios/[id]" />
          <Stack.Screen name="settings" options={{ headerTitle: "Settings" }} />
          <Stack.Screen
            name="record"
            options={{ presentation: "modal", headerShown: false }}
          />
        </Stack>
        <FloatingRecordButton />
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
