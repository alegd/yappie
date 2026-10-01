import { beforeEach, describe, expect, it, vi } from "vitest";

const mockToastError = vi.fn();

vi.mock("@/components/ui/toast/Toast", () => ({
  toast: { error: (message: string) => mockToastError(message) },
}));

const { showError } = await import("./error");

describe("showError", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("bullets each line when the message carries several validation errors", () => {
    showError("email must be an email\npassword too short");

    expect(mockToastError).toHaveBeenCalledWith("• email must be an email\n• password too short");
  });

  it("leaves a single-line message unbulleted", () => {
    showError("Not Found");

    expect(mockToastError).toHaveBeenCalledWith("Not Found");
  });

  it("bullets each line of a multi-line Error message", () => {
    showError(new Error("email must be an email\npassword too short"));

    expect(mockToastError).toHaveBeenCalledWith("• email must be an email\n• password too short");
  });

  it("falls back to a generic message for a non-string, non-Error value", () => {
    showError({ unexpected: true });

    expect(mockToastError).toHaveBeenCalledWith("An unexpected error occurred");
  });
});
