jest.mock("./client", () => ({
  apiFetch: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const client = require("./client") as typeof import("./client");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const account = require("./account") as typeof import("./account");

const apiFetchMock = client.apiFetch as jest.Mock;

describe("account API", () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
  });

  describe("deleteAccountRequest", () => {
    it("calls POST /auth/account/delete/request with the email", async () => {
      apiFetchMock.mockResolvedValueOnce({ requested: true });

      await account.deleteAccountRequest("user@example.com");

      expect(apiFetchMock).toHaveBeenCalledWith("/auth/account/delete/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "user@example.com" }),
      });
    });
  });

  describe("deleteAccountConfirm", () => {
    it("calls POST /auth/account/delete/confirm with email and code", async () => {
      apiFetchMock.mockResolvedValueOnce({ deleted: true });

      await account.deleteAccountConfirm("user@example.com", "1234");

      expect(apiFetchMock).toHaveBeenCalledWith("/auth/account/delete/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "user@example.com", code: "1234" }),
      });
    });
  });
});
