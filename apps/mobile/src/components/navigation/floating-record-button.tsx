import { Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, useSegments } from "expo-router";
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

const HIDDEN_ROUTES = ["settings", "record", "project-form"];
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
      router.push({ pathname: "/record", params: { projectId: params.id } });
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
        styles.position,
        { bottom: insets.bottom + spacing.sm, right: insets.right + spacing.xl },
        pressed && styles.pressed,
      ]}
    >
      <GlassView style={styles.fab} glassEffectStyle="regular" colorScheme="dark">
        <Ionicons name="mic-outline" size={iconSize.xl} color={colors.text} />
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
