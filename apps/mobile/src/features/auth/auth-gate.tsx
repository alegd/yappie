import { useEffect, type ReactNode } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useAuthStore } from "./auth-store";

interface AuthGateProps {
  children: ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const hydrated = useAuthStore((s) => s.hydrated);
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!hydrated) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator color="#fafafa" />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0a0a0a",
  },
});
