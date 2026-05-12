import { View, Text, StyleSheet } from "react-native";
import { HeaderTitle } from "@/components/ui/header-title";
import { colors, fontSize, spacing } from "@/constants/theme";

export default function ProjectsScreen() {
  return (
    <View style={styles.container}>
      <HeaderTitle title="Projects" />
      <Text style={styles.placeholder}>Projects list will be wired in the next commit.</Text>
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
