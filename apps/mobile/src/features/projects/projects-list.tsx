import { useEffect, useState } from "react";
import { View, FlatList, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { HeaderTitle } from "@/components/ui/header-title";
import { ListRow } from "@/components/ui/list-row";
import { Skeleton } from "@/components/ui/skeleton";
import { colors, radii, spacing } from "@/constants/theme";
import { listProjects } from "@/lib/api/projects";
import { queryKeys } from "@/lib/query-keys";
import { CreateProjectModal } from "./create-project-modal";

export function ProjectsList() {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);

  const projectsQuery = useQuery({
    queryKey: queryKeys.projects,
    queryFn: () => listProjects(),
  });

  const hasZeroProjects =
    projectsQuery.isSuccess && (projectsQuery.data?.data.length ?? 0) === 0;

  useEffect(() => {
    if (hasZeroProjects) {
      router.replace("/onboarding");
    }
  }, [hasZeroProjects, router]);

  if (projectsQuery.isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.titleRow}>
          <HeaderTitle title="Projects" />
        </View>
        <View style={styles.skeletons}>
          <Skeleton width="100%" height={60} borderRadius={radii.md} />
          <Skeleton width="100%" height={60} borderRadius={radii.md} />
          <Skeleton width="100%" height={60} borderRadius={radii.md} />
        </View>
      </View>
    );
  }

  const projects = projectsQuery.data?.data ?? [];

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <HeaderTitle title="Projects" subtitle={`${projects.length} total`} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Create project"
          onPress={() => setModalOpen(true)}
          style={({ pressed }) => [styles.plusButton, pressed && styles.plusPressed]}
        >
          <Ionicons name="add" size={22} color={colors.text} />
        </Pressable>
      </View>

      <FlatList
        data={projects}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <ListRow
            title={item.name}
            subtitle={item.description ?? undefined}
            onPress={() => router.push(`/projects/${item.id}`)}
          />
        )}
      />

      <CreateProjectModal visible={modalOpen} onClose={() => setModalOpen(false)} />
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
  plusButton: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  plusPressed: {
    opacity: 0.6,
  },
  list: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl + spacing.xxl,
    gap: spacing.sm,
  },
  skeletons: {
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
});
