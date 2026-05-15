import { useState, type ReactNode } from "react";
import { StyleSheet, type LayoutChangeEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassView } from "expo-glass-effect";
import { spacing } from "@/constants/theme";

const FALLBACK_HEIGHT = 120;

interface GlassHeaderProps {
  children: ReactNode;
  onLayout?: (e: LayoutChangeEvent) => void;
}

export function GlassHeader({ children, onLayout }: GlassHeaderProps) {
  const insets = useSafeAreaInsets();
  return (
    <GlassView
      glassEffectStyle="regular"
      colorScheme="dark"
      onLayout={onLayout}
      style={[styles.container, { paddingTop: insets.top + spacing.md }]}
    >
      {children}
    </GlassView>
  );
}

export function useGlassHeader() {
  const [height, setHeight] = useState<number | null>(null);
  const onLayout = (e: LayoutChangeEvent) => {
    setHeight(e.nativeEvent.layout.height);
  };
  return { height: height ?? FALLBACK_HEIGHT, onLayout };
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
});
