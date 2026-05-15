import { Pressable, View, Text, StyleSheet } from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { GlassView } from "expo-glass-effect";
import {
  borderWidth,
  colors,
  componentSize,
  font,
  fontSize,
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
        { paddingBottom: insets.bottom + spacing.sm, paddingLeft: insets.left + spacing.xl },
      ]}
      pointerEvents="box-none"
    >
      <GlassView style={styles.pill} glassEffectStyle="regular" colorScheme="dark">
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
      </GlassView>
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
    borderRadius: radii.pill,
    borderWidth: borderWidth.thin,
    borderColor: colors.border,
    padding: spacing.xs,
    gap: spacing.xs,
    alignItems: "stretch",
    overflow: "hidden",
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
    fontFamily: font.heading.medium,
    fontSize: fontSize.sm,
    color: colors.textDim,
  },
  labelActive: {
    fontFamily: font.heading.semibold,
    color: colors.text,
  },
});
