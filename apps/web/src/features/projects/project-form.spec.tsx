import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProjectForm } from "./project-form";

const { mockPush, mockPost, mockPatch, mockGet } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockPost: vi.fn(),
  mockPatch: vi.fn(),
  mockGet: vi.fn(),
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

vi.mock("@/lib/api", () => ({
  api: {
    post: mockPost,
    patch: mockPatch,
    get: mockGet,
  },
}));

vi.mock("@/lib/constants/endpoints", () => ({
  PROJECTS_CREATE: "/projects",
  projectDetail: (id: string) => `/projects/${id}`,
}));

describe("ProjectForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    mockGet.mockResolvedValue({
      name: "Test Project",
      description: "A description",
      context: "Some context",
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

  it("should call api.post on submit in create mode", async () => {
    const user = userEvent.setup();
    mockPost.mockResolvedValue({});

    render(<ProjectForm />);

    await user.type(screen.getByLabelText("Name"), "New Project");
    await user.type(screen.getByLabelText("Description"), "A cool project");
    await user.click(screen.getByRole("button", { name: "Create project" }));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith("/projects", {
        name: "New Project",
        description: "A cool project",
        context: undefined,
      });
    });

    expect(mockPush).toHaveBeenCalledWith("/dashboard/projects");
  });

  it("should show error when save fails", async () => {
    const user = userEvent.setup();
    mockPost.mockRejectedValue(new Error("Network error"));

    render(<ProjectForm />);

    await user.type(screen.getByLabelText("Name"), "Fail Project");
    await user.click(screen.getByRole("button", { name: "Create project" }));

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });

  it("should fetch project data in edit mode", async () => {
    mockGet.mockResolvedValue({
      name: "Existing Project",
      description: "Existing description",
      context: "Existing context",
    });

    render(<ProjectForm projectId="proj-1" />);

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith("/projects/proj-1");
    });

    await waitFor(() => {
      expect(screen.getByLabelText("Name")).toHaveValue("Existing Project");
      expect(screen.getByLabelText("Description")).toHaveValue("Existing description");
      expect(screen.getByLabelText("AI Context")).toHaveValue("Existing context");
    });
  });

  it("should show loading state while fetching project", () => {
    mockGet.mockReturnValue(new Promise(() => {})); // never resolves

    render(<ProjectForm projectId="proj-1" />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });
});
