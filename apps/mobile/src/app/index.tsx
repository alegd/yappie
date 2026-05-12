import { Redirect } from "expo-router";
import { useAuthStore } from "@/features/auth/auth-store";

export default function Index() {
  const accessToken = useAuthStore((s) => s.accessToken);
  return <Redirect href={accessToken ? "/projects" : "/(auth)/email"} />;
}
