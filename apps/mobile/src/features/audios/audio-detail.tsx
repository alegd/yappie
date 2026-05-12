import { useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { HeaderTitle } from "@/components/ui/header-title";
import { Skeleton } from "@/components/ui/skeleton";
import { TranscriptionBlock } from "./transcription-block";
import { TicketRow } from "@/features/tickets/ticket-row";
import { colors, fontSize, fontWeight, radii, spacing } from "@/constants/theme";
import { getAudio } from "@/lib/api/audios";
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
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const audioQuery = useQuery({
    queryKey: queryKeys.audio(id),
    queryFn: () => getAudio(id),
    enabled: Boolean(id),
  });

  const audio = audioQuery.data;

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
                // sheet press wires in YAP-145
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
        </View>
      ) : null}
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
  },
  footerLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
});
