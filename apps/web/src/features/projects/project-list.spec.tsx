import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProjectList } from "./project-list";

const { mockUseQuery, mockInvalidateQuery, mockApiFetcher } = vi.hoisted(() => ({
  mockUseQuery: vi.fn(),
  mockInvalidateQuery: vi.fn(),
  mockApiFetcher: vi.fn(),
}));

vi.mock("@/hooks/use-query", () => ({
  useQuery: mockUseQuery,
  invalidateQuery: mockInvalidateQuery,
}));

vi.mock("@/lib/api-fetcher", () => ({
  apiFetcher: mockApiFetcher,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
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
    mockUseQuery.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
      mutate: vi.fn(),
    });
    render(<ProjectList />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("should display projects after loading", async () => {
    mockUseQuery.mockReturnValue({
      data: mockProjects,
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
    });
    render(<ProjectList />);

    expect(await screen.findByText("E-commerce App")).toBeInTheDocument();
    expect(screen.getByText("Mobile App")).toBeInTheDocument();
  });

  it("should show context badge when project has context", async () => {
    mockUseQuery.mockReturnValue({
      data: mockProjects,
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
    });
    render(<ProjectList />);

    expect(await screen.findByText(/AI context/i)).toBeInTheDocument();
  });

  it("should show empty state when no projects", async () => {
    mockUseQuery.mockReturnValue({
      data: { data: [], total: 0, page: 1, limit: 50 },
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
    });
    render(<ProjectList />);

    expect(await screen.findByText(/no projects/i)).toBeInTheDocument();
  });

  it("should have a link to create new project", async () => {
    mockUseQuery.mockReturnValue({
      data: { data: [], total: 0, page: 1, limit: 50 },
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
    });
    render(<ProjectList />);

    await screen.findByText(/no projects/i);
    expect(screen.getByRole("button", { name: /new project/i })).toBeInTheDocument();
  });

  it("should have edit links for each project", async () => {
    mockUseQuery.mockReturnValue({
      data: mockProjects,
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
    });
    render(<ProjectList />);

    await screen.findByText("E-commerce App");
    const editLinks = screen.getAllByRole("link", { name: /edit/i });
    expect(editLinks[0]).toHaveAttribute("href", "/dashboard/projects/p-1/edit");
  });

  it("should delete project when confirmed", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    mockApiFetcher.mockResolvedValue(undefined);

    mockUseQuery.mockReturnValue({
      data: mockProjects,
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
    });
    render(<ProjectList />);

    await screen.findByText("E-commerce App");
    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    await user.click(deleteButtons[0]);

    expect(mockApiFetcher).toHaveBeenCalledWith("/v1/projects/p-1", { method: "DELETE" });
    expect(mockInvalidateQuery).toHaveBeenCalled();
  });

  it("should not delete project when confirm cancelled", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(false);

    mockUseQuery.mockReturnValue({
      data: mockProjects,
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
    });
    render(<ProjectList />);

    await screen.findByText("E-commerce App");
    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    await user.click(deleteButtons[0]);

    expect(mockApiFetcher).not.toHaveBeenCalled();
  });
});
