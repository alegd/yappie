import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, FlatList, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAudioRecorder, useAudioRecorderPermissions, RecordingPresets } from "expo-audio";
import { Button } from "@/components/ui/button";
import { ListRow } from "@/components/ui/list-row";
import { Skeleton } from "@/components/ui/skeleton";
import { colors, fontSize, fontWeight, radii, spacing } from "@/constants/theme";
import { listProjects } from "@/lib/api/projects";
import { queryKeys } from "@/lib/query-keys";
import { formatDuration } from "@/lib/format";
import type { Project } from "@/lib/api/types";

type RecordingState = "selecting_project" | "idle" | "recording" | "uploading";

export function RecordingModal() {
  const router = useRouter();
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
    setDurationSeconds(0);
    timerRef.current = setInterval(() => {
      setDurationSeconds((s) => s + 1);
    }, 1000);
    setState("recording");
  };

  const handleStop = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setState("uploading");
  };

  const handleClose = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    router.dismiss();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close recorder"
          onPress={handleClose}
          style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
        >
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>
          {state === "selecting_project"
            ? "Choose a project"
            : selectedProject?.name ?? ""}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {state === "selecting_project" ? (
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
            <Ionicons name="mic-outline" size={64} color={colors.text} />
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
          <Text style={styles.processingLabel}>Processing…</Text>
        </View>
      ) : null}
    </View>
  );
}

// Reference recorder so the import is not dropped — wired in Chunk 2.
void useAudioRecorder;

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
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.pill,
  },
  pressed: {
    opacity: 0.6,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  headerSpacer: {
    width: 36,
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
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  hint: {
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
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  timer: {
    fontSize: fontSize.display,
    fontWeight: fontWeight.bold,
    color: colors.text,
    fontVariant: ["tabular-nums"],
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.danger,
  },
  stopButton: {
    backgroundColor: colors.danger,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: radii.pill,
  },
  stopButtonLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  processingLabel: {
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
});

void Button; // primitive will be used in upload error UI in Chunk 3
