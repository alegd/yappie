import { useState } from "react";
import { View, StyleSheet } from "react-native";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Button } from "@/components/ui/button";
import { HeaderTitle } from "@/components/ui/header-title";
import { Input } from "@/components/ui/input";
import { colors, spacing } from "@/constants/theme";
import { createProject } from "@/lib/api/projects";
import type { Project } from "@/lib/api/types";

export function OnboardingScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | undefined>();

  const mutation = useMutation({
    mutationFn: () =>
      createProject({ name: name.trim(), description: description.trim() || undefined }),
    onSuccess: (project: Project) => {
      router.replace(`/projects/${project.id}`);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const handleSubmit = () => {
    if (!name.trim()) return;
    setError(undefined);
    mutation.mutate();
  };

  return (
    <View style={styles.container}>
      <HeaderTitle
        title="Welcome to Yappie"
        subtitle="Create your first project to start capturing audio."
      />
      <View style={styles.field}>
        <Input
          value={name}
          onChangeText={setName}
          placeholder="Project name"
          autoCapitalize="words"
          autoFocus
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
        <Button
          label="Create project"
          onPress={handleSubmit}
          loading={mutation.isPending}
          disabled={!name.trim()}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    gap: spacing.md,
  },
  field: {
    marginTop: spacing.sm,
  },
  actions: {
    marginTop: spacing.lg,
  },
});
