import { Redirect, Stack } from "expo-router";
import { useAuthStore } from "@/features/auth/auth-store";

export default function AuthLayout() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const hydrated = useAuthStore((s) => s.hydrated);

  if (!hydrated) return null;
  if (accessToken) return <Redirect href="/projects" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
