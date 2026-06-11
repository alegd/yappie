import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QuickRecord } from "./quick-record";
import type { Project } from "@/features/projects/types";

const { mockInvalidateQuery } = vi.hoisted(() => ({
  mockInvalidateQuery: vi.fn(),
}));

vi.mock("@/hooks/use-query", () => ({
  invalidateQuery: mockInvalidateQuery,
}));

let lastUploadProjectId: string | undefined;

vi.mock("@/features/audio/audio-upload", () => ({
  AudioUpload: ({ projectId, disabled }: { projectId: string; disabled?: boolean }) => {
    lastUploadProjectId = projectId;
    return (
      <div data-testid="audio-upload" data-disabled={String(!!disabled)} data-pid={projectId} />
    );
  },
}));

vi.mock("@/components/ui/app-select", () => ({
  AppSelect: ({
    value,
    onChange,
    options,
  }: {
    value: string;
    onChange: (v: string) => void;
    options: Array<{ value: string; label: string }>;
  }) => (
    <select aria-label="Project" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">All</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  ),
}));

const projects: Project[] = [
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { id: "p-1", name: "Apple" } as any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { id: "p-2", name: "Banana" } as any,
];

describe("QuickRecord", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    lastUploadProjectId = undefined;
  });

  it("auto-selects the first project on mount", () => {
    render(<QuickRecord projects={projects} />);
    expect((screen.getByLabelText("Project") as HTMLSelectElement).value).toBe("p-1");
    expect(lastUploadProjectId).toBe("p-1");
  });

  it("changes AudioUpload projectId when selection changes", async () => {
    const { rerender } = render(<QuickRecord projects={projects} />);
    const select = screen.getByLabelText("Project") as HTMLSelectElement;
    select.value = "p-2";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    rerender(<QuickRecord projects={projects} />);
    expect(lastUploadProjectId).toBe("p-2");
  });

  it("renders empty state hint when no projects", () => {
    render(<QuickRecord projects={[]} />);
    expect(screen.getByText(/create a project first/i)).toBeInTheDocument();
    expect(screen.queryByTestId("audio-upload")).not.toBeInTheDocument();
  });
});
