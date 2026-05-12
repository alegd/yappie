import { Pressable, Text, StyleSheet } from "react-native";
import { colors, opacity, radii, spacing, fontSize, fontWeight } from "@/constants/theme";

interface ButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary";
}

export function Button({ label, onPress, disabled, loading, variant = "primary" }: ButtonProps) {
  const isDisabled = disabled || loading;
  const containerStyles = [
    styles.base,
    variant === "primary" ? styles.primary : styles.secondary,
    isDisabled && styles.disabled,
  ];
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      style={containerStyles}
    >
      <Text style={styles.label}>{loading ? `${label} — Loading…` : label}</Text>
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
    backgroundColor: colors.border,
  },
  disabled: {
    opacity: opacity.disabled,
  },
  label: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
});
