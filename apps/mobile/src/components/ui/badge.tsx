import { View, Text, StyleSheet } from "react-native";
import { colors, fontSize, fontWeight, radii, spacing } from "@/constants/theme";

export type BadgeVariant =
  | "low"
  | "medium"
  | "high"
  | "critical"
  | "draft"
  | "approved"
  | "exported"
  | "rejected";

interface BadgeProps {
  label: string;
  variant: BadgeVariant;
}

const variantColor: Record<BadgeVariant, string> = {
  low: colors.priorityLow,
  medium: colors.priorityMedium,
  high: colors.priorityHigh,
  critical: colors.priorityCritical,
  draft: colors.statusDraft,
  approved: colors.statusApproved,
  exported: colors.statusExported,
  rejected: colors.statusRejected,
};

export function Badge({ label, variant }: BadgeProps) {
  const tone = variantColor[variant];
  return (
    <View style={[styles.container, { borderColor: tone }]}>
      <Text style={[styles.label, { color: tone }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    letterSpacing: 0.5,
  },
});
