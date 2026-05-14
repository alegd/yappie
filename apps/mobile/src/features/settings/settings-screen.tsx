import { Alert, View, Text, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as WebBrowser from "expo-web-browser";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { HeaderTitle } from "@/components/ui/header-title";
import { useAuthStore } from "@/features/auth/auth-store";
import { useAuth } from "@/features/auth/use-auth";
import { colors, fontSize, fontWeight, spacing } from "@/constants/theme";
import { disconnectJira, getJiraStatus, startJiraAuth } from "@/lib/api/jira";
import { getQuota } from "@/lib/api/quotas";
import { queryKeys } from "@/lib/query-keys";

const JIRA_RETURN_PATH = "yappie://settings";

export function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const { logout } = useAuth();
  const queryClient = useQueryClient();

  const jiraQuery = useQuery({
    queryKey: queryKeys.jiraStatus,
    queryFn: () => getJiraStatus(),
  });

  const quotaQuery = useQuery({
    queryKey: queryKeys.quota,
    queryFn: () => getQuota(),
  });

  const connectJira = useMutation({
    mutationFn: async () => {
      const { url } = await startJiraAuth(JIRA_RETURN_PATH);
      const result = await WebBrowser.openAuthSessionAsync(url, JIRA_RETURN_PATH);
      return result;
    },
    onSuccess: (result) => {
      if (result.type === "success") {
        queryClient.invalidateQueries({ queryKey: queryKeys.jiraStatus });
        queryClient.invalidateQueries({ queryKey: queryKeys.jiraProjects });
      }
    },
  });

  const disconnectJiraMutation = useMutation({
    mutationFn: () => disconnectJira(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jiraStatus });
      queryClient.invalidateQueries({ queryKey: queryKeys.jiraProjects });
    },
  });

  const handleDisconnectJira = () => {
    Alert.alert("Disconnect Jira", "You'll need to reconnect to export tickets to Jira.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Disconnect",
        style: "destructive",
        onPress: () => disconnectJiraMutation.mutate(),
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + spacing.md }]}>
      <HeaderTitle title="Settings" />

      <Text style={styles.sectionLabel}>Account</Text>
      <Card>
        <Text style={styles.value}>{user?.name ?? "—"}</Text>
        <Text style={styles.subtle}>{user?.email ?? "—"}</Text>
      </Card>

      <Text style={styles.sectionLabel}>Plan</Text>
      <Card>
        <Text style={styles.value}>{quotaQuery.data?.plan ?? "—"}</Text>
        {quotaQuery.data ? (
          <Text style={styles.subtle}>
            {quotaQuery.data.usedMinutes} / {quotaQuery.data.limitMinutes} minutes used this cycle
          </Text>
        ) : null}
      </Card>

      <Text style={styles.sectionLabel}>Integrations</Text>
      <Card>
        <Text style={styles.value}>Jira</Text>
        {jiraQuery.data?.connected ? (
          <View style={styles.connectWrap}>
            <Text style={styles.subtleConnected}>Connected</Text>
            <Button
              label="Disconnect Jira"
              onPress={handleDisconnectJira}
              variant="secondary"
              loading={disconnectJiraMutation.isPending}
            />
          </View>
        ) : (
          <View style={styles.connectWrap}>
            <Text style={styles.subtle}>Not connected</Text>
            <Button
              label="Connect Jira"
              onPress={() => connectJira.mutate()}
              variant="secondary"
              loading={connectJira.isPending}
            />
          </View>
        )}
      </Card>

      <View style={styles.signOutWrap}>
        <Button
          label="Sign out"
          onPress={() => logout.mutate()}
          variant="secondary"
          loading={logout.isPending}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
    backgroundColor: colors.background,
    flexGrow: 1,
  },
  sectionLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginTop: spacing.lg,
  },
  value: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  subtle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  subtleConnected: {
    fontSize: fontSize.sm,
    color: colors.success,
    marginTop: spacing.xs,
    fontWeight: fontWeight.semibold,
  },
  connectWrap: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  signOutWrap: {
    marginTop: spacing.xxl,
  },
});
