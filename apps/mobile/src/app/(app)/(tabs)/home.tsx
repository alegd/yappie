import { View, Text, StyleSheet } from "react-native";
import { HeaderTitle } from "@/components/ui/header-title";
import { colors, fontSize, spacing } from "@/constants/theme";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <HeaderTitle title="Home" />
      <Text style={styles.placeholder}>Quota and recent activity arrive in Phase 5.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
  },
  placeholder: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
});
