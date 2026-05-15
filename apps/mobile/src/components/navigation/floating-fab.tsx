import { Pressable, StyleSheet, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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

interface FloatingFabProps {
  side: "left" | "right";
  iconName: React.ComponentProps<typeof Ionicons>["name"];
  accessibilityLabel: string;
  onPress: () => void;
}

export function FloatingFab({ side, iconName, accessibilityLabel, onPress }: FloatingFabProps) {
  const insets = useSafeAreaInsets();
  const positionStyle: ViewStyle =
    side === "left"
      ? { bottom: insets.bottom + spacing.sm, left: insets.left + spacing.xl }
      : { bottom: insets.bottom + spacing.sm, right: insets.right + spacing.xl };

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.position, positionStyle, pressed && styles.pressed]}
    >
      <GlassView style={styles.fab} glassEffectStyle="regular" colorScheme="dark">
        <Ionicons name={iconName} size={iconSize.xl} color={colors.text} />
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
