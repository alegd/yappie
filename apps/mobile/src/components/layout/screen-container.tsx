import { type ReactNode } from "react";
import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ScreenContainerProps {
  children: ReactNode;
}

export function ScreenContainer({ children }: ScreenContainerProps) {
  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
      <View style={styles.container}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
});
