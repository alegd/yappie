import { Pressable, Text, StyleSheet } from "react-native";
import { borderWidth, colors, font, opacity, radii, spacing, fontSize } from "@/constants/theme";

interface ButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary" | "danger";
}

const containerByVariant = {
  primary: "primary",
  secondary: "secondary",
  danger: "danger",
} as const;

const labelByVariant = {
  primary: "labelPrimary",
  secondary: "labelSecondary",
  danger: "labelPrimary",
} as const;

export function Button({ label, onPress, disabled, loading, variant = "primary" }: ButtonProps) {
  const isDisabled = disabled || loading;
  const containerStyles = [
    styles.base,
    styles[containerByVariant[variant]],
    isDisabled && styles.disabled,
  ];
  const labelStyle = styles[labelByVariant[variant]];
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      style={containerStyles}
    >
      <Text style={labelStyle}>{loading ? `${label} — Loading…` : label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.md,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: "transparent",
    borderWidth: borderWidth.medium,
    borderColor: colors.primary,
  },
  danger: {
    backgroundColor: colors.danger,
  },
  disabled: {
    opacity: opacity.disabled,
  },
  labelPrimary: {
    fontFamily: font.heading.semibold,
    fontSize: fontSize.md,
    color: "#FFFFFF",
  },
  labelSecondary: {
    fontFamily: font.heading.semibold,
    fontSize: fontSize.md,
    color: colors.primary,
  },
});
