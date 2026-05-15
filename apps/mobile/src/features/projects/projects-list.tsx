import { useEffect, useState } from "react";
import { View, FlatList, Pressable, StyleSheet, type LayoutChangeEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { GlassView } from "expo-glass-effect";
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

const HEADER_FALLBACK_HEIGHT = 120;

export function ProjectsList() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [headerHeight, setHeaderHeight] = useState<number | null>(null);

  const handleHeaderLayout = (e: LayoutChangeEvent) => {
    setHeaderHeight(e.nativeEvent.layout.height);
  };

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

  const listPaddingTop = (headerHeight ?? HEADER_FALLBACK_HEIGHT) + spacing.md;

  const renderHeader = (subtitle?: string) => (
    <GlassView
      onLayout={handleHeaderLayout}
      glassEffectStyle="regular"
      colorScheme="dark"
      style={[styles.header, { paddingTop: insets.top + spacing.md }]}
    >
      <View style={styles.titleRow}>
        <HeaderTitle title="Projects" subtitle={subtitle} />
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
    </GlassView>
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
      {renderHeader(`${projects.length} total`)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
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
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
});
