import { useMutation } from "@/hooks/use-query";
import { PROJECTS_CREATE, PROJECTS_LIST, projectDetail } from "@/lib/constants/endpoints";
import { DELETE, PATCH, POST } from "@/lib/constants/http";

export const useCreateProject = () => {
  return useMutation({
    method: POST,
    queryKey: PROJECTS_CREATE,
    invalidateKeys: [PROJECTS_LIST],
  });
};

export const useUpdateProject = (id: string) => {
  return useMutation({
    method: PATCH,
    queryKey: projectDetail(id),
    invalidateKeys: [PROJECTS_LIST],
  });
};

export const useDeleteProject = () => {
  return useMutation({
    method: DELETE,
    queryKey: PROJECTS_LIST,
  });
};
