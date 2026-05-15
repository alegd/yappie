import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ProjectFormScreen } from "@/features/projects/project-form-screen";
import { getProject } from "@/lib/api/projects";
import { queryKeys } from "@/lib/query-keys";

export default function ProjectFormRoute() {
  const { mode, id } = useLocalSearchParams<{ mode: "create" | "edit"; id?: string }>();

  const projectQuery = useQuery({
    queryKey: queryKeys.project(id ?? ""),
    queryFn: () => getProject(id ?? ""),
    enabled: mode === "edit" && Boolean(id),
  });

  if (mode === "edit") {
    if (!projectQuery.data) return null;
    return <ProjectFormScreen mode="edit" project={projectQuery.data} />;
  }

  return <ProjectFormScreen mode="create" />;
}
