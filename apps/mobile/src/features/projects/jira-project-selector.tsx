import { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { getJiraProjects, getJiraStatus } from "@/lib/api/jira";
import { queryKeys } from "@/lib/query-keys";
import { borderWidth, colors, fontSize, fontWeight, opacity, radii, spacing } from "@/constants/theme";

interface JiraProjectSelectorProps {
  value: string | null;
  onChange: (key: string) => void;
}

export function JiraProjectSelector({ value, onChange }: JiraProjectSelectorProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

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
        onPress={() => setExpanded((open) => !open)}
        style={({ pressed }) => [styles.field, pressed && styles.pressed]}
      >
        <Text style={value ? styles.fieldValue : styles.fieldPlaceholder}>
          {value ?? "Select Jira project"}
        </Text>
      </Pressable>
      {expanded ? (
        <View style={styles.list}>
          {projects.map((project) => (
            <Pressable
              key={project.id}
              accessibilityRole="button"
              accessibilityLabel={`Jira project ${project.key}`}
              onPress={() => {
                onChange(project.key);
                setExpanded(false);
              }}
              style={({ pressed }) => [styles.option, pressed && styles.pressed]}
            >
              <Text style={styles.optionText}>
                {project.key} — {project.name}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
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
  list: {
    marginTop: spacing.xs,
    borderRadius: radii.md,
    borderWidth: borderWidth.thin,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  option: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
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
