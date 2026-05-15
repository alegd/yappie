import { Pressable, View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import {
  borderWidth,
  colors,
  font,
  fontSize,
  iconSize,
  opacity,
  radii,
  spacing,
} from "@/constants/theme";
import { formatDuration, timeAgo } from "@/lib/format";
import type { AudioRecording, AudioStatus } from "@/lib/api/types";

interface AudioRowProps {
  audio: AudioRecording;
  onPress: () => void;
}

const statusToVariant: Record<AudioStatus, BadgeVariant> = {
  PENDING: "pending",
  TRANSCRIBING: "transcribing",
  ANALYZING: "analyzing",
  COMPLETED: "completed",
  FAILED: "failed",
};

export function AudioRow({ audio, onPress }: AudioRowProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <View style={styles.textBlock}>
        <Text style={styles.title} numberOfLines={1}>
          {audio.fileName}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {formatDuration(audio.duration)} · {timeAgo(audio.createdAt)}
        </Text>
        <View style={styles.badgeRow}>
          <Badge label={audio.status} variant={statusToVariant[audio.status]} />
        </View>
      </View>
      <Ionicons name="chevron-forward" size={iconSize.sm} color={colors.textDim} />
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
  textBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    fontFamily: font.body.medium,
    fontSize: fontSize.md,
    color: colors.text,
  },
  meta: {
    fontFamily: font.body.regular,
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  badgeRow: {
    marginTop: spacing.xs,
  },
});
