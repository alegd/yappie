import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QuickRecord } from "./quick-record";
import type { Project } from "@/features/projects/types";

const { mockOpen } = vi.hoisted(() => ({
  mockOpen: vi.fn(),
}));

vi.mock("@/features/recording/recording-modal-store", () => ({
  useRecordingModalStore: (selector?: (s: any) => any) => {
    if (!selector) return mockStore;
    return selector(mockStore);
  },
}));

const mockStore = {
  isOpen: false,
  projectId: null,
  open: mockOpen,
  close: vi.fn(),
  setState: vi.fn(function (updates: any) {
    if (typeof updates === "function") {
      updates(mockStore);
    } else {
      Object.assign(mockStore, updates);
    }
  }),
  getState: vi.fn(() => mockStore),
};

const projects: Project[] = [
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { id: "p-1", name: "Apple" } as any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { id: "p-2", name: "Banana" } as any,
];

describe("QuickRecord", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStore.isOpen = false;
    mockStore.projectId = null;
  });

  it("renders a Record button when there are projects", () => {
    render(<QuickRecord projects={projects} />);
    const button = screen.getByRole("button", { name: /record/i });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it("clicking Record opens the modal with no projectId", () => {
    render(<QuickRecord projects={projects} />);
    screen.getByRole("button", { name: /record/i }).click();
    expect(mockOpen).toHaveBeenCalledWith();
  });

  it("disables the Record button and shows hint when no projects exist", () => {
    render(<QuickRecord projects={[]} />);
    const button = screen.getByRole("button", { name: /record/i });
    expect(button).toBeDisabled();
    expect(screen.getByText(/create a project first/i)).toBeInTheDocument();
  });
});
