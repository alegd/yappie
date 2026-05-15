import { Pressable, View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import {
  borderWidth,
  colors,
  componentSize,
  font,
  fontSize,
  iconSize,
  opacity,
  radii,
  spacing,
} from "@/constants/theme";
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
          {selected ? <Ionicons name="checkmark" size={iconSize.xs} color={colors.text} /> : null}
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

      {!selectable ? <Ionicons name="chevron-forward" size={iconSize.sm} color={colors.textDim} /> : null}
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
    borderWidth: borderWidth.thin,
    borderColor: colors.border,
    gap: spacing.md,
  },
  pressed: {
    opacity: opacity.pressedSubtle,
  },
  checkbox: {
    width: componentSize.checkbox,
    height: componentSize.checkbox,
    borderRadius: radii.sm,
    borderWidth: borderWidth.medium,
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
    fontFamily: font.body.medium,
    fontSize: fontSize.md,
    color: colors.text,
  },
  badges: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  jiraKey: {
    fontFamily: font.body.medium,
    fontSize: fontSize.xs,
    color: colors.statusExported,
  },
});
