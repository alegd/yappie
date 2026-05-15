import { SettingsButton } from "@/components/navigation/settings-button";
import { GlassHeader, useGlassHeader } from "@/components/ui/glass-header";
import { HeaderTitle } from "@/components/ui/header-title";
import { ListRow } from "@/components/ui/list-row";
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
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";

export function ProjectsList() {
  const router = useRouter();
  const { height: headerHeight, onLayout: onHeaderLayout } = useGlassHeader();

  const projectsQuery = useQuery({
    queryKey: queryKeys.projects,
    queryFn: () => listProjects(),
  });

  const hasZeroProjects = projectsQuery.isSuccess && (projectsQuery.data?.data.length ?? 0) === 0;

  useEffect(() => {
    if (hasZeroProjects) {
      router.replace("/onboarding");
    }
  }, [hasZeroProjects, router]);

  const listPaddingTop = headerHeight + spacing.md;

  const renderHeader = () => (
    <GlassHeader onLayout={onHeaderLayout}>
      <View style={styles.titleRow}>
        <HeaderTitle title="Projects" />
        <View style={styles.titleActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Create project"
            onPress={() => router.push({ pathname: "/project-form", params: { mode: "create" } })}
            style={({ pressed }) => [styles.plusButton, pressed && styles.plusPressed]}
          >
            <Ionicons name="add" size={iconSize.md} color={colors.text} />
          </Pressable>
          <SettingsButton />
        </View>
      </View>
    </GlassHeader>
  );

  if (projectsQuery.isLoading) {
    return (
      <View style={styles.container}>
        <View style={[styles.skeletons, { paddingTop: listPaddingTop }]}>
          <Skeleton width="100%" height={60} borderRadius={radii.md} />
          <Skeleton width="100%" height={60} borderRadius={radii.md} />
          <Skeleton width="100%" height={60} borderRadius={radii.md} />
        </View>
        {renderHeader()}
      </View>
    );
  }

  const projects = projectsQuery.data?.data ?? [];

  return (
    <View style={styles.container}>
      <FlatList
        data={projects}
        keyExtractor={(p) => p.id}
        contentContainerStyle={[styles.list, { paddingTop: listPaddingTop }]}
        renderItem={({ item }) => (
          <ListRow
            title={item.name}
            subtitle={item.description ?? undefined}
            onPress={() => router.push(`/projects/${item.id}`)}
          />
        )}
      />
      {renderHeader()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.huge,
    gap: spacing.sm,
  },
  skeletons: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
});
