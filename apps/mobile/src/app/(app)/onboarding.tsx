import { View, Text, StyleSheet } from "react-native";
import { HeaderTitle } from "@/components/ui/header-title";
import { colors, fontSize, spacing } from "@/constants/theme";

export default function OnboardingScreen() {
  return (
    <View style={styles.container}>
      <HeaderTitle title="Welcome to Yappie" subtitle="Create your first project to start." />
      <Text style={styles.placeholder}>
        Inline project creation arrives in the onboarding commit.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
  },
  placeholder: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
});
