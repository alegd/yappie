import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProjectList } from "./project-list";

const { mockGet } = vi.hoisted(() => ({
  mockGet: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  api: {
    get: mockGet,
    delete: vi.fn(),
    setToken: vi.fn(),
  },
}));

const mockProjects = {
  data: [
    {
      id: "p-1",
      name: "E-commerce App",
      description: "Online store",
      context: "Next.js + NestJS e-commerce with Stripe",
      createdAt: "2026-03-21T10:00:00.000Z",
    },
    {
      id: "p-2",
      name: "Mobile App",
      description: null,
      context: null,
      createdAt: "2026-03-21T11:00:00.000Z",
    },
  ],
  total: 2,
  page: 1,
  limit: 50,
};

describe("ProjectList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show loading state", () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    render(<ProjectList />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("should display projects after loading", async () => {
    mockGet.mockResolvedValue(mockProjects);
    render(<ProjectList />);

    expect(await screen.findByText("E-commerce App")).toBeInTheDocument();
    expect(screen.getByText("Mobile App")).toBeInTheDocument();
  });

  it("should show context badge when project has context", async () => {
    mockGet.mockResolvedValue(mockProjects);
    render(<ProjectList />);

    expect(await screen.findByText(/AI context/i)).toBeInTheDocument();
  });

  it("should show empty state when no projects", async () => {
    mockGet.mockResolvedValue({ data: [], total: 0, page: 1, limit: 50 });
    render(<ProjectList />);

    expect(await screen.findByText(/no projects/i)).toBeInTheDocument();
  });

  it("should have a link to create new project", async () => {
    mockGet.mockResolvedValue({ data: [], total: 0, page: 1, limit: 50 });
    render(<ProjectList />);

    await screen.findByText(/no projects/i);
    const newLink = screen.getByRole("link", { name: /new project/i });
    expect(newLink).toHaveAttribute("href", "/dashboard/projects/new");
  });

  it("should have edit links for each project", async () => {
    mockGet.mockResolvedValue(mockProjects);
    render(<ProjectList />);

    await screen.findByText("E-commerce App");
    const editLinks = screen.getAllByRole("link", { name: /edit/i });
    expect(editLinks[0]).toHaveAttribute("href", "/dashboard/projects/p-1/edit");
  });
});
