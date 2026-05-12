import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "./button";
import { colors, fontSize, fontWeight, iconSize, spacing } from "@/constants/theme";

interface ErrorScreenProps {
  error: Error;
  resetErrorBoundary: () => void;
}

export function ErrorScreen({ error, resetErrorBoundary }: ErrorScreenProps) {
  return (
    <View style={styles.container}>
      <Ionicons name="alert-circle-outline" size={iconSize.display} color={colors.danger} />
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.message}>{error.message}</Text>
      <View style={styles.actions}>
        <Button label="Try again" onPress={resetErrorBoundary} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.md,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    textAlign: "center",
  },
  message: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: "center",
  },
  actions: {
    marginTop: spacing.lg,
  },
});
