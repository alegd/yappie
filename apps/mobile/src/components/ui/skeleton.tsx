import { View, StyleSheet } from "react-native";
import { colors, opacity, radii } from "@/constants/theme";

interface SkeletonProps {
  width: number | `${number}%`;
  height: number;
  borderRadius?: number;
}

export function Skeleton({ width, height, borderRadius = radii.sm }: SkeletonProps) {
  return (
    <View
      testID="skeleton"
      accessibilityRole="progressbar"
      style={[styles.base, { width, height, borderRadius }]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surfaceElevated,
    opacity: opacity.skeleton,
  },
});
