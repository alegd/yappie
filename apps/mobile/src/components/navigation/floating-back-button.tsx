import { useRouter, useSegments } from "expo-router";
import { FloatingFab } from "./floating-fab";

const VISIBLE_SEGMENTS = ["[id]", "settings", "account"];

export function FloatingBackButton() {
  const router = useRouter();
  const segments = useSegments();

  const isVisible = segments.some((segment) => VISIBLE_SEGMENTS.includes(segment));
  if (!isVisible) return null;

  return (
    <FloatingFab
      side="left"
      iconName="chevron-back"
      accessibilityLabel="Go back"
      onPress={() => router.back()}
    />
  );
}
