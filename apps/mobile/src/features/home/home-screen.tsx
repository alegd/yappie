import { View, Text, FlatList, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { HeaderTitle } from "@/components/ui/header-title";
import { SettingsButton } from "@/components/navigation/settings-button";
import { Skeleton } from "@/components/ui/skeleton";
import { AudioRow } from "@/features/audios/audio-row";
import { QuotaWidget } from "./quota-widget";
import { colors, font, fontSize, radii, spacing } from "@/constants/theme";
import { listRecentAudios } from "@/lib/api/audios";
import { getQuota } from "@/lib/api/quotas";
import { queryKeys } from "@/lib/query-keys";

export function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const quotaQuery = useQuery({
    queryKey: queryKeys.quota,
    queryFn: () => getQuota(),
  });

  const audiosQuery = useQuery({
    queryKey: queryKeys.recentAudios,
    queryFn: () => listRecentAudios(10),
  });

  const audios = audiosQuery.data?.data ?? [];

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.titleRow}>
        <HeaderTitle title="Home" />
        <SettingsButton />
      </View>

      <View style={styles.section}>
        {quotaQuery.data ? (
          <QuotaWidget quota={quotaQuery.data} />
        ) : (
          <Skeleton width="100%" height={96} borderRadius={radii.md} />
        )}
      </View>

      <Text style={styles.sectionLabel}>Recent audios</Text>

      {audiosQuery.isLoading ? (
        <View style={styles.list}>
          <Skeleton width="100%" height={80} borderRadius={radii.md} />
          <Skeleton width="100%" height={80} borderRadius={radii.md} />
        </View>
      ) : audios.length === 0 ? (
        <Text style={styles.emptyText}>No audios yet. Tap the record button to start.</Text>
      ) : (
        <FlatList
          data={audios}
          keyExtractor={(a) => a.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <AudioRow audio={item} onPress={() => router.push(`/audios/${item.id}`)} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  section: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontFamily: font.body.medium,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontFamily: font.body.regular,
    fontSize: fontSize.sm,
    color: colors.textDim,
    paddingVertical: spacing.lg,
  },
  list: {
    paddingBottom: spacing.huge,
    gap: spacing.sm,
  },
});
