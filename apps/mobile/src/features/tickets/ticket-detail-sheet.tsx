import { useEffect, useRef } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import BottomSheet from "@gorhom/bottom-sheet";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { colors, fontSize, fontWeight, radii, spacing } from "@/constants/theme";
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

const SNAP_POINTS = ["60%", "90%"];

export function TicketDetailSheet({ ticket, onClose }: TicketDetailSheetProps) {
  const sheetRef = useRef<BottomSheet>(null);
  const isOpen = ticket !== null;

  useEffect(() => {
    if (isOpen) {
      sheetRef.current?.snapToIndex(0);
    } else {
      sheetRef.current?.close();
    }
  }, [isOpen]);

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
            <Text style={styles.title}>{ticket.title}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close ticket detail"
              onPress={onClose}
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
            >
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </Pressable>
          </View>

          <View style={styles.badges}>
            <Badge label={ticket.priority} variant={priorityToVariant[ticket.priority]} />
            <Badge label={ticket.status} variant={statusToVariant[ticket.status]} />
            {ticket.status === "EXPORTED" && ticket.jiraIssueKey ? (
              <Text style={styles.jiraKey}>{ticket.jiraIssueKey}</Text>
            ) : null}
          </View>

          <Text style={styles.sectionLabel}>Description</Text>
          <Text style={styles.description}>{ticket.description}</Text>
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
});
