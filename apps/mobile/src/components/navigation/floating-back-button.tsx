import { Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useSegments } from "expo-router";
import { GlassView } from "expo-glass-effect";
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
        styles.position,
        { bottom: insets.bottom + spacing.sm, left: insets.left + spacing.xl },
        pressed && styles.pressed,
      ]}
    >
      <GlassView style={styles.fab} glassEffectStyle="regular" colorScheme="dark">
        <Ionicons name="chevron-back" size={iconSize.xl} color={colors.text} />
      </GlassView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  position: {
    position: "absolute",
  },
  pressed: {
    opacity: opacity.pressedSubtle,
  },
  fab: {
    width: componentSize.fab,
    height: componentSize.fab,
    borderRadius: radii.pill,
    borderWidth: borderWidth.medium,
    borderColor: colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
});
