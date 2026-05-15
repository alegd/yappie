import { Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useSegments } from "expo-router";
import {
  borderWidth,
  colors,
  componentSize,
  iconSize,
  opacity,
  radii,
  spacing,
} from "@/constants/theme";

const VISIBLE_SEGMENTS = ["[id]", "settings"];

export function FloatingBackButton() {
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();

  const isVisible = segments.some((segment) => VISIBLE_SEGMENTS.includes(segment));
  if (!isVisible) return null;

  return (
    <Pressable
      onPress={() => router.back()}
      accessibilityRole="button"
      accessibilityLabel="Go back"
      style={({ pressed }) => [
        styles.button,
        { bottom: insets.bottom + spacing.sm, left: insets.left + spacing.lg },
        pressed && styles.pressed,
      ]}
    >
      <Ionicons name="chevron-back" size={iconSize.xl} color={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    width: componentSize.fab,
    height: componentSize.fab,
    borderRadius: radii.pill,
    borderWidth: borderWidth.medium,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: opacity.pressedSubtle,
  },
});
