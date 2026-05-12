jest.mock("./client", () => ({
  apiFetch: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const client = require("./client") as typeof import("./client");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const audios = require("./audios") as typeof import("./audios");

const apiFetchMock = client.apiFetch as jest.Mock;

describe("audios API", () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
  });

  describe("listAudios", () => {
    it("filters by projectId and applies default paging", async () => {
      apiFetchMock.mockResolvedValueOnce({ data: [], total: 0, page: 1, limit: 20 });
      await audios.listAudios("p1");
      expect(apiFetchMock).toHaveBeenCalledWith("/audio?projectId=p1&page=1&limit=20");
    });

    it("accepts custom page and limit", async () => {
      apiFetchMock.mockResolvedValueOnce({ data: [], total: 0, page: 3, limit: 5 });
      await audios.listAudios("p1", 3, 5);
      expect(apiFetchMock).toHaveBeenCalledWith("/audio?projectId=p1&page=3&limit=5");
    });
  });

  describe("listRecentAudios", () => {
    it("requests recent audios with default limit", async () => {
      apiFetchMock.mockResolvedValueOnce({ data: [], total: 0, page: 1, limit: 10 });
      await audios.listRecentAudios();
      expect(apiFetchMock).toHaveBeenCalledWith("/audio?limit=10");
    });

    it("respects a custom limit", async () => {
      apiFetchMock.mockResolvedValueOnce({ data: [], total: 0, page: 1, limit: 25 });
      await audios.listRecentAudios(25);
      expect(apiFetchMock).toHaveBeenCalledWith("/audio?limit=25");
    });
  });

  describe("getAudio", () => {
    it("calls GET /audio/:id", async () => {
      apiFetchMock.mockResolvedValueOnce({ id: "a1", tickets: [] });
      await audios.getAudio("a1");
      expect(apiFetchMock).toHaveBeenCalledWith("/audio/a1");
    });
  });

  describe("uploadAudio", () => {
    it("posts FormData to /audio/upload without Content-Type", async () => {
      apiFetchMock.mockResolvedValueOnce({ id: "a1" });
      const form = new FormData();
      await audios.uploadAudio(form);
      expect(apiFetchMock).toHaveBeenCalledWith("/audio/upload", {
        method: "POST",
        body: form,
      });
    });

    it("appends projectId as a query param when provided", async () => {
      apiFetchMock.mockResolvedValueOnce({ id: "a1" });
      const form = new FormData();
      await audios.uploadAudio(form, "p1");
      expect(apiFetchMock).toHaveBeenCalledWith("/audio/upload?projectId=p1", {
        method: "POST",
        body: form,
      });
    });
  });

  describe("deleteAudio", () => {
    it("calls DELETE /audio/:id", async () => {
      apiFetchMock.mockResolvedValueOnce(undefined);
      await audios.deleteAudio("a1");
      expect(apiFetchMock).toHaveBeenCalledWith("/audio/a1", { method: "DELETE" });
    });
  });
});
