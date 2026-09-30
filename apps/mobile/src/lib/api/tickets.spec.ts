/* eslint-disable @typescript-eslint/no-require-imports */
jest.mock("./client", () => ({
  apiFetch: jest.fn(),
}));

const client = require("./client") as typeof import("./client");
const tickets = require("./tickets") as typeof import("./tickets");

const apiFetchMock = client.apiFetch as jest.Mock;

describe("tickets API", () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
  });

  it("updateTicket calls PATCH /tickets/:id with json body", async () => {
    apiFetchMock.mockResolvedValueOnce({ id: "t1" });
    await tickets.updateTicket("t1", { title: "New title", priority: "HIGH" });
    expect(apiFetchMock).toHaveBeenCalledWith("/tickets/t1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New title", priority: "HIGH" }),
    });
  });

  it("deleteTicket calls DELETE /tickets/:id", async () => {
    apiFetchMock.mockResolvedValueOnce(undefined);
    await tickets.deleteTicket("t1");
    expect(apiFetchMock).toHaveBeenCalledWith("/tickets/t1", { method: "DELETE" });
  });
});
