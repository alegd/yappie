import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet } from "react-native";
import { AccountDeletionScreen } from "@/features/account-deletion/account-deletion-screen";
import { colors } from "@/constants/theme";

export default function DeleteAccountRoute() {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <AccountDeletionScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
