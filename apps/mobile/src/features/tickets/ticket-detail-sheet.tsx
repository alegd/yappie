import { useEffect, useRef, useState } from "react";
import { Alert, View, Text, Pressable, ScrollView, TextInput, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import BottomSheet from "@gorhom/bottom-sheet";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { colors, fontSize, fontWeight, radii, spacing } from "@/constants/theme";
import { ApiError } from "@/lib/api-error";
import { exportTicketToJira } from "@/lib/api/jira";
import { deleteTicket, updateTicket } from "@/lib/api/tickets";
import { queryKeys } from "@/lib/query-keys";
import type { Ticket, TicketPriority, TicketStatus } from "@/lib/api/types";

interface TicketDetailSheetProps {
  ticket: Ticket | null;
  onClose: () => void;
}

const priorityToVariant: Record<TicketPriority, BadgeVariant> = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
};

const statusToVariant: Record<TicketStatus, BadgeVariant> = {
  DRAFT: "draft",
  APPROVED: "approved",
  EXPORTED: "exported",
  REJECTED: "rejected",
};

const PRIORITY_OPTIONS: TicketPriority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const SNAP_POINTS = ["60%", "90%"];

export function TicketDetailSheet({ ticket, onClose }: TicketDetailSheetProps) {
  const sheetRef = useRef<BottomSheet>(null);
  const queryClient = useQueryClient();
  const router = useRouter();
  const isOpen = ticket !== null;

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriority, setEditPriority] = useState<TicketPriority>("MEDIUM");

  useEffect(() => {
    if (isOpen) {
      sheetRef.current?.snapToIndex(0);
      setIsEditing(false);
    } else {
      sheetRef.current?.close();
    }
  }, [isOpen]);

  const invalidateAudio = (audioId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.audio(audioId) });
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTicket(id),
    onSuccess: () => {
      if (ticket) invalidateAudio(ticket.audioRecordingId);
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (input: { id: string; title: string; description: string; priority: TicketPriority }) =>
      updateTicket(input.id, {
        title: input.title,
        description: input.description,
        priority: input.priority,
      }),
    onSuccess: () => {
      if (ticket) invalidateAudio(ticket.audioRecordingId);
      setIsEditing(false);
    },
  });

  const exportMutation = useMutation({
    mutationFn: (id: string) => exportTicketToJira(id),
    onSuccess: () => {
      if (ticket) invalidateAudio(ticket.audioRecordingId);
      toast.success("Exported to Jira");
    },
    onError: (err) => {
      if (err instanceof ApiError && err.status === 403) {
        Alert.alert(
          "Connect Jira first",
          "Connect your Jira account before exporting tickets.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Connect", onPress: () => router.push("/settings") },
          ],
        );
        return;
      }
      const message = err instanceof Error ? err.message : "Failed to export";
      toast.error(message);
    },
  });

  const handleExport = () => {
    if (!ticket) return;
    exportMutation.mutate(ticket.id);
  };

  const handleDelete = () => {
    if (!ticket) return;
    Alert.alert(
      "Delete ticket?",
      "This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteMutation.mutate(ticket.id),
        },
      ],
      { cancelable: true },
    );
  };

  const handleStartEdit = () => {
    if (!ticket) return;
    setEditTitle(ticket.title);
    setEditDescription(ticket.description);
    setEditPriority(ticket.priority);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveEdit = () => {
    if (!ticket) return;
    updateMutation.mutate({
      id: ticket.id,
      title: editTitle,
      description: editDescription,
      priority: editPriority,
    });
  };

  return (
    <BottomSheet
      ref={sheetRef}
      index={isOpen ? 0 : -1}
      snapPoints={SNAP_POINTS}
      enablePanDownToClose
      onClose={onClose}
      backgroundStyle={{ backgroundColor: colors.surface }}
      handleIndicatorStyle={{ backgroundColor: colors.textDim }}
    >
      {ticket ? (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.headerRow}>
            {isEditing ? (
              <TextInput
                value={editTitle}
                onChangeText={setEditTitle}
                style={styles.titleInput}
                placeholder="Ticket title"
                placeholderTextColor={colors.textDim}
              />
            ) : (
              <Text style={styles.title}>{ticket.title}</Text>
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close ticket detail"
              onPress={onClose}
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
            >
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </Pressable>
          </View>

          {isEditing ? (
            <View style={styles.priorityRow}>
              {PRIORITY_OPTIONS.map((p) => {
                const active = p === editPriority;
                return (
                  <Pressable
                    key={p}
                    onPress={() => setEditPriority(p)}
                    style={[styles.priorityChip, active && styles.priorityChipActive]}
                  >
                    <Text style={[styles.priorityChipLabel, active && styles.priorityChipLabelActive]}>
                      {p}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <View style={styles.badges}>
              <Badge label={ticket.priority} variant={priorityToVariant[ticket.priority]} />
              <Badge label={ticket.status} variant={statusToVariant[ticket.status]} />
              {ticket.status === "EXPORTED" && ticket.jiraIssueKey ? (
                <Text style={styles.jiraKey}>{ticket.jiraIssueKey}</Text>
              ) : null}
            </View>
          )}

          <Text style={styles.sectionLabel}>Description</Text>
          {isEditing ? (
            <TextInput
              value={editDescription}
              onChangeText={setEditDescription}
              multiline
              style={styles.descriptionInput}
              placeholder="Description"
              placeholderTextColor={colors.textDim}
            />
          ) : (
            <Text style={styles.description}>{ticket.description}</Text>
          )}

          <View style={styles.actions}>
            {isEditing ? (
              <>
                <Pressable onPress={handleCancelEdit} style={styles.secondary}>
                  <Text style={styles.secondaryLabel}>Cancel</Text>
                </Pressable>
                <Button label="Save" onPress={handleSaveEdit} loading={updateMutation.isPending} />
              </>
            ) : (
              <>
                <Pressable
                  onPress={handleDelete}
                  disabled={deleteMutation.isPending}
                  style={styles.danger}
                >
                  <Text style={styles.dangerLabel}>Delete</Text>
                </Pressable>
                <Pressable onPress={handleStartEdit} style={styles.secondary}>
                  <Text style={styles.secondaryLabel}>Edit</Text>
                </Pressable>
                {ticket.status !== "EXPORTED" ? (
                  <Button
                    label="Export to Jira"
                    onPress={handleExport}
                    loading={exportMutation.isPending}
                  />
                ) : null}
              </>
            )}
          </View>
        </ScrollView>
      ) : null}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: spacing.xl,
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  title: {
    flex: 1,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  titleInput: {
    flex: 1,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.xs,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.pill,
  },
  pressed: {
    opacity: 0.6,
  },
  badges: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  priorityRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  priorityChip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  priorityChipActive: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.borderStrong,
  },
  priorityChipLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textMuted,
  },
  priorityChipLabelActive: {
    color: colors.text,
  },
  jiraKey: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.statusExported,
  },
  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginTop: spacing.md,
  },
  description: {
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: fontSize.md * 1.5,
  },
  descriptionInput: {
    fontSize: fontSize.md,
    color: colors.text,
    backgroundColor: colors.background,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    minHeight: 120,
    textAlignVertical: "top",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  danger: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  dangerLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.danger,
  },
  secondary: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  secondaryLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.textMuted,
  },
});
