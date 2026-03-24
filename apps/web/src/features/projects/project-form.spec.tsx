import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProjectForm } from "./project-form";

const { mockPush, mockUseQuery, mockCreateProject, mockUpdateProject } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockUseQuery: vi.fn(),
  mockCreateProject: vi.fn(),
  mockUpdateProject: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/hooks/use-query", () => ({
  useQuery: mockUseQuery,
}));

vi.mock("./hooks/useProjects", () => ({
  useCreateProject: () => ({
    mutate: mockCreateProject,
    isPending: false,
  }),
  useUpdateProject: () => ({
    mutate: mockUpdateProject,
    isPending: false,
  }),
}));

describe("ProjectForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQuery.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
    });
  });

  it("should render form with name, description, and context fields", () => {
    render(<ProjectForm />);

    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Description")).toBeInTheDocument();
    expect(screen.getByLabelText("AI Context")).toBeInTheDocument();
  });

  it("should render 'New Project' title in create mode", () => {
    render(<ProjectForm />);

    expect(screen.getByRole("heading", { name: "New Project" })).toBeInTheDocument();
  });

  it("should render 'Edit Project' title in edit mode", async () => {
    mockUseQuery.mockReturnValue({
      data: {
        name: "Test Project",
        description: "A description",
        context: "Some context",
      },
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
    });

    render(<ProjectForm projectId="proj-1" />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Edit Project" })).toBeInTheDocument();
    });
  });

  it("should render create button with 'Create project' text", () => {
    render(<ProjectForm />);

    expect(screen.getByRole("button", { name: "Create project" })).toBeInTheDocument();
  });

  it("should have cancel link to /dashboard/projects", () => {
    render(<ProjectForm />);

    const cancelLink = screen.getByRole("link", { name: "Cancel" });
    expect(cancelLink).toHaveAttribute("href", "/dashboard/projects");
  });

  it("should have back arrow link to /dashboard/projects", () => {
    render(<ProjectForm />);

    const links = screen
      .getAllByRole("link")
      .filter((link) => link.getAttribute("href") === "/dashboard/projects");
    expect(links.length).toBeGreaterThanOrEqual(2);
  });

  it("should call createProject on submit in create mode", async () => {
    const user = userEvent.setup();
    mockCreateProject.mockResolvedValue({});

    render(<ProjectForm />);

    await user.type(screen.getByLabelText("Name"), "New Project");
    await user.type(screen.getByLabelText("Description"), "A cool project");
    await user.click(screen.getByRole("button", { name: "Create project" }));

    await waitFor(() => {
      expect(mockCreateProject).toHaveBeenCalledWith({
        name: "New Project",
        description: "A cool project",
        context: undefined,
      });
    });

    expect(mockPush).toHaveBeenCalledWith("/dashboard/projects");
  });

  it("should fetch project data in edit mode", async () => {
    mockUseQuery.mockReturnValue({
      data: {
        name: "Existing Project",
        description: "Existing description",
        context: "Existing context",
      },
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
    });

    render(<ProjectForm projectId="proj-1" />);

    await waitFor(() => {
      expect(screen.getByLabelText("Name")).toHaveValue("Existing Project");
      expect(screen.getByLabelText("Description")).toHaveValue("Existing description");
      expect(screen.getByLabelText("AI Context")).toHaveValue("Existing context");
    });
  });

  it("should show loading state while fetching project", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
      mutate: vi.fn(),
    });

    render(<ProjectForm projectId="proj-1" />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });
});
