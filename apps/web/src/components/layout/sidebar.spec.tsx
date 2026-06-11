import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Sidebar } from "./sidebar";

const { mockUseQuery, mockSignOut, mockUsePathname } = vi.hoisted(() => ({
  mockUseQuery: vi.fn(),
  mockSignOut: vi.fn(),
  mockUsePathname: vi.fn(),
}));

vi.mock("@/hooks/use-query", () => ({
  useQuery: mockUseQuery,
}));

vi.mock("next-auth/react", () => ({
  signOut: mockSignOut,
}));

vi.mock("next/navigation", () => ({
  usePathname: mockUsePathname,
}));

vi.mock("next/link", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const user = { name: "Jane Doe", email: "jane@example.com" };

const mockProjects = {
  data: [
    { id: "p-a", name: "Apple", pendingTicketCount: 0 },
    { id: "p-b", name: "Banana", pendingTicketCount: 3 },
    { id: "p-c", name: "Cherry", pendingTicketCount: 1 },
  ],
  total: 3,
  page: 1,
  limit: 50,
};

describe("Sidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePathname.mockReturnValue("/dashboard");
    mockUseQuery.mockReturnValue({
      data: mockProjects,
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
    });
  });

  it("renders Home / + New project / Settings as fixed nav items", () => {
    render(<Sidebar user={user} />);
    expect(screen.getByRole("link", { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /\+ new project/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /settings/i })).toBeInTheDocument();
  });

  it("does NOT render legacy Audios / Tickets / Projects / Analytics top-level items", () => {
    render(<Sidebar user={user} />);
    expect(screen.queryByRole("link", { name: /^audios$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /^tickets$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /^projects$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /^analytics$/i })).not.toBeInTheDocument();
  });

  it("renders each project as a nav item sorted alphabetically", () => {
    render(<Sidebar user={user} />);
    const projectLinks = screen
      .getAllByRole("link")
      .filter((l) => /^Apple|Banana|Cherry$/.test(l.textContent?.replace(/\d+$/, "") ?? ""));
    expect(projectLinks[0]).toHaveTextContent("Apple");
    expect(projectLinks[1].textContent).toMatch(/Banana/);
    expect(projectLinks[2].textContent).toMatch(/Cherry/);
  });

  it("project links point to /dashboard/projects/[id]", () => {
    render(<Sidebar user={user} />);
    const apple = screen.getByRole("link", { name: /apple/i });
    expect(apple).toHaveAttribute("href", "/dashboard/projects/p-a");
  });

  it("shows pendingTicketCount badge only when > 0", () => {
    render(<Sidebar user={user} />);
    const banana = screen.getByRole("link", { name: /banana/i });
    expect(banana).toHaveTextContent("3");
    const apple = screen.getByRole("link", { name: /apple/i });
    expect(apple).not.toHaveTextContent("0");
  });

  it("highlights the active project when the pathname matches", () => {
    mockUsePathname.mockReturnValue("/dashboard/projects/p-b");
    render(<Sidebar user={user} />);
    const banana = screen.getByRole("link", { name: /banana/i });
    expect(banana.className).toMatch(/bg-accent-surface|text-accent/);
  });

  it("does NOT highlight a project when the pathname is the /edit subroute", () => {
    mockUsePathname.mockReturnValue("/dashboard/projects/p-b/edit");
    render(<Sidebar user={user} />);
    const banana = screen.getByRole("link", { name: /banana/i });
    expect(banana.className).not.toMatch(/bg-accent-surface/);
  });

  it("Home link points to /dashboard", () => {
    render(<Sidebar user={user} />);
    expect(screen.getByRole("link", { name: /home/i })).toHaveAttribute("href", "/dashboard");
  });

  it("+ New project link points to /dashboard/projects/new", () => {
    render(<Sidebar user={user} />);
    expect(screen.getByRole("link", { name: /\+ new project/i })).toHaveAttribute(
      "href",
      "/dashboard/projects/new",
    );
  });

  it("renders user chrome (name + email) at the bottom", () => {
    render(<Sidebar user={user} />);
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("jane@example.com")).toBeInTheDocument();
  });

  it("logout button calls signOut", async () => {
    const u = userEvent.setup();
    render(<Sidebar user={user} />);
    await u.click(screen.getByLabelText(/log out/i));
    expect(mockSignOut).toHaveBeenCalledWith({ redirectTo: "/auth" });
  });

  it("renders gracefully with no projects", () => {
    mockUseQuery.mockReturnValue({
      data: { data: [], total: 0, page: 1, limit: 50 },
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
    });
    render(<Sidebar user={user} />);
    expect(screen.getByRole("link", { name: /home/i })).toBeInTheDocument();
    expect(screen.queryByText(/apple|banana|cherry/i)).not.toBeInTheDocument();
  });
});
