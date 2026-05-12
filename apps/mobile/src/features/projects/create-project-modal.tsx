import { useState } from "react";
import { Modal, View, Pressable, Text, StyleSheet } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HeaderTitle } from "@/components/ui/header-title";
import { colors, fontSize, fontWeight, radii, spacing } from "@/constants/theme";
import { createProject } from "@/lib/api/projects";
import { queryKeys } from "@/lib/query-keys";
import type { Project } from "@/lib/api/types";

interface CreateProjectModalProps {
  visible: boolean;
  onClose: () => void;
  onCreated?: (project: Project) => void;
}

export function CreateProjectModal({ visible, onClose, onCreated }: CreateProjectModalProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | undefined>();

  const mutation = useMutation({
    mutationFn: () =>
      createProject({ name: name.trim(), description: description.trim() || undefined }),
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects });
      setName("");
      setDescription("");
      setError(undefined);
      onCreated?.(project);
      onClose();
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const handleSubmit = () => {
    if (!name.trim()) return;
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
          <HeaderTitle title="New project" />
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
          <View style={styles.actions}>
            <Pressable onPress={onClose} disabled={mutation.isPending} style={styles.cancel}>
              <Text style={styles.cancelLabel}>Cancel</Text>
            </Pressable>
            <Button
              label="Create"
              onPress={handleSubmit}
              loading={mutation.isPending}
              disabled={!name.trim()}
            />
          </View>
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
    padding: spacing.xl,
    gap: spacing.md,
  },
  field: {
    marginTop: spacing.sm,
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
