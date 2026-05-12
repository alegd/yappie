import { View, Text, StyleSheet } from "react-native";
import { Button } from "./button";
import { colors, fontSize, fontWeight, spacing } from "@/constants/theme";

interface EmptyStateProps {
  headline: string;
  body: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export function EmptyState({ headline, body, action }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.headline}>{headline}</Text>
      <Text style={styles.body}>{body}</Text>
      {action ? (
        <View style={styles.actionWrap}>
          <Button label={action.label} onPress={action.onPress} variant="primary" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  headline: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    textAlign: "center",
  },
  body: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: "center",
  },
  actionWrap: {
    marginTop: spacing.lg,
  },
});
