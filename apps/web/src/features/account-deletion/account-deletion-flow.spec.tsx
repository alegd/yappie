import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AccountDeletionFlow } from "./account-deletion-flow";

const { mockPublicFetcher } = vi.hoisted(() => ({
  mockPublicFetcher: vi.fn(),
}));

vi.mock("@/lib/public-fetcher", () => ({
  publicFetcher: mockPublicFetcher,
}));

describe("AccountDeletionFlow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("step: request OTP", () => {
    it("should render an email input when mode is 'public'", () => {
      render(<AccountDeletionFlow mode="public" />);

      expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /send verification code/i }),
      ).toBeInTheDocument();
    });

    it("should display the initialEmail read-only when mode is 'authenticated'", () => {
      render(<AccountDeletionFlow mode="authenticated" initialEmail="alice@example.com" />);

      expect(screen.getByText("alice@example.com")).toBeInTheDocument();
      expect(screen.queryByPlaceholderText(/email/i)).not.toBeInTheDocument();
    });

    it("should call publicFetcher with the email when the send button is clicked", async () => {
      const user = userEvent.setup();
      mockPublicFetcher.mockResolvedValue({ requested: true });

      render(<AccountDeletionFlow mode="public" />);

      await user.type(screen.getByPlaceholderText(/email/i), "alice@example.com");
      await user.click(screen.getByRole("button", { name: /send verification code/i }));

      await waitFor(() => {
        expect(mockPublicFetcher).toHaveBeenCalledWith(
          "/v1/auth/account/delete/request",
          { data: { email: "alice@example.com" } },
        );
      });
    });

    it("should show an inline error when the request fails", async () => {
      const user = userEvent.setup();
      mockPublicFetcher.mockRejectedValue(new Error("Too many requests"));

      render(<AccountDeletionFlow mode="public" />);

      await user.type(screen.getByPlaceholderText(/email/i), "alice@example.com");
      await user.click(screen.getByRole("button", { name: /send verification code/i }));

      await waitFor(() => {
        expect(screen.getByText("Too many requests")).toBeInTheDocument();
      });
    });

    it("should transition to the confirm step after a successful request", async () => {
      const user = userEvent.setup();
      mockPublicFetcher.mockResolvedValue({ requested: true });

      render(<AccountDeletionFlow mode="public" />);

      await user.type(screen.getByPlaceholderText(/email/i), "alice@example.com");
      await user.click(screen.getByRole("button", { name: /send verification code/i }));

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /delete my account/i }),
        ).toBeInTheDocument();
      });
    });
  });

  describe("step: confirm deletion", () => {
    async function advanceToConfirmStep(mode: "authenticated" | "public" = "public") {
      const user = userEvent.setup();
      mockPublicFetcher.mockResolvedValueOnce({ requested: true });

      render(
        <AccountDeletionFlow
          mode={mode}
          initialEmail={mode === "authenticated" ? "alice@example.com" : undefined}
        />,
      );

      if (mode === "public") {
        await user.type(screen.getByPlaceholderText(/email/i), "alice@example.com");
      }
      await user.click(screen.getByRole("button", { name: /send verification code/i }));

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /delete my account/i }),
        ).toBeInTheDocument();
      });

      return user;
    }

    it("should keep the Delete button disabled until both OTP and DELETE phrase are entered", async () => {
      const user = await advanceToConfirmStep();

      const deleteButton = screen.getByRole("button", { name: /delete my account/i });
      expect(deleteButton).toBeDisabled();

      // OTP filled, phrase missing — still disabled
      const otpInputs = screen.getAllByRole("textbox", { name: /digit/i });
      for (let i = 0; i < 4; i++) {
        await user.type(otpInputs[i], String(i + 1));
      }
      expect(deleteButton).toBeDisabled();

      // Phrase filled too — now enabled
      await user.type(screen.getByPlaceholderText(/type delete/i), "DELETE");
      expect(deleteButton).toBeEnabled();
    });

    it("should call publicFetcher /confirm with email + code when Delete is clicked", async () => {
      const user = await advanceToConfirmStep();
      mockPublicFetcher.mockResolvedValueOnce({ deleted: true });

      const otpInputs = screen.getAllByRole("textbox", { name: /digit/i });
      await user.type(otpInputs[0], "1");
      await user.type(otpInputs[1], "2");
      await user.type(otpInputs[2], "3");
      await user.type(otpInputs[3], "4");
      await user.type(screen.getByPlaceholderText(/type delete/i), "DELETE");

      await user.click(screen.getByRole("button", { name: /delete my account/i }));

      await waitFor(() => {
        expect(mockPublicFetcher).toHaveBeenCalledWith(
          "/v1/auth/account/delete/confirm",
          { data: { email: "alice@example.com", code: "1234" } },
        );
      });
    });

    it("should show a success screen after a successful delete in public mode", async () => {
      const user = await advanceToConfirmStep("public");
      mockPublicFetcher.mockResolvedValueOnce({ deleted: true });

      const otpInputs = screen.getAllByRole("textbox", { name: /digit/i });
      for (let i = 0; i < 4; i++) {
        await user.type(otpInputs[i], String(i + 1));
      }
      await user.type(screen.getByPlaceholderText(/type delete/i), "DELETE");
      await user.click(screen.getByRole("button", { name: /delete my account/i }));

      await waitFor(() => {
        expect(screen.getByText(/account has been deleted/i)).toBeInTheDocument();
      });
    });

    it("should invoke onDeleted callback after a successful delete in authenticated mode", async () => {
      const onDeleted = vi.fn();
      const user = userEvent.setup();
      mockPublicFetcher
        .mockResolvedValueOnce({ requested: true })
        .mockResolvedValueOnce({ deleted: true });

      render(
        <AccountDeletionFlow
          mode="authenticated"
          initialEmail="alice@example.com"
          onDeleted={onDeleted}
        />,
      );

      await user.click(screen.getByRole("button", { name: /send verification code/i }));
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /delete my account/i })).toBeInTheDocument();
      });

      const otpInputs = screen.getAllByRole("textbox", { name: /digit/i });
      for (let i = 0; i < 4; i++) {
        await user.type(otpInputs[i], String(i + 1));
      }
      await user.type(screen.getByPlaceholderText(/type delete/i), "DELETE");
      await user.click(screen.getByRole("button", { name: /delete my account/i }));

      await waitFor(() => {
        expect(onDeleted).toHaveBeenCalled();
      });
    });

    it("should show an inline error when the confirm call fails", async () => {
      const user = await advanceToConfirmStep();
      mockPublicFetcher.mockRejectedValueOnce(new Error("Invalid or expired code"));

      const otpInputs = screen.getAllByRole("textbox", { name: /digit/i });
      for (let i = 0; i < 4; i++) {
        await user.type(otpInputs[i], String(i + 1));
      }
      await user.type(screen.getByPlaceholderText(/type delete/i), "DELETE");
      await user.click(screen.getByRole("button", { name: /delete my account/i }));

      await waitFor(() => {
        expect(screen.getByText("Invalid or expired code")).toBeInTheDocument();
      });
    });
  });
});
