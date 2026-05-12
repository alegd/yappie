import { Pressable, View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { colors, fontSize, fontWeight, radii, spacing } from "@/constants/theme";
import type { Ticket, TicketPriority, TicketStatus } from "@/lib/api/types";

interface TicketRowProps {
  ticket: Ticket;
  onPress: () => void;
  selectable?: boolean;
  selected?: boolean;
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

export function TicketRow({ ticket, onPress, selectable, selected }: TicketRowProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      {selectable ? (
        <View
          testID="ticket-checkbox"
          accessibilityRole="checkbox"
          accessibilityState={{ checked: Boolean(selected) }}
          style={[styles.checkbox, selected && styles.checkboxSelected]}
        >
          {selected ? <Ionicons name="checkmark" size={16} color={colors.text} /> : null}
        </View>
      ) : null}

      <View style={styles.textBlock}>
        <Text style={styles.title} numberOfLines={2}>
          {ticket.title}
        </Text>
        <View style={styles.badges}>
          <Badge label={ticket.priority} variant={priorityToVariant[ticket.priority]} />
          <Badge label={ticket.status} variant={statusToVariant[ticket.status]} />
          {ticket.status === "EXPORTED" && ticket.jiraIssueKey ? (
            <Text style={styles.jiraKey}>{ticket.jiraIssueKey}</Text>
          ) : null}
        </View>
      </View>

      {!selectable ? <Ionicons name="chevron-forward" size={20} color={colors.textDim} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  pressed: {
    opacity: 0.7,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: radii.sm,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  textBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  badges: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  jiraKey: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.statusExported,
  },
});
