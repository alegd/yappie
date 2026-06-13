import { render, screen, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RecordingModal } from "./recording-modal";
import { useRecordingModalStore } from "./recording-modal-store";

const { mockUseQuery, mockInvalidateQuery, mockToastInfo, mockToastSuccess } = vi.hoisted(() => ({
  mockUseQuery: vi.fn(),
  mockInvalidateQuery: vi.fn(),
  mockToastInfo: vi.fn(),
  mockToastSuccess: vi.fn(),
}));

vi.mock("@/hooks/use-query", () => ({
  useQuery: mockUseQuery,
  invalidateQuery: mockInvalidateQuery,
}));

vi.mock("@/components/ui/toast/Toast", () => ({
  toast: {
    info: mockToastInfo,
    success: mockToastSuccess,
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

let lastRecordTabProps: {
  projectId: string;
  disabled: boolean;
  onUploaded: (id: string) => void;
  onError: (msg: string, retryable: boolean) => void;
  onUploadingChange: (b: boolean) => void;
} | null = null;

vi.mock("./record-tab", () => ({
  RecordTab: (props: typeof lastRecordTabProps) => {
    lastRecordTabProps = props as never;
    return (
      <div
        data-testid="record-tab"
        data-pid={props?.projectId}
        data-disabled={String(props?.disabled)}
      />
    );
  },
}));

vi.mock("./upload-tab", () => ({
  UploadTab: (props: typeof lastRecordTabProps) => (
    <div data-testid="upload-tab" data-pid={props?.projectId} />
  ),
}));

let lastProcessingProps: {
  audioId: string;
  onCompleted: (n: number) => void;
  onFailed: (msg: string) => void;
  onTimeout: () => void;
  onCancel: () => void;
} | null = null;
vi.mock("./processing-state", () => ({
  ProcessingState: (props: typeof lastProcessingProps) => {
    lastProcessingProps = props as never;
    return <div data-testid="processing-state">processing:{props?.audioId}</div>;
  },
}));

vi.mock("@/components/ui/app-select", () => ({
  AppSelect: ({
    value,
    onChange,
    options,
    ariaLabel,
  }: {
    value: string;
    onChange: (v: string) => void;
    options: Array<{ value: string; label: string }>;
    ariaLabel?: string;
  }) => (
    <select aria-label={ariaLabel} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">--</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
  lastRecordTabProps = null;
  lastProcessingProps = null;
  useRecordingModalStore.setState({ isOpen: false, projectId: null });
  vi.stubGlobal("MediaRecorder", class {});
  mockUseQuery.mockReturnValue({
    data: {
      data: [
        { id: "p-1", name: "Apple" },
        { id: "p-2", name: "Banana" },
      ],
      total: 2,
      page: 1,
      limit: 50,
    },
    isLoading: false,
    error: undefined,
    mutate: vi.fn(),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("RecordingModal", () => {
  it("does not render content when store.isOpen is false", () => {
    render(<RecordingModal />);
    expect(screen.queryByTestId("record-tab")).not.toBeInTheDocument();
  });

  it("renders Record tab by default when opened with a projectId", () => {
    render(<RecordingModal />);
    act(() => useRecordingModalStore.getState().open("p-1"));
    expect(screen.getByTestId("record-tab")).toHaveAttribute("data-pid", "p-1");
    expect(screen.getByText(/recording for/i)).toBeInTheDocument();
    expect(screen.queryByLabelText("Project")).not.toBeInTheDocument();
  });

  it("renders project selector when opened with no projectId", () => {
    render(<RecordingModal />);
    act(() => useRecordingModalStore.getState().open());
    expect(screen.getByLabelText("Project")).toBeInTheDocument();
    expect(screen.getByTestId("record-tab")).toHaveAttribute("data-pid", "");
    expect(screen.getByTestId("record-tab")).toHaveAttribute("data-disabled", "true");
  });

  it("enables Record tab once a project is chosen from the selector", () => {
    render(<RecordingModal />);
    act(() => useRecordingModalStore.getState().open());
    const select = screen.getByLabelText("Project") as HTMLSelectElement;
    act(() => {
      select.value = "p-2";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(screen.getByTestId("record-tab")).toHaveAttribute("data-pid", "p-2");
    expect(screen.getByTestId("record-tab")).toHaveAttribute("data-disabled", "false");
  });

  it("switches to Upload tab when the Upload role=tab is clicked", () => {
    render(<RecordingModal />);
    act(() => useRecordingModalStore.getState().open("p-1"));
    act(() => {
      screen.getByRole("tab", { name: /upload/i }).click();
    });
    expect(screen.queryByTestId("record-tab")).not.toBeInTheDocument();
    expect(screen.getByTestId("upload-tab")).toBeInTheDocument();
  });

  it("clicking the close button calls store.close()", () => {
    render(<RecordingModal />);
    act(() => useRecordingModalStore.getState().open("p-1"));
    act(() => {
      screen.getByLabelText(/close recording modal/i).click();
    });
    expect(useRecordingModalStore.getState().isOpen).toBe(false);
  });

  it("transitions to processing after onUploaded fires", () => {
    render(<RecordingModal />);
    act(() => useRecordingModalStore.getState().open("p-1"));
    act(() => {
      lastRecordTabProps?.onUploaded("a-42");
    });
    expect(screen.getByTestId("processing-state")).toHaveTextContent("a-42");
  });

  it("on processing onCompleted, toasts success, invalidates queries and closes", () => {
    render(<RecordingModal />);
    act(() => useRecordingModalStore.getState().open("p-1"));
    act(() => {
      lastRecordTabProps?.onUploaded("a-42");
    });
    act(() => {
      lastProcessingProps?.onCompleted(3);
    });
    expect(mockToastSuccess).toHaveBeenCalledWith(expect.stringContaining("3 tickets generated"));
    expect(mockInvalidateQuery).toHaveBeenCalledWith(
      expect.stringContaining("/v1/audio?limit=50&projectId=p-1"),
    );
    expect(mockInvalidateQuery).toHaveBeenCalledWith("/v1/activity?limit=10");
    expect(useRecordingModalStore.getState().isOpen).toBe(false);
  });

  it("on processing onFailed, renders an error message with Retry", () => {
    render(<RecordingModal />);
    act(() => useRecordingModalStore.getState().open("p-1"));
    act(() => {
      lastRecordTabProps?.onUploaded("a-42");
    });
    act(() => {
      lastProcessingProps?.onFailed("transcription crashed");
    });
    expect(screen.getByRole("alert")).toHaveTextContent("transcription crashed");
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });

  it("Retry from error returns to idle (Record tab visible again)", () => {
    render(<RecordingModal />);
    act(() => useRecordingModalStore.getState().open("p-1"));
    act(() => {
      lastRecordTabProps?.onError("boom", true);
    });
    expect(screen.getByRole("alert")).toHaveTextContent("boom");
    act(() => {
      screen.getByRole("button", { name: /retry/i }).click();
    });
    expect(screen.getByTestId("record-tab")).toBeInTheDocument();
  });

  it("on processing onTimeout, toasts info and closes", () => {
    render(<RecordingModal />);
    act(() => useRecordingModalStore.getState().open("p-1"));
    act(() => {
      lastRecordTabProps?.onUploaded("a-42");
    });
    act(() => {
      lastProcessingProps?.onTimeout();
    });
    expect(mockToastInfo).toHaveBeenCalledWith(expect.stringContaining("background"));
    expect(useRecordingModalStore.getState().isOpen).toBe(false);
  });

  it("hides tabs once flow leaves idle state", () => {
    render(<RecordingModal />);
    act(() => useRecordingModalStore.getState().open("p-1"));
    act(() => {
      lastRecordTabProps?.onUploaded("a-42");
    });
    expect(screen.queryByRole("tab", { name: /record/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: /upload/i })).not.toBeInTheDocument();
  });

  it("renders an Uploading spinner when child fires onUploadingChange(true) from idle", () => {
    render(<RecordingModal />);
    act(() => useRecordingModalStore.getState().open("p-1"));
    act(() => {
      lastRecordTabProps?.onUploadingChange(true);
    });
    expect(screen.getByLabelText(/uploading/i)).toBeInTheDocument();
  });

  it("auto-switches to Upload mode and toasts when MediaRecorder is undefined on open", () => {
    vi.stubGlobal("MediaRecorder", undefined);
    render(<RecordingModal />);
    act(() => useRecordingModalStore.getState().open("p-1"));
    expect(screen.getByTestId("upload-tab")).toBeInTheDocument();
    expect(mockToastInfo).toHaveBeenCalledWith(expect.stringContaining("not supported"));
  });
});
