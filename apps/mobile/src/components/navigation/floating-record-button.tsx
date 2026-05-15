import { useLocalSearchParams, useRouter, useSegments } from "expo-router";
import { FloatingFab } from "./floating-fab";

const HIDDEN_ROUTES = ["settings", "record", "project-form"];
const PROJECT_DETAIL_SEGMENT = "projects";

export function FloatingRecordButton() {
  const router = useRouter();
  const segments = useSegments();
  const params = useLocalSearchParams<{ id?: string }>();

  const isHidden = segments.some((segment) => HIDDEN_ROUTES.includes(segment));
  if (isHidden) return null;

  const handlePress = () => {
    const isProjectDetail =
      segments.includes(PROJECT_DETAIL_SEGMENT) && segments.some((s) => s === "[id]");
    if (isProjectDetail && params.id) {
      router.push({ pathname: "/record", params: { projectId: params.id } });
    } else {
      router.push("/record");
    }
  };

  return (
    <FloatingFab
      side="right"
      iconName="mic-outline"
      accessibilityLabel="Record audio"
      onPress={handlePress}
    />
  );
}
