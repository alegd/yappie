import { Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, useSegments } from "expo-router";
import {
  borderWidth,
  colors,
  componentSize,
  iconSize,
  opacity,
  radii,
  spacing,
} from "@/constants/theme";

const HIDDEN_ROUTES = ["settings", "record"];
const PROJECT_DETAIL_SEGMENT = "projects";

export function FloatingRecordButton() {
  const router = useRouter();
  const segments = useSegments();
  const params = useLocalSearchParams<{ id?: string }>();
  const insets = useSafeAreaInsets();

  const isHidden = segments.some((segment) => HIDDEN_ROUTES.includes(segment));
  if (isHidden) return null;

  const handlePress = () => {
    const isProjectDetail =
      segments.includes(PROJECT_DETAIL_SEGMENT) && segments.some((s) => s === "[id]");
    if (isProjectDetail && params.id) {
      router.push(`/record?projectId=${params.id}`);
    } else {
      router.push("/record");
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel="Record audio"
      style={({ pressed }) => [
        styles.button,
        { bottom: insets.bottom + spacing.sm, right: insets.right + spacing.lg },
        pressed && styles.pressed,
      ]}
    >
      <Ionicons name="mic-outline" size={iconSize.xl} color={colors.text} />
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
