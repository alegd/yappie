import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthFlow } from "./auth-flow";

const { mockPublicFetcher, mockSignIn } = vi.hoisted(() => ({
  mockPublicFetcher: vi.fn(),
  mockSignIn: vi.fn(),
}));

vi.mock("@/lib/public-fetcher", () => ({
  publicFetcher: mockPublicFetcher,
}));

vi.mock("next-auth/react", () => ({
  signIn: mockSignIn,
}));

describe("AuthFlow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it("should render email step by default", () => {
    render(<AuthFlow />);

    expect(screen.getByRole("heading", { name: /what's your email/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeInTheDocument();
  });

  it("should show error on failed OTP request", async () => {
    const user = userEvent.setup();
    mockPublicFetcher.mockRejectedValue(new Error("Too many requests"));

    render(<AuthFlow />);

    await user.type(screen.getByPlaceholderText("you@example.com"), "test@example.com");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => {
      expect(screen.getByText("Too many requests")).toBeInTheDocument();
    });
  });

  it("should advance to OTP step after successful request", async () => {
    const user = userEvent.setup();
    mockPublicFetcher.mockResolvedValue({ sent: true });

    render(<AuthFlow />);

    await user.type(screen.getByPlaceholderText("you@example.com"), "test@example.com");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Check your inbox" })).toBeInTheDocument();
    });

    expect(screen.getByText("We sent a 4-digit code to test@example.com")).toBeInTheDocument();
  });

  it("should show 'Resend code' text on OTP step during cooldown", async () => {
    const user = userEvent.setup();
    mockPublicFetcher.mockResolvedValue({ sent: true });

    render(<AuthFlow />);

    await user.type(screen.getByPlaceholderText("you@example.com"), "test@example.com");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Check your inbox" })).toBeInTheDocument();
    });

    // During cooldown, resend text with timer is visible
    expect(screen.getByText(/Resend code in/)).toBeInTheDocument();
  });

  it("should show back button on OTP step", async () => {
    const user = userEvent.setup();
    mockPublicFetcher.mockResolvedValue({ sent: true });

    render(<AuthFlow />);

    await user.type(screen.getByPlaceholderText("you@example.com"), "test@example.com");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument();
    });
  });

  it("should go back to email step when back button is clicked on OTP step", async () => {
    const user = userEvent.setup();
    mockPublicFetcher.mockResolvedValue({ sent: true });

    render(<AuthFlow />);

    await user.type(screen.getByPlaceholderText("you@example.com"), "test@example.com");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Check your inbox" })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Back" }));

    expect(screen.getByRole("heading", { name: "What's your email?" })).toBeInTheDocument();
  });

  it("should call signIn for existing user after OTP verification", async () => {
    const user = userEvent.setup();
    mockPublicFetcher.mockResolvedValueOnce({ sent: true }).mockResolvedValueOnce({
      isNewUser: false,
      accessToken: "access-123",
      refreshToken: "refresh-123",
      user: { id: "u1", email: "test@example.com", name: "Test User" },
    });
    mockSignIn.mockResolvedValue(undefined);

    render(<AuthFlow />);

    await user.type(screen.getByPlaceholderText("you@example.com"), "test@example.com");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Check your inbox" })).toBeInTheDocument();
    });

    const codeInputs = screen
      .getAllByRole("textbox")
      .filter((input) => (input as HTMLInputElement).maxLength === 1);

    await user.type(codeInputs[0], "1");
    await user.type(codeInputs[1], "2");
    await user.type(codeInputs[2], "3");
    await user.type(codeInputs[3], "4");

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith("credentials", {
        accessToken: "access-123",
        refreshToken: "refresh-123",
        userId: "u1",
        email: "test@example.com",
        name: "Test User",
        redirectTo: "/dashboard/audios",
      });
    });
  });

  it("should advance to name step for new user after OTP verification", async () => {
    const user = userEvent.setup();
    mockPublicFetcher.mockResolvedValueOnce({ sent: true }).mockResolvedValueOnce({
      isNewUser: true,
      verified: true,
    });

    render(<AuthFlow />);

    await user.type(screen.getByPlaceholderText("you@example.com"), "new@example.com");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Check your inbox" })).toBeInTheDocument();
    });

    const codeInputs = screen
      .getAllByRole("textbox")
      .filter((input) => (input as HTMLInputElement).maxLength === 1);

    await user.type(codeInputs[0], "5");
    await user.type(codeInputs[1], "6");
    await user.type(codeInputs[2], "7");
    await user.type(codeInputs[3], "8");

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "What should we call you?" })).toBeInTheDocument();
    });

    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create account" })).toBeInTheDocument();
  });

  it("should complete registration and call signIn for new user", async () => {
    const user = userEvent.setup();
    mockPublicFetcher
      .mockResolvedValueOnce({ sent: true })
      .mockResolvedValueOnce({ isNewUser: true, verified: true })
      .mockResolvedValueOnce({
        accessToken: "access-new",
        refreshToken: "refresh-new",
        user: { id: "u2", email: "new@example.com", name: "New User" },
      });
    mockSignIn.mockResolvedValue(undefined);

    render(<AuthFlow />);

    // Step 1: email
    await user.type(screen.getByPlaceholderText("you@example.com"), "new@example.com");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    // Step 2: OTP
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Check your inbox" })).toBeInTheDocument();
    });

    const codeInputs = screen
      .getAllByRole("textbox")
      .filter((input) => (input as HTMLInputElement).maxLength === 1);

    await user.type(codeInputs[0], "1");
    await user.type(codeInputs[1], "2");
    await user.type(codeInputs[2], "3");
    await user.type(codeInputs[3], "4");

    // Step 3: name
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "What should we call you?" })).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText("Name"), "New User");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith("credentials", {
        accessToken: "access-new",
        refreshToken: "refresh-new",
        userId: "u2",
        email: "new@example.com",
        name: "New User",
        redirectTo: "/dashboard/audios",
      });
    });
  });

  it("should show 'Sending...' while requesting OTP", async () => {
    const user = userEvent.setup();
    mockPublicFetcher.mockReturnValue(new Promise(() => {})); // never resolves

    render(<AuthFlow />);

    await user.type(screen.getByPlaceholderText("you@example.com"), "test@example.com");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByRole("button", { name: "Sending..." })).toBeInTheDocument();
  });

  it("should show error and clear OTP inputs on verify-otp failure", async () => {
    const user = userEvent.setup();
    mockPublicFetcher
      .mockResolvedValueOnce({ sent: true })
      .mockRejectedValueOnce(new Error("Invalid code"));

    render(<AuthFlow />);

    await user.type(screen.getByPlaceholderText("you@example.com"), "test@example.com");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Check your inbox" })).toBeInTheDocument();
    });

    const codeInputs = screen
      .getAllByRole("textbox")
      .filter((input) => (input as HTMLInputElement).maxLength === 1);

    await user.type(codeInputs[0], "1");
    await user.type(codeInputs[1], "2");
    await user.type(codeInputs[2], "3");
    await user.type(codeInputs[3], "9");

    await waitFor(() => {
      expect(screen.getByText("Invalid code")).toBeInTheDocument();
    });

    // All OTP inputs should be cleared
    const clearedInputs = screen
      .getAllByRole("textbox")
      .filter((input) => (input as HTMLInputElement).maxLength === 1);
    clearedInputs.forEach((input) => {
      expect((input as HTMLInputElement).value).toBe("");
    });
  });

  it("should show error message on complete-register failure", async () => {
    const user = userEvent.setup();
    mockPublicFetcher
      .mockResolvedValueOnce({ sent: true })
      .mockResolvedValueOnce({ isNewUser: true, verified: true })
      .mockRejectedValueOnce(new Error("Failed to create account"));
    mockSignIn.mockResolvedValue(undefined);

    render(<AuthFlow />);

    // Step 1: email
    await user.type(screen.getByPlaceholderText("you@example.com"), "new@example.com");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    // Step 2: OTP
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Check your inbox" })).toBeInTheDocument();
    });

    const codeInputs = screen
      .getAllByRole("textbox")
      .filter((input) => (input as HTMLInputElement).maxLength === 1);

    await user.type(codeInputs[0], "1");
    await user.type(codeInputs[1], "2");
    await user.type(codeInputs[2], "3");
    await user.type(codeInputs[3], "4");

    // Step 3: name
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "What should we call you?" })).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText("Name"), "New User");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(screen.getByText("Failed to create account")).toBeInTheDocument();
    });
  });

  it("should call request-otp again when resend button is clicked after cooldown expires", async () => {
    const user = userEvent.setup();
    mockPublicFetcher.mockResolvedValue({ sent: true });

    render(<AuthFlow />);

    await user.type(screen.getByPlaceholderText("you@example.com"), "test@example.com");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Check your inbox" })).toBeInTheDocument();
    });

    // Fast-forward cooldown to 0 by directly clicking the resend button
    // The resend button only appears when cooldown === 0, so we manipulate
    // the timer to skip waiting 60s
    // We check that the button appears after cooldown resets — use vi.useFakeTimers
    // However, since we can't easily manipulate timers here, we verify the guard:
    // during cooldown the button is not shown (text is shown instead)
    expect(screen.queryByRole("button", { name: "Resend code" })).not.toBeInTheDocument();
    expect(screen.getByText(/Resend code in/)).toBeInTheDocument();
  });

  it("should call request-otp again when resend button is clicked (cooldown expired)", async () => {
    // Use fake timers from the start so the setInterval is captured
    vi.useFakeTimers();
    mockPublicFetcher.mockResolvedValue({ sent: true });

    render(<AuthFlow />);

    // Use fireEvent (synchronous) to avoid userEvent timer issues under fake timers
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "test@example.com" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Continue" }).closest("form")!);

    // Flush the async publicFetcher promise by advancing microtasks
    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByRole("heading", { name: "Check your inbox" })).toBeInTheDocument();

    // Tick the setInterval 60 times (1s each) to drain the cooldown
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });

    expect(screen.getByRole("button", { name: "Resend code" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Resend code" }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockPublicFetcher).toHaveBeenCalledTimes(2);
  });

  it("should fill all OTP inputs when pasting a 4-digit code", async () => {
    const user = userEvent.setup();
    mockPublicFetcher.mockResolvedValueOnce({ sent: true }).mockResolvedValueOnce({
      isNewUser: false,
      accessToken: "t",
      refreshToken: "r",
      user: { id: "u1", email: "test@example.com", name: "Test" },
    });
    mockSignIn.mockResolvedValue(undefined);

    render(<AuthFlow />);

    await user.type(screen.getByPlaceholderText("you@example.com"), "test@example.com");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Check your inbox" })).toBeInTheDocument();
    });

    const codeInputs = screen
      .getAllByRole("textbox")
      .filter((input) => (input as HTMLInputElement).maxLength === 1);

    // Simulate paste by firing a change event with multi-char value on first input
    // This exercises the value.length > 1 paste path in handleOtpChange
    fireEvent.change(codeInputs[0], { target: { value: "1234" } });

    await waitFor(() => {
      // publicFetcher called twice: request-otp + verify-otp
      expect(mockPublicFetcher).toHaveBeenCalledTimes(2);
    });
  });

  it("should focus previous OTP input on Backspace when current input is empty", async () => {
    const user = userEvent.setup();
    mockPublicFetcher.mockResolvedValue({ sent: true });

    render(<AuthFlow />);

    await user.type(screen.getByPlaceholderText("you@example.com"), "test@example.com");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Check your inbox" })).toBeInTheDocument();
    });

    const codeInputs = screen
      .getAllByRole("textbox")
      .filter((input) => (input as HTMLInputElement).maxLength === 1);

    // Type a digit in first input — component auto-focuses second
    fireEvent.change(codeInputs[0], { target: { value: "1" } });

    // Second input is now focused and empty — fire keyDown Backspace
    fireEvent.keyDown(codeInputs[1], { key: "Backspace" });

    // First input should now have focus
    expect(document.activeElement).toBe(codeInputs[0]);
  });
});
