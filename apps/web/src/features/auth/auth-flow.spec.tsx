import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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
  });

  it("should render email step by default", () => {
    render(<AuthFlow />);

    expect(screen.getByRole("heading", { name: "Sign in to Yappie" })).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeInTheDocument();
  });

  it("should show error on failed OTP request", async () => {
    const user = userEvent.setup();
    mockPublicFetcher.mockRejectedValue(new Error("Too many requests"));

    render(<AuthFlow />);

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => {
      expect(screen.getByText("Too many requests")).toBeInTheDocument();
    });
  });

  it("should advance to OTP step after successful request", async () => {
    const user = userEvent.setup();
    mockPublicFetcher.mockResolvedValue({ sent: true });

    render(<AuthFlow />);

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Enter your code" })).toBeInTheDocument();
    });

    expect(screen.getByText("Check test@example.com")).toBeInTheDocument();
  });

  it("should show 'Resend code' text on OTP step during cooldown", async () => {
    const user = userEvent.setup();
    mockPublicFetcher.mockResolvedValue({ sent: true });

    render(<AuthFlow />);

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Enter your code" })).toBeInTheDocument();
    });

    // During cooldown, resend text with timer is visible
    expect(screen.getByText(/Resend code in/)).toBeInTheDocument();
  });

  it("should show back button on OTP step", async () => {
    const user = userEvent.setup();
    mockPublicFetcher.mockResolvedValue({ sent: true });

    render(<AuthFlow />);

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument();
    });
  });

  it("should go back to email step when back button is clicked on OTP step", async () => {
    const user = userEvent.setup();
    mockPublicFetcher.mockResolvedValue({ sent: true });

    render(<AuthFlow />);

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Enter your code" })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Back" }));

    expect(screen.getByRole("heading", { name: "Sign in to Yappie" })).toBeInTheDocument();
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

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Enter your code" })).toBeInTheDocument();
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

    await user.type(screen.getByLabelText("Email"), "new@example.com");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Enter your code" })).toBeInTheDocument();
    });

    const codeInputs = screen
      .getAllByRole("textbox")
      .filter((input) => (input as HTMLInputElement).maxLength === 1);

    await user.type(codeInputs[0], "5");
    await user.type(codeInputs[1], "6");
    await user.type(codeInputs[2], "7");
    await user.type(codeInputs[3], "8");

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Almost there!" })).toBeInTheDocument();
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
    await user.type(screen.getByLabelText("Email"), "new@example.com");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    // Step 2: OTP
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Enter your code" })).toBeInTheDocument();
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
      expect(screen.getByRole("heading", { name: "Almost there!" })).toBeInTheDocument();
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

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByRole("button", { name: "Sending..." })).toBeInTheDocument();
  });
});
