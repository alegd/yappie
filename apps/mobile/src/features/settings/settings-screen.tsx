import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { HeaderTitle } from "@/components/ui/header-title";
import { useAuthStore } from "@/features/auth/auth-store";
import { useAuth } from "@/features/auth/use-auth";
import { colors, fontSize, fontWeight, spacing } from "@/constants/theme";
import { getJiraStatus } from "@/lib/api/jira";
import { getQuota } from "@/lib/api/quotas";
import { queryKeys } from "@/lib/query-keys";

export function SettingsScreen() {
  const user = useAuthStore((s) => s.user);
  const { logout } = useAuth();

  const jiraQuery = useQuery({
    queryKey: queryKeys.jiraStatus,
    queryFn: () => getJiraStatus(),
  });

  const quotaQuery = useQuery({
    queryKey: queryKeys.quota,
    queryFn: () => getQuota(),
  });

  return (
    <ScrollView contentContainerStyle={styles.container}>
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
          <Text style={styles.subtleConnected}>Connected</Text>
        ) : (
          <View style={styles.connectWrap}>
            <Text style={styles.subtle}>Not connected</Text>
            <Button label="Connect Jira" onPress={() => {}} variant="secondary" />
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
