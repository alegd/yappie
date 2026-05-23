import { View, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Button } from "@/components/ui/button";
import { colors, font, fontSize, spacing } from "@/constants/theme";

export function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.wordmark}>Yappie</Text>
        <Text style={styles.headline}>Talk. Yappie writes the ticket.</Text>
        <Text style={styles.subhead}>Turn voice notes into Jira tickets in seconds.</Text>
      </View>

      <Button label="Get started" onPress={() => router.push("/email")} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    gap: spacing.huge,
  },
  hero: {
    gap: spacing.lg,
    alignItems: "center",
  },
  wordmark: {
    fontFamily: font.heading.extraBold,
    fontSize: fontSize.display,
    color: colors.primary,
  },
  headline: {
    fontFamily: font.heading.bold,
    fontSize: fontSize.xxl,
    color: colors.text,
    textAlign: "center",
  },
  subhead: {
    fontFamily: font.body.regular,
    fontSize: fontSize.md,
    color: colors.textMuted,
    textAlign: "center",
  },
});
