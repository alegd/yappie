jest.mock("./client", () => ({
  apiFetch: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const client = require("./client") as typeof import("./client");
// eslint-disable-next-line @typescript-eslint/no-require-imports
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
