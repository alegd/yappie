import { useState } from "react";
import { Alert, View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HeaderTitle } from "@/components/ui/header-title";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { TranscriptionBlock } from "./transcription-block";
import { TicketRow } from "@/features/tickets/ticket-row";
import { TicketDetailSheet } from "@/features/tickets/ticket-detail-sheet";
import { colors, fontSize, fontWeight, radii, spacing } from "@/constants/theme";
import { ApiError } from "@/lib/api-error";
import { getAudio } from "@/lib/api/audios";
import { exportTicketsBulk } from "@/lib/api/jira";
import { queryKeys } from "@/lib/query-keys";
import { formatDuration, timeAgo } from "@/lib/format";
import type { AudioStatus } from "@/lib/api/types";

const audioStatusToVariant: Record<AudioStatus, BadgeVariant> = {
  PENDING: "pending",
  TRANSCRIBING: "transcribing",
  ANALYZING: "analyzing",
  COMPLETED: "completed",
  FAILED: "failed",
};

export function AudioDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [openTicketId, setOpenTicketId] = useState<string | null>(null);

  const audioQuery = useQuery({
    queryKey: queryKeys.audio(id),
    queryFn: () => getAudio(id),
    enabled: Boolean(id),
  });

  const audio = audioQuery.data;

  const bulkExportMutation = useMutation({
    mutationFn: (ticketIds: string[]) => exportTicketsBulk(ticketIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.audio(id) });
      setSelectMode(false);
      setSelectedIds(new Set());
      toast.success("Tickets exported to Jira");
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

  const handleBulkExport = () => {
    if (selectedIds.size === 0) return;
    bulkExportMutation.mutate(Array.from(selectedIds));
  };

  const toggleSelectMode = () => {
    setSelectMode((v) => {
      if (v) setSelectedIds(new Set());
      return !v;
    });
  };

  const toggleSelection = (ticketId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(ticketId)) next.delete(ticketId);
      else next.add(ticketId);
      return next;
    });
  };

  if (audioQuery.isLoading || !audio) {
    return (
      <View style={styles.container}>
        <View style={styles.headerSkeleton}>
          <Skeleton width="60%" height={28} borderRadius={radii.sm} />
          <Skeleton width="40%" height={14} borderRadius={radii.sm} />
        </View>
        <View style={styles.list}>
          <Skeleton width="100%" height={80} borderRadius={radii.md} />
          <Skeleton width="100%" height={80} borderRadius={radii.md} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <HeaderTitle title={audio.fileName} />
        <View style={styles.headerMeta}>
          <Text style={styles.meta}>
            {formatDuration(audio.duration)} · {timeAgo(audio.createdAt)}
          </Text>
          <Badge label={audio.status} variant={audioStatusToVariant[audio.status]} />
        </View>
      </View>

      <TranscriptionBlock text={audio.transcription} />

      <View style={styles.ticketsHeader}>
        <Text style={styles.ticketsTitle}>Tickets ({audio.tickets.length})</Text>
        {audio.tickets.length > 0 ? (
          <Pressable
            onPress={toggleSelectMode}
            accessibilityRole="button"
            style={({ pressed }) => [styles.toggleButton, pressed && styles.toggleButtonPressed]}
          >
            <Text style={styles.toggleLabel}>
              {selectMode ? "Cancel" : "Select multiple"}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {audio.tickets.length === 0 ? (
        <Text style={styles.emptyText}>No tickets were generated for this audio.</Text>
      ) : (
        <FlatList
          data={audio.tickets}
          keyExtractor={(t) => t.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TicketRow
              ticket={item}
              onPress={() => {
                if (selectMode) toggleSelection(item.id);
                else setOpenTicketId(item.id);
              }}
              selectable={selectMode}
              selected={selectedIds.has(item.id)}
            />
          )}
        />
      )}

      {selectMode && selectedIds.size > 0 ? (
        <View style={styles.footer}>
          <Text style={styles.footerLabel}>{selectedIds.size} selected</Text>
          <Button
            label="Export to Jira"
            onPress={handleBulkExport}
            loading={bulkExportMutation.isPending}
          />
        </View>
      ) : null}

      <TicketDetailSheet
        ticket={audio.tickets.find((t) => t.id === openTicketId) ?? null}
        onClose={() => setOpenTicketId(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
  },
  header: {
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  headerSkeleton: {
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },
  headerMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flexWrap: "wrap",
  },
  meta: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  ticketsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.md,
  },
  ticketsTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  toggleButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  toggleButtonPressed: {
    opacity: 0.6,
  },
  toggleLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textMuted,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textDim,
    paddingVertical: spacing.lg,
  },
  list: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl + spacing.xxl,
    gap: spacing.sm,
  },
  footer: {
    position: "absolute",
    bottom: spacing.xxl + spacing.xxl,
    left: spacing.xl,
    right: spacing.xl,
    backgroundColor: colors.surfaceElevated,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  footerLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
});
