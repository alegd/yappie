import { View, Text, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { colors, fontSize, fontWeight, radii, spacing } from "@/constants/theme";
import type { Quota } from "@/lib/api/types";

interface QuotaWidgetProps {
  quota: Quota;
}

export function QuotaWidget({ quota }: QuotaWidgetProps) {
  const ratio = quota.limitMinutes === 0 ? 0 : Math.min(quota.usedMinutes / quota.limitMinutes, 1);
  const percent = Math.round(ratio * 100);

  return (
    <Card>
      <View style={styles.headerRow}>
        <Text style={styles.plan}>{quota.plan} plan</Text>
        {quota.plan === "FREE" ? <Text style={styles.upgrade}>Upgrade</Text> : null}
      </View>
      <Text style={styles.usage}>
        {quota.usedMinutes} / {quota.limitMinutes} min
      </Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${percent}%` }]} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  plan: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  upgrade: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  usage: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginTop: spacing.sm,
    fontVariant: ["tabular-nums"],
  },
  barTrack: {
    height: 6,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.pill,
    overflow: "hidden",
    marginTop: spacing.md,
  },
  barFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
  },
});
