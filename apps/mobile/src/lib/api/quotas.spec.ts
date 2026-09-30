/* eslint-disable @typescript-eslint/no-require-imports */
jest.mock("./client", () => ({
  apiFetch: jest.fn(),
}));

const client = require("./client") as typeof import("./client");
const quotas = require("./quotas") as typeof import("./quotas");

const apiFetchMock = client.apiFetch as jest.Mock;

describe("quotas API", () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
  });

  it("getQuota calls GET /quotas", async () => {
    apiFetchMock.mockResolvedValueOnce({ plan: "FREE", limitMinutes: 20, usedMinutes: 5 });
    await quotas.getQuota();
    expect(apiFetchMock).toHaveBeenCalledWith("/quotas");
  });
});
