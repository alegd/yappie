import { useEffect } from "react";
import { View, FlatList, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { HeaderTitle } from "@/components/ui/header-title";
import { ListRow } from "@/components/ui/list-row";
import { SettingsButton } from "@/components/navigation/settings-button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  borderWidth,
  colors,
  componentSize,
  iconSize,
  opacity,
  radii,
  spacing,
} from "@/constants/theme";
import { listProjects } from "@/lib/api/projects";
import { queryKeys } from "@/lib/query-keys";

export function ProjectsList() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

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
      <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.titleRow}>
          <HeaderTitle title="Projects" />
          <SettingsButton />
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
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.titleRow}>
        <HeaderTitle title="Projects" subtitle={`${projects.length} total`} />
        <View style={styles.titleActions}>
          <SettingsButton />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Create project"
            onPress={() => router.push({ pathname: "/project-form", params: { mode: "create" } })}
            style={({ pressed }) => [styles.plusButton, pressed && styles.plusPressed]}
          >
            <Ionicons name="add" size={iconSize.md} color={colors.text} />
          </Pressable>
        </View>
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
  titleActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  plusButton: {
    width: componentSize.hitArea,
    height: componentSize.hitArea,
    borderRadius: radii.pill,
    borderWidth: borderWidth.thin,
    borderColor: colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  plusPressed: {
    opacity: opacity.pressed,
  },
  list: {
    paddingTop: spacing.md,
    paddingBottom: spacing.huge,
    gap: spacing.sm,
  },
  skeletons: {
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
});
