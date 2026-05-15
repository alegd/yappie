import { Pressable, View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  borderWidth,
  colors,
  font,
  fontSize,
  iconSize,
  opacity,
  radii,
  spacing,
} from "@/constants/theme";

interface ListRowProps {
  title: string;
  subtitle?: string;
  onPress: () => void;
}

export function ListRow({ title, subtitle, onPress }: ListRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      accessibilityRole="button"
    >
      <View style={styles.textBlock}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text testID="list-row-subtitle" style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={iconSize.sm} color={colors.textDim} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: borderWidth.thin,
    borderColor: colors.border,
    gap: spacing.md,
  },
  pressed: {
    opacity: opacity.pressedSubtle,
  },
  textBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    fontFamily: font.body.medium,
    fontSize: fontSize.md,
    color: colors.text,
  },
  subtitle: {
    fontFamily: font.body.regular,
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
});
