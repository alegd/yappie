import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProjectHeader } from "./project-header";
import type { Project } from "@/features/projects/types";

vi.mock("@/features/audio/audio-upload", () => ({
  AudioUpload: ({ projectId }: { projectId: string }) => (
    <div data-testid="audio-upload">audio-upload:{projectId}</div>
  ),
}));

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
  it("renders the project name and description", () => {
    render(<ProjectHeader project={project} onUploaded={vi.fn()} />);
    expect(screen.getByText("Marketing app")).toBeInTheDocument();
    expect(screen.getByText("Internal tools")).toBeInTheDocument();
  });

  it("renders an 'Edit context' link pointing to the edit page", () => {
    render(<ProjectHeader project={project} onUploaded={vi.fn()} />);
    const link = screen.getByRole("link", { name: /edit context/i });
    expect(link).toHaveAttribute("href", "/dashboard/projects/p-1/edit");
  });

  it("renders AudioUpload bound to the project id", () => {
    render(<ProjectHeader project={project} onUploaded={vi.fn()} />);
    expect(screen.getByTestId("audio-upload")).toHaveTextContent("audio-upload:p-1");
  });

  it("omits the description when null", () => {
    render(<ProjectHeader project={{ ...project, description: null }} onUploaded={vi.fn()} />);
    expect(screen.queryByText("Internal tools")).not.toBeInTheDocument();
  });
});
