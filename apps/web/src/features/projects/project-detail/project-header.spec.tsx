import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProjectHeader } from "./project-header";
import { useRecordingModalStore } from "@/features/recording/recording-modal-store";
import type { Project } from "@/features/projects/types";

vi.mock("next/link", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const project: Project = {
  id: "p-1",
  name: "Marketing app",
  description: "Internal tools",
  context: null,
  userId: "u-1",
  createdAt: "",
  updatedAt: "",
};

describe("ProjectHeader", () => {
  beforeEach(() => {
    useRecordingModalStore.setState({ isOpen: false, projectId: null });
  });

  it("renders the project name and description", () => {
    render(<ProjectHeader project={project} />);
    expect(screen.getByText("Marketing app")).toBeInTheDocument();
    expect(screen.getByText("Internal tools")).toBeInTheDocument();
  });

  it("renders an 'Edit context' link pointing to the edit page", () => {
    render(<ProjectHeader project={project} />);
    const link = screen.getByRole("link", { name: /edit context/i });
    expect(link).toHaveAttribute("href", "/dashboard/projects/p-1/edit");
  });

  it("renders a Record button that opens the modal with this project preselected", () => {
    render(<ProjectHeader project={project} />);
    const button = screen.getByRole("button", { name: /record/i });
    button.click();
    const state = useRecordingModalStore.getState();
    expect(state.isOpen).toBe(true);
    expect(state.projectId).toBe("p-1");
  });

  it("omits the description when null", () => {
    render(<ProjectHeader project={{ ...project, description: null }} />);
    expect(screen.queryByText("Internal tools")).not.toBeInTheDocument();
  });
});
