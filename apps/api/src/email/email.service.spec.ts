import { beforeEach, describe, expect, it, vi } from "vitest";
import { EmailService } from "./email.service.js";

const mockSend = vi.fn();

vi.mock("resend", () => ({
  Resend: vi.fn(function () {
    this.emails = { send: mockSend };
  }),
}));

describe("EmailService", () => {
  let service: EmailService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSend.mockResolvedValue({ data: { id: "email-1" } });
    service = new EmailService("re_test_key", "Yappie <noreply@test.com>");
  });

  it("should send OTP email with correct params", async () => {
    await service.sendOtp("user@example.com", "1234");

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "user@example.com",
        subject: "Your Yappie code: 1234",
      }),
    );
  });

  it("should use Yappie as sender name", async () => {
    await service.sendOtp("user@example.com", "5678");

    const call = mockSend.mock.calls[0][0];
    expect(call.from).toContain("Yappie");
  });

  it("should throw when Resend returns an error in the response", async () => {
    mockSend.mockResolvedValue({
      data: null,
      error: { message: "Invalid API key", name: "validation_error" },
    });

    await expect(service.sendOtp("user@example.com", "1234")).rejects.toThrow(/invalid api key/i);
  });

  it("should throw when the Resend call itself rejects", async () => {
    mockSend.mockRejectedValue(new Error("Network down"));

    await expect(service.sendOtp("user@example.com", "1234")).rejects.toThrow("Network down");
  });
});
