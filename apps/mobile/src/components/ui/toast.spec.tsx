import { act, render } from "@testing-library/react-native";
import { toast, ToastContainer } from "./toast";

describe("toast singleton", () => {
  it("notifies subscribers when success is called", () => {
    const listener = jest.fn();
    const unsubscribe = toast.subscribe(listener);
    toast.success("Saved");
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Saved", variant: "success" }),
    );
    unsubscribe();
  });

  it("notifies subscribers when error is called", () => {
    const listener = jest.fn();
    const unsubscribe = toast.subscribe(listener);
    toast.error("Failed");
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Failed", variant: "error" }),
    );
    unsubscribe();
  });

  it("notifies subscribers when info is called", () => {
    const listener = jest.fn();
    const unsubscribe = toast.subscribe(listener);
    toast.info("Heads up");
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Heads up", variant: "info" }),
    );
    unsubscribe();
  });

  it("does NOT notify after unsubscribe", () => {
    const listener = jest.fn();
    const unsubscribe = toast.subscribe(listener);
    unsubscribe();
    toast.success("nope");
    expect(listener).not.toHaveBeenCalled();
  });
});

describe("ToastContainer", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders nothing initially", () => {
    const { queryByText } = render(<ToastContainer />);
    expect(queryByText("Saved")).toBeNull();
  });

  it("renders a toast when triggered", () => {
    const { getByText } = render(<ToastContainer />);
    act(() => {
      toast.success("Saved");
    });
    expect(getByText("Saved")).toBeTruthy();
  });

  it("auto-dismisses after the default duration", () => {
    const { queryByText, getByText } = render(<ToastContainer />);
    act(() => {
      toast.success("Saved");
    });
    expect(getByText("Saved")).toBeTruthy();
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(queryByText("Saved")).toBeNull();
  });
});
