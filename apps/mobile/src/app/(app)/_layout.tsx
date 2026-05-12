import { Slot } from "expo-router";
import { View, StyleSheet } from "react-native";
import { FloatingRecordButton } from "@/components/navigation/floating-record-button";
import { ToastContainer } from "@/components/ui/toast";
import { colors } from "@/constants/theme";

export default function AppLayout() {
  return (
    <View style={styles.container}>
      <Slot />
      <FloatingRecordButton />
      <ToastContainer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
