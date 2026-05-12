import { View, Text, StyleSheet } from "react-native";
import { ScreenContainer } from "@/components/layout/screen-container";

export default function RecordPage() {
  return (
    <ScreenContainer>
      <View style={styles.container}>
        <Text style={styles.title}>You are signed in</Text>
        <Text style={styles.subtitle}>Record screen coming in Phase 2</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#fafafa",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    color: "#71717a",
  },
});
