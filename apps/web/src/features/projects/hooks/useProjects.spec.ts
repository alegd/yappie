import { describe, expect, it, vi } from "vitest";
import { useCreateProject, useDeleteProject, useUpdateProject } from "./useProjects";

const mockUseMutation = vi.fn().mockReturnValue({
  mutate: vi.fn(),
  isPending: false,
  error: undefined,
});

vi.mock("@/hooks/use-query", () => ({
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
}));

describe("useProjects hooks", () => {
  describe("useCreateProject", () => {
    it("should call useMutation with POST, create endpoint, and invalidate list", () => {
      useCreateProject();

      expect(mockUseMutation).toHaveBeenCalledWith({
        method: "POST",
        queryKey: "/v1/projects",
        invalidateKeys: ["/v1/projects?limit=50"],
      });
    });
  });

  describe("useUpdateProject", () => {
    it("should call useMutation with PATCH, project detail endpoint, and invalidate list", () => {
      useUpdateProject("proj-1");

      expect(mockUseMutation).toHaveBeenCalledWith({
        method: "PATCH",
        queryKey: "/v1/projects/proj-1",
        invalidateKeys: ["/v1/projects?limit=50"],
      });
    });
  });

  describe("useDeleteProject", () => {
    it("should call useMutation with DELETE and list endpoint", () => {
      useDeleteProject();

      expect(mockUseMutation).toHaveBeenCalledWith({
        method: "DELETE",
        queryKey: "/v1/projects?limit=50",
      });
    });
  });
});
