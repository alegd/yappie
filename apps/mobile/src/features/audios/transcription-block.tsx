import { useState } from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fontSize, fontWeight, iconSize, opacity, radii, spacing } from "@/constants/theme";

interface TranscriptionBlockProps {
  text: string | null;
}

export function TranscriptionBlock({ text }: TranscriptionBlockProps) {
  const [expanded, setExpanded] = useState(false);

  if (!text) {
    return (
      <View style={styles.container}>
        <Text style={styles.muted}>Transcription not available yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        onPress={() => setExpanded((v) => !v)}
        style={({ pressed }) => [styles.toggle, pressed && styles.pressed]}
      >
        <Ionicons
          name={expanded ? "chevron-down" : "chevron-forward"}
          size={iconSize.xs}
          color={colors.textMuted}
        />
        <Text style={styles.toggleLabel}>
          {expanded ? "Hide transcription" : "Show transcription"}
        </Text>
      </Pressable>
      {expanded ? <Text style={styles.body}>{text}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
    borderRadius: radii.md,
  },
  muted: {
    fontSize: fontSize.sm,
    color: colors.textDim,
    fontStyle: "italic",
  },
  toggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  pressed: {
    opacity: opacity.pressed,
  },
  toggleLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textMuted,
  },
  body: {
    marginTop: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: fontSize.md * 1.5,
  },
});
