import { Pressable, StyleSheet, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
      ? { bottom: insets.bottom + spacing.sm, left: insets.left + spacing.lg }
      : { bottom: insets.bottom + spacing.sm, right: insets.right + spacing.lg };

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.button, positionStyle, pressed && styles.pressed]}
    >
      <Ionicons name={iconName} size={iconSize.xl} color={colors.text} />
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
