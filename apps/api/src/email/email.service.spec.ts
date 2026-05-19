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

  describe("sendAccountDeletionOtp", () => {
    it("should send a deletion-specific OTP email with the code in the body", async () => {
      await service.sendAccountDeletionOtp("user@example.com", "1234");

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "user@example.com",
          subject: expect.stringMatching(/delet/i),
        }),
      );
      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain("1234");
    });

    it("should throw when Resend rejects", async () => {
      mockSend.mockRejectedValue(new Error("Network down"));

      await expect(
        service.sendAccountDeletionOtp("user@example.com", "1234"),
      ).rejects.toThrow("Network down");
    });
  });

  describe("sendAccountDeletionConfirmation", () => {
    it("should send a confirmation email after the account is deleted", async () => {
      await service.sendAccountDeletionConfirmation("user@example.com");

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "user@example.com",
          subject: expect.stringMatching(/delet/i),
        }),
      );
    });

    it("should include an Atlassian self-service revoke link when hadJira is true", async () => {
      await service.sendAccountDeletionConfirmation("user@example.com", { hadJira: true });

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain("id.atlassian.com/manage-profile/apps");
    });

    it("should NOT include the Atlassian link when hadJira is false or omitted", async () => {
      await service.sendAccountDeletionConfirmation("user@example.com");

      const call = mockSend.mock.calls[0][0];
      expect(call.html).not.toContain("id.atlassian.com/manage-profile/apps");
    });
  });
});
