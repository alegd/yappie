import { Pressable, Text, StyleSheet } from "react-native";

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
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  primary: {
    backgroundColor: "#f97316",
  },
  secondary: {
    backgroundColor: "#27272a",
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fafafa",
  },
});
