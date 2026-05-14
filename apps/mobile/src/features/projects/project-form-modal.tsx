import { useEffect, useState } from "react";
import { Modal, View, Pressable, Text, ScrollView, StyleSheet } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HeaderTitle } from "@/components/ui/header-title";
import { JiraProjectSelector } from "./jira-project-selector";
import { colors, fontSize, fontWeight, radii, spacing } from "@/constants/theme";
import { createProject, updateProject } from "@/lib/api/projects";
import { queryKeys } from "@/lib/query-keys";
import type { Project } from "@/lib/api/types";

const CONTEXT_MAX_LENGTH = 5000;

interface ProjectFormModalProps {
  visible: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  project?: Project;
  onSaved?: (project: Project) => void;
}

export function ProjectFormModal({
  visible,
  onClose,
  mode,
  project,
  onSaved,
}: ProjectFormModalProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(project?.name ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [context, setContext] = useState(project?.context ?? "");
  const [jiraProjectKey, setJiraProjectKey] = useState<string | null>(
    project?.jiraProjectKey ?? null,
  );
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (visible) {
      setName(project?.name ?? "");
      setDescription(project?.description ?? "");
      setContext(project?.context ?? "");
      setJiraProjectKey(project?.jiraProjectKey ?? null);
      setError(undefined);
    }
  }, [visible, project]);

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        context: context.trim() || undefined,
        jiraProjectKey: jiraProjectKey ?? undefined,
      };
      return mode === "edit" && project
        ? updateProject(project.id, payload)
        : createProject(payload);
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects });
      if (mode === "edit" && project) {
        queryClient.invalidateQueries({ queryKey: queryKeys.project(project.id) });
      }
      setError(undefined);
      onSaved?.(saved);
      onClose();
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const handleSubmit = () => {
    if (!name.trim()) return;
    if (context.length > CONTEXT_MAX_LENGTH) {
      setError(`Context must be ${CONTEXT_MAX_LENGTH} characters or fewer`);
      return;
    }
    mutation.mutate();
  };

  return (
    <Modal
      visible={visible}
      onRequestClose={onClose}
      animationType="slide"
      transparent
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <HeaderTitle title={mode === "edit" ? "Edit project" : "New project"} />
            <View style={styles.field}>
              <Input
                value={name}
                onChangeText={setName}
                placeholder="Project name"
                autoCapitalize="words"
                error={error}
              />
            </View>
            <View style={styles.field}>
              <Input
                value={description}
                onChangeText={setDescription}
                placeholder="Description (optional)"
                multiline
              />
            </View>
            <View style={styles.field}>
              <Input
                value={context}
                onChangeText={setContext}
                placeholder="Context for the AI (optional)"
                multiline
                maxLength={CONTEXT_MAX_LENGTH}
              />
              <Text style={styles.hint}>
                This context is injected into AI prompts when processing audio for this project.
              </Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Jira project</Text>
              <JiraProjectSelector value={jiraProjectKey} onChange={setJiraProjectKey} />
            </View>
            <View style={styles.actions}>
              <Pressable onPress={onClose} disabled={mutation.isPending} style={styles.cancel}>
                <Text style={styles.cancelLabel}>Cancel</Text>
              </Pressable>
              <Button
                label={mode === "edit" ? "Save" : "Create"}
                onPress={handleSubmit}
                loading={mutation.isPending}
                disabled={!name.trim()}
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    maxHeight: "90%",
  },
  scrollContent: {
    padding: spacing.xl,
    gap: spacing.md,
  },
  field: {
    marginTop: spacing.sm,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  hint: {
    marginTop: spacing.xs,
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  cancel: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  cancelLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.textMuted,
  },
});
