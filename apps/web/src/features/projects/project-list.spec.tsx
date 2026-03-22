import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProjectList } from "./project-list";

const { mockGet, mockPost, mockDelete } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
  mockDelete: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  api: {
    get: mockGet,
    post: mockPost,
    patch: vi.fn(),
    delete: mockDelete,
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

  it("should show create project form when clicking new button", async () => {
    const user = userEvent.setup();
    mockGet.mockResolvedValue({ data: [], total: 0, page: 1, limit: 50 });
    render(<ProjectList />);

    await screen.findByText(/no projects/i);
    await user.click(screen.getByRole("button", { name: /new project/i }));

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/context/i)).toBeInTheDocument();
  });

  it("should have context textarea with descriptive placeholder", async () => {
    const user = userEvent.setup();
    mockGet.mockResolvedValue({ data: [], total: 0, page: 1, limit: 50 });
    render(<ProjectList />);

    await screen.findByText(/no projects/i);
    await user.click(screen.getByRole("button", { name: /new project/i }));

    const contextField = screen.getByLabelText(/context/i);
    expect(contextField.getAttribute("placeholder")).toContain("e-commerce");
  });
});
