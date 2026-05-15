import { useEffect, useRef, useState } from "react";
import { Linking, View, Text, Pressable, FlatList, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAudioRecorder, useAudioRecorderPermissions, RecordingPresets } from "expo-audio";
import { Button } from "@/components/ui/button";
import { ListRow } from "@/components/ui/list-row";
import { Skeleton } from "@/components/ui/skeleton";
import {
  borderWidth,
  colors,
  componentSize,
  duration,
  font,
  fontSize,
  iconSize,
  opacity,
  radii,
  spacing,
} from "@/constants/theme";
import { ApiError } from "@/lib/api-error";
import { uploadAudio } from "@/lib/api/audios";
import { listProjects } from "@/lib/api/projects";
import { queryKeys } from "@/lib/query-keys";
import { formatDuration } from "@/lib/format";
import type { Project } from "@/lib/api/types";

type RecordingState = "selecting_project" | "idle" | "recording" | "uploading";

export function RecordingModal() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { projectId: initialProjectId } = useLocalSearchParams<{ projectId?: string }>();
  const [permission, requestPermission] = useAudioRecorderPermissions();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    initialProjectId ?? null,
  );
  const [state, setState] = useState<RecordingState>(
    initialProjectId ? "idle" : "selecting_project",
  );
  const [durationSeconds, setDurationSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const projectsQuery = useQuery({
    queryKey: queryKeys.projects,
    queryFn: () => listProjects(),
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProjectId) throw new Error("No project selected");
      const uri = recorder.uri;
      if (!uri) throw new Error("Missing recording");
      const formData = new FormData();
      formData.append("file", {
        uri,
        name: `audio-${Date.now()}.m4a`,
        type: "audio/mp4",
      } as unknown as Blob);
      return uploadAudio(formData, selectedProjectId);
    },
    onSuccess: () => {
      if (selectedProjectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projectAudios(selectedProjectId) });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.recentAudios });
      queryClient.invalidateQueries({ queryKey: queryKeys.quota });
      router.dismiss();
    },
  });

  const projects = projectsQuery.data?.data ?? [];
  const selectedProject =
    projects.find((p) => p.id === selectedProjectId) ?? null;

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleSelectProject = (project: Project) => {
    setSelectedProjectId(project.id);
    setState("idle");
  };

  const handleStartRecording = async () => {
    if (!selectedProjectId) return;
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) return;
    }
    await recorder.prepareToRecordAsync();
    recorder.record();
    setDurationSeconds(0);
    timerRef.current = setInterval(() => {
      setDurationSeconds((s) => s + 1);
    }, duration.recordingTick);
    setState("recording");
  };

  const handleStop = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    await recorder.stop();
    setState("uploading");
    uploadMutation.mutate();
  };

  const handleRetryUpload = () => {
    uploadMutation.reset();
    uploadMutation.mutate();
  };

  const handleRequestPermission = async () => {
    const result = await requestPermission();
    if (!result.granted && !result.canAskAgain) {
      // user must enable from settings
      return;
    }
  };

  const needsPermission = permission ? !permission.granted : false;

  const handleClose = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (state === "recording") {
      recorder.stop().catch(() => undefined);
    }
    router.dismiss();
  };

  const uploadErrorMessage = (() => {
    const err = uploadMutation.error;
    if (!err) return null;
    if (err instanceof ApiError) {
      if (err.status === 413) {
        return "Audio too long for your plan. Try a shorter recording or upgrade your plan.";
      }
      if (err.status === 402 || err.status === 403) {
        return "You've used your quota. Upgrade your plan to record more audio.";
      }
    }
    return "Upload failed. Tap the button below to try again.";
  })();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close recorder"
          onPress={handleClose}
          style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
        >
          <Ionicons name="close" size={iconSize.lg} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>
          {state === "selecting_project"
            ? "Choose a project"
            : selectedProject?.name ?? ""}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {needsPermission ? (
        <View style={styles.center}>
          <Ionicons name="mic-off-outline" size={iconSize.display} color={colors.textMuted} />
          <Text style={styles.permissionTitle}>Microphone access needed</Text>
          <Text style={styles.permissionBody}>
            Yappie needs the microphone to record audio for your tickets.
          </Text>
          {permission?.canAskAgain ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Grant microphone access"
              onPress={handleRequestPermission}
              style={({ pressed }) => [styles.recordButton, pressed && styles.pressed]}
            >
              <Text style={styles.recordButtonLabel}>Grant access</Text>
            </Pressable>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open settings"
              onPress={() => Linking.openSettings()}
              style={({ pressed }) => [styles.recordButton, pressed && styles.pressed]}
            >
              <Text style={styles.recordButtonLabel}>Open Settings</Text>
            </Pressable>
          )}
        </View>
      ) : state === "selecting_project" ? (
        projectsQuery.isLoading ? (
          <View style={styles.skeletons}>
            <Skeleton width="100%" height={60} borderRadius={radii.md} />
            <Skeleton width="100%" height={60} borderRadius={radii.md} />
          </View>
        ) : (
          <FlatList
            data={projects}
            keyExtractor={(p) => p.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <ListRow
                title={item.name}
                subtitle={item.description ?? undefined}
                onPress={() => handleSelectProject(item)}
              />
            )}
          />
        )
      ) : null}

      {state === "idle" ? (
        <View style={styles.center}>
          <View style={styles.micCircle}>
            <Ionicons name="mic-outline" size={iconSize.display} color={colors.text} />
          </View>
          <Text style={styles.hint}>Tap to record</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Start recording"
            onPress={handleStartRecording}
            style={({ pressed }) => [styles.recordButton, pressed && styles.pressed]}
          >
            <Text style={styles.recordButtonLabel}>Record</Text>
          </Pressable>
        </View>
      ) : null}

      {state === "recording" ? (
        <View style={styles.center}>
          <Text style={styles.timer}>{formatDuration(durationSeconds)}</Text>
          <View style={styles.recordingDot} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Stop recording"
            onPress={handleStop}
            style={({ pressed }) => [styles.stopButton, pressed && styles.pressed]}
          >
            <Text style={styles.stopButtonLabel}>Stop</Text>
          </Pressable>
        </View>
      ) : null}

      {state === "uploading" ? (
        <View style={styles.center}>
          <Text style={styles.timer}>{formatDuration(durationSeconds)}</Text>
          {uploadMutation.isError ? (
            <>
              <Text style={styles.errorMessage}>{uploadErrorMessage}</Text>
              <Button label="Retry" onPress={handleRetryUpload} loading={uploadMutation.isPending} />
            </>
          ) : (
            <Text style={styles.processingLabel}>Processing…</Text>
          )}
        </View>
      ) : null}
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: spacing.lg,
  },
  closeButton: {
    width: componentSize.hitArea,
    height: componentSize.hitArea,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.pill,
  },
  pressed: {
    opacity: opacity.pressed,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontFamily: font.heading.semibold,
    fontSize: fontSize.md,
    color: colors.text,
  },
  headerSpacer: {
    width: componentSize.hitArea,
  },
  skeletons: {
    gap: spacing.sm,
  },
  list: {
    gap: spacing.sm,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xl,
  },
  micCircle: {
    width: componentSize.recordingMic,
    height: componentSize.recordingMic,
    borderRadius: radii.pill,
    borderWidth: borderWidth.thick,
    borderColor: colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  hint: {
    fontFamily: font.body.regular,
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
  recordButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: radii.pill,
  },
  recordButtonLabel: {
    fontFamily: font.heading.semibold,
    fontSize: fontSize.md,
    color: "#FFFFFF",
  },
  timer: {
    fontFamily: font.heading.bold,
    fontSize: fontSize.display,
    color: colors.text,
    fontVariant: ["tabular-nums"],
  },
  recordingDot: {
    width: componentSize.recordingDot,
    height: componentSize.recordingDot,
    borderRadius: radii.pill,
    backgroundColor: colors.danger,
  },
  stopButton: {
    backgroundColor: colors.danger,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: radii.pill,
  },
  stopButtonLabel: {
    fontFamily: font.heading.semibold,
    fontSize: fontSize.md,
    color: "#FFFFFF",
  },
  processingLabel: {
    fontFamily: font.body.regular,
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
  errorMessage: {
    fontFamily: font.body.regular,
    fontSize: fontSize.sm,
    color: colors.danger,
    textAlign: "center",
    paddingHorizontal: spacing.lg,
  },
  permissionTitle: {
    fontFamily: font.heading.semibold,
    fontSize: fontSize.lg,
    color: colors.text,
    textAlign: "center",
  },
  permissionBody: {
    fontFamily: font.body.regular,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: "center",
    paddingHorizontal: spacing.lg,
  },
});
