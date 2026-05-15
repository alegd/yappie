import { View, Text, StyleSheet } from "react-native";
import { borderWidth, colors, font, fontSize, radii, spacing } from "@/constants/theme";

export type BadgeVariant =
  | "low"
  | "medium"
  | "high"
  | "critical"
  | "draft"
  | "approved"
  | "exported"
  | "rejected"
  | "pending"
  | "transcribing"
  | "analyzing"
  | "completed"
  | "failed";

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
  pending: colors.textDim,
  transcribing: colors.warning,
  analyzing: colors.warning,
  completed: colors.success,
  failed: colors.danger,
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
    borderWidth: borderWidth.thin,
    alignSelf: "flex-start",
  },
  label: {
    fontFamily: font.body.medium,
    fontSize: fontSize.badge,
    letterSpacing: 0.5,
  },
});
