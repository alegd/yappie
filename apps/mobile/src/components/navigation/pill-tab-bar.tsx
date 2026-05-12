import { Pressable, View, Text, StyleSheet } from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import {
  borderWidth,
  colors,
  componentSize,
  fontSize,
  fontWeight,
  radii,
  spacing,
} from "@/constants/theme";

const TAB_LABELS: Record<string, string> = {
  home: "Home",
  projects: "Projects",
};

export function PillTabBar({ state, navigation, insets }: BottomTabBarProps) {

  return (
    <View
      style={[
        styles.wrapper,
        { paddingBottom: insets.bottom + spacing.sm, paddingLeft: insets.left + spacing.lg },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.pill}>
        {state.routes.map((route, index) => {
          const active = index === state.index;
          const label = TAB_LABELS[route.name] ?? route.name;
          return (
            <Pressable
              key={route.key}
              testID={`pill-tab-${route.name}`}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={label}
              onPress={() => {
                if (!active) navigation.navigate(route.name);
              }}
              style={[styles.tab, active && styles.tabActive]}
            >
              <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    bottom: 0,
  },
  pill: {
    flexDirection: "row",
    height: componentSize.fab,
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    borderWidth: borderWidth.thin,
    borderColor: colors.border,
    padding: spacing.xs,
    gap: spacing.xs,
    alignItems: "stretch",
  },
  tab: {
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  tabActive: {
    backgroundColor: colors.surfaceElevated,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textDim,
  },
  labelActive: {
    color: colors.text,
    fontWeight: fontWeight.semibold,
  },
});
