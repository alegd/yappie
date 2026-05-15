import { View, Text, Pressable, FlatList, StyleSheet } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { EmptyState } from "@/components/ui/empty-state";
import { GlassHeader, useGlassHeader } from "@/components/ui/glass-header";
import { HeaderTitle } from "@/components/ui/header-title";
import { Skeleton } from "@/components/ui/skeleton";
import { AudioRow } from "@/features/audios/audio-row";
import { colors, font, fontSize, iconSize, opacity, radii, spacing } from "@/constants/theme";
import { getProject } from "@/lib/api/projects";
import { listAudios } from "@/lib/api/audios";
import { queryKeys } from "@/lib/query-keys";

export function ProjectView() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { height: headerHeight, onLayout: onHeaderLayout } = useGlassHeader();

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

  const listHeader = project?.description ? (
    <Text style={styles.description}>{project.description}</Text>
  ) : null;

  const listEmpty = loading ? (
    <View style={styles.skeletons}>
      <Skeleton width="100%" height={80} borderRadius={radii.md} />
      <Skeleton width="100%" height={80} borderRadius={radii.md} />
    </View>
  ) : (
    <EmptyState
      headline="No audios yet"
      body="Tap the record button to capture your first audio in this project."
    />
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={audios}
        keyExtractor={(a) => a.id}
        contentContainerStyle={[styles.list, { paddingTop: headerHeight + spacing.md }]}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        renderItem={({ item }) => (
          <AudioRow audio={item} onPress={() => router.push(`/audios/${item.id}`)} />
        )}
      />

      <GlassHeader onLayout={onHeaderLayout}>
        <View style={styles.headerRow}>
          {project ? (
            <>
              <View style={styles.headerTitle}>
                <HeaderTitle title={project.name} />
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Edit project"
                onPress={() => router.push({ pathname: "/project-form", params: { mode: "edit", id: project.id } })}
                style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
              >
                <Ionicons name="create-outline" size={iconSize.md} color={colors.text} />
              </Pressable>
            </>
          ) : (
            <View style={styles.headerSkeleton}>
              <Skeleton width="60%" height={28} borderRadius={radii.sm} />
            </View>
          )}
        </View>
      </GlassHeader>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    flex: 1,
  },
  editButton: {
    padding: spacing.sm,
  },
  pressed: {
    opacity: opacity.pressed,
  },
  headerSkeleton: {
    gap: spacing.sm,
    flex: 1,
  },
  description: {
    fontFamily: font.body.regular,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  skeletons: {
    gap: spacing.sm,
  },
  list: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.huge,
    gap: spacing.sm,
  },
});
