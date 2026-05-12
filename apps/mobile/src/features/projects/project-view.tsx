import { View, Text, FlatList, StyleSheet } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { EmptyState } from "@/components/ui/empty-state";
import { HeaderTitle } from "@/components/ui/header-title";
import { Skeleton } from "@/components/ui/skeleton";
import { AudioRow } from "@/features/audios/audio-row";
import { colors, fontSize, radii, spacing } from "@/constants/theme";
import { getProject } from "@/lib/api/projects";
import { listAudios } from "@/lib/api/audios";
import { queryKeys } from "@/lib/query-keys";

export function ProjectView() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const projectQuery = useQuery({
    queryKey: queryKeys.project(id),
    queryFn: () => getProject(id),
    enabled: Boolean(id),
  });

  const audiosQuery = useQuery({
    queryKey: queryKeys.projectAudios(id),
    queryFn: () => listAudios(id),
    enabled: Boolean(id),
  });

  const loading = projectQuery.isLoading || audiosQuery.isLoading;
  const project = projectQuery.data;
  const audios = audiosQuery.data?.data ?? [];

  return (
    <View style={styles.container}>
      {project ? (
        <View style={styles.header}>
          <HeaderTitle title={project.name} />
          {project.description ? (
            <Text style={styles.description}>{project.description}</Text>
          ) : null}
        </View>
      ) : (
        <View style={styles.headerSkeleton}>
          <Skeleton width="60%" height={28} borderRadius={radii.sm} />
          <Skeleton width="80%" height={14} borderRadius={radii.sm} />
        </View>
      )}

      {loading && audios.length === 0 ? (
        <View style={styles.skeletons}>
          <Skeleton width="100%" height={80} borderRadius={radii.md} />
          <Skeleton width="100%" height={80} borderRadius={radii.md} />
        </View>
      ) : audios.length === 0 ? (
        <EmptyState
          headline="No audios yet"
          body="Tap the record button to capture your first audio in this project."
        />
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
  header: {
    paddingBottom: spacing.md,
    gap: spacing.xs,
  },
  description: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  headerSkeleton: {
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },
  skeletons: {
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  list: {
    paddingTop: spacing.md,
    paddingBottom: spacing.huge,
    gap: spacing.sm,
  },
});
