import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HomePage } from "./home-page";

const { mockUseQuery } = vi.hoisted(() => ({
  mockUseQuery: vi.fn(),
}));

vi.mock("@/hooks/use-query", () => ({
  useQuery: mockUseQuery,
}));

vi.mock("./quick-record", () => ({
  QuickRecord: () => <div data-testid="quick-record" />,
}));

vi.mock("./activity-feed", () => ({
  ActivityFeed: () => <div data-testid="activity-feed" />,
}));

vi.mock("./quota-widget", () => ({
  QuotaWidget: () => <div data-testid="quota-widget" />,
}));

vi.mock("@/features/audio/onboarding-checklist", () => ({
  OnboardingChecklist: ({ hasProjects }: { hasProjects: boolean }) => (
    <div data-testid="onboarding" data-has-projects={String(hasProjects)} />
  ),
}));

function setupQueries(opts: {
  projects?: Array<{ id: string; name: string }>;
  jiraConnected?: boolean;
}) {
  let i = 0;
  mockUseQuery.mockImplementation(() => {
    const which = i++ % 2;
    if (which === 0) {
      return {
        data: opts.projects
          ? { data: opts.projects, total: opts.projects.length, page: 1, limit: 50 }
          : { data: [], total: 0, page: 1, limit: 50 },
        isLoading: false,
        error: undefined,
        mutate: vi.fn(),
      };
    }
    return {
      data: { connected: opts.jiraConnected ?? false, siteName: null },
      isLoading: false,
      error: undefined,
      mutate: vi.fn(),
    };
  });
}

describe("HomePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders quick record + activity feed + quota widget when projects exist", () => {
    setupQueries({ projects: [{ id: "p-1", name: "InstaCaribe" }] });
    render(<HomePage />);
    expect(screen.getByTestId("quick-record")).toBeInTheDocument();
    expect(screen.getByTestId("activity-feed")).toBeInTheDocument();
    expect(screen.getByTestId("quota-widget")).toBeInTheDocument();
    expect(screen.queryByTestId("onboarding")).not.toBeInTheDocument();
  });

  it("renders onboarding checklist + quota when no projects", () => {
    setupQueries({ projects: [] });
    render(<HomePage />);
    expect(screen.getByTestId("onboarding")).toBeInTheDocument();
    expect(screen.getByTestId("quota-widget")).toBeInTheDocument();
    expect(screen.queryByTestId("quick-record")).not.toBeInTheDocument();
    expect(screen.queryByTestId("activity-feed")).not.toBeInTheDocument();
  });

  it("passes hasProjects correctly to onboarding", () => {
    setupQueries({ projects: [] });
    render(<HomePage />);
    expect(screen.getByTestId("onboarding")).toHaveAttribute("data-has-projects", "false");
  });
});
