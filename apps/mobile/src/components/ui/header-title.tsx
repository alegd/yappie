import { View, Text, StyleSheet } from "react-native";
import { colors, font, fontSize, spacing } from "@/constants/theme";

interface HeaderTitleProps {
  title: string;
  subtitle?: string;
}

export function HeaderTitle({ title, subtitle }: HeaderTitleProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? (
        <Text testID="header-subtitle" style={styles.subtitle}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  title: {
    fontFamily: font.heading.bold,
    fontSize: fontSize.xxl,
    color: colors.text,
  },
  subtitle: {
    fontFamily: font.body.regular,
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
});
