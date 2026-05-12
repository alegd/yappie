import { type ReactNode } from "react";
import { Pressable, View, StyleSheet, type ViewStyle, type StyleProp } from "react-native";
import { borderWidth, colors, opacity, radii, spacing } from "@/constants/theme";

interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function Card({ children, onPress, style }: CardProps) {
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.container, pressed && styles.pressed, style]}
        accessibilityRole="button"
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.container, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: borderWidth.thin,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  pressed: {
    opacity: opacity.pressedSubtle,
  },
});
