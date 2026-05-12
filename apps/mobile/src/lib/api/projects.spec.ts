jest.mock("./client", () => ({
  apiFetch: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const client = require("./client") as typeof import("./client");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const projects = require("./projects") as typeof import("./projects");

const apiFetchMock = client.apiFetch as jest.Mock;

describe("projects API", () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
  });

  describe("listProjects", () => {
    it("calls GET /projects with default page and limit", async () => {
      apiFetchMock.mockResolvedValueOnce({ data: [], total: 0, page: 1, limit: 50 });
      await projects.listProjects();
      expect(apiFetchMock).toHaveBeenCalledWith("/projects?page=1&limit=50");
    });

    it("respects custom page and limit", async () => {
      apiFetchMock.mockResolvedValueOnce({ data: [], total: 0, page: 2, limit: 10 });
      await projects.listProjects(2, 10);
      expect(apiFetchMock).toHaveBeenCalledWith("/projects?page=2&limit=10");
    });
  });

  describe("getProject", () => {
    it("calls GET /projects/:id", async () => {
      apiFetchMock.mockResolvedValueOnce({ id: "p1" });
      await projects.getProject("p1");
      expect(apiFetchMock).toHaveBeenCalledWith("/projects/p1");
    });
  });

  describe("createProject", () => {
    it("calls POST /projects with json body", async () => {
      apiFetchMock.mockResolvedValueOnce({ id: "p1" });
      await projects.createProject({ name: "New", description: "Desc" });
      expect(apiFetchMock).toHaveBeenCalledWith("/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "New", description: "Desc" }),
      });
    });
  });

  describe("updateProject", () => {
    it("calls PATCH /projects/:id with json body", async () => {
      apiFetchMock.mockResolvedValueOnce({ id: "p1" });
      await projects.updateProject("p1", { name: "Renamed" });
      expect(apiFetchMock).toHaveBeenCalledWith("/projects/p1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Renamed" }),
      });
    });
  });
});
