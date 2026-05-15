import { useRef, useState } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import BottomSheet from "@gorhom/bottom-sheet";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { getJiraProjects, getJiraStatus } from "@/lib/api/jira";
import { queryKeys } from "@/lib/query-keys";
import { borderWidth, colors, fontSize, fontWeight, opacity, radii, spacing } from "@/constants/theme";

const SNAP_POINTS = ["50%"];

interface JiraProjectSelectorProps {
  value: string | null;
  onChange: (key: string) => void;
}

export function JiraProjectSelector({ value, onChange }: JiraProjectSelectorProps) {
  const router = useRouter();
  const sheetRef = useRef<BottomSheet>(null);
  const [open, setOpen] = useState(false);

  const statusQuery = useQuery({
    queryKey: queryKeys.jiraStatus,
    queryFn: () => getJiraStatus(),
  });
  const connected = statusQuery.data?.connected ?? false;

  const projectsQuery = useQuery({
    queryKey: queryKeys.jiraProjects,
    queryFn: () => getJiraProjects(),
    enabled: connected,
  });

  if (statusQuery.isLoading) {
    return null;
  }

  if (!connected) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Connect Jira in Settings"
        onPress={() => router.push("/settings")}
        style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
      >
        <Text style={styles.ctaText}>Connect Jira in Settings to assign a project</Text>
      </Pressable>
    );
  }

  if (projectsQuery.isError) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Retry loading Jira projects"
        onPress={() => projectsQuery.refetch()}
        style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
      >
        <Text style={styles.ctaText}>Couldn&apos;t load Jira projects. Tap to retry.</Text>
      </Pressable>
    );
  }

  const projects = projectsQuery.data ?? [];

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Select Jira project"
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.field, pressed && styles.pressed]}
      >
        <Text style={value ? styles.fieldValue : styles.fieldPlaceholder}>
          {value ?? "Select Jira project"}
        </Text>
      </Pressable>
      <BottomSheet
        ref={sheetRef}
        index={open ? 0 : -1}
        snapPoints={SNAP_POINTS}
        enablePanDownToClose
        onClose={() => setOpen(false)}
        backgroundStyle={{ backgroundColor: colors.surface }}
        handleIndicatorStyle={{ backgroundColor: colors.textDim }}
      >
        <ScrollView contentContainerStyle={styles.sheetContent}>
          {projects.map((project) => (
            <Pressable
              key={project.id}
              accessibilityRole="button"
              accessibilityLabel={`Jira project ${project.key}`}
              onPress={() => {
                onChange(project.key);
                setOpen(false);
              }}
              style={({ pressed }) => [styles.option, pressed && styles.pressed]}
            >
              <Text style={styles.optionText}>
                {project.key} — {project.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  cta: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    borderWidth: borderWidth.thin,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  ctaText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  field: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    borderWidth: borderWidth.thin,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  fieldValue: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  fieldPlaceholder: {
    fontSize: fontSize.md,
    color: colors.textDim,
  },
  sheetContent: {
    padding: spacing.lg,
    gap: spacing.xs,
  },
  option: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
  },
  optionText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  pressed: {
    opacity: opacity.pressed,
  },
});
