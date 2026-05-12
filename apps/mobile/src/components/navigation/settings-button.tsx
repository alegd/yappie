import { Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors, componentSize, iconSize, opacity, spacing } from "@/constants/theme";

export function SettingsButton() {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push("/settings")}
      accessibilityRole="button"
      accessibilityLabel="Open settings"
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      hitSlop={spacing.sm}
    >
      <Ionicons name="settings-outline" size={iconSize.md} color={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: componentSize.hitArea,
    height: componentSize.hitArea,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  pressed: {
    opacity: opacity.pressed,
  },
});
