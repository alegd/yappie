import { useState } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import BottomSheet from "@gorhom/bottom-sheet";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { getJiraProjects, getJiraStatus } from "@/lib/api/jira";
import { queryKeys } from "@/lib/query-keys";
import { borderWidth, colors, font, fontSize, opacity, radii, spacing } from "@/constants/theme";

const SNAP_POINTS = ["50%"];

interface JiraProjectSelectorProps {
  value: string | null;
  onChange: (key: string) => void;
}

export function JiraProjectSelector({ value, onChange }: JiraProjectSelectorProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [hasOpenedSheet, setHasOpenedSheet] = useState(false);

  const statusQuery = useQuery({
    queryKey: queryKeys.jiraStatus,
    queryFn: () => getJiraStatus(),
  });
  const connected = statusQuery.data?.connected ?? false;

  const projectsQuery = useQuery({
    queryKey: queryKeys.jiraProjects,
    queryFn: () => getJiraProjects(),
    enabled: connected && hasOpenedSheet,
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

  const projects = projectsQuery.data ?? [];

  const handleOpen = () => {
    setHasOpenedSheet(true);
    setOpen(true);
  };

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Select Jira project"
        onPress={handleOpen}
        style={({ pressed }) => [styles.field, pressed && styles.pressed]}
      >
        <Text style={value ? styles.fieldValue : styles.fieldPlaceholder}>
          {value ?? "Select Jira project"}
        </Text>
      </Pressable>
      <BottomSheet
        index={open ? 0 : -1}
        snapPoints={SNAP_POINTS}
        enablePanDownToClose
        onClose={() => setOpen(false)}
        backgroundStyle={{ backgroundColor: colors.surface }}
        handleIndicatorStyle={{ backgroundColor: colors.textDim }}
      >
        <ScrollView contentContainerStyle={styles.sheetContent}>
          {projectsQuery.isError ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Retry loading Jira projects"
              onPress={() => projectsQuery.refetch()}
              style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
            >
              <Text style={styles.ctaText}>Couldn&apos;t load Jira projects. Tap to retry.</Text>
            </Pressable>
          ) : projectsQuery.isLoading ? (
            <Text style={styles.statusText}>Loading…</Text>
          ) : (
            projects.map((project) => (
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
            ))
          )}
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
    fontFamily: font.body.regular,
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
    fontFamily: font.body.regular,
    fontSize: fontSize.md,
    color: colors.text,
  },
  fieldPlaceholder: {
    fontFamily: font.body.regular,
    fontSize: fontSize.md,
    color: colors.textDim,
  },
  sheetContent: {
    padding: spacing.lg,
    gap: spacing.xs,
  },
  statusText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    paddingVertical: spacing.md,
  },
  option: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
  },
  optionText: {
    fontFamily: font.body.medium,
    fontSize: fontSize.md,
    color: colors.text,
  },
  pressed: {
    opacity: opacity.pressed,
  },
});
