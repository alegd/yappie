import { queryKeys } from "./query-keys";

describe("queryKeys", () => {
  it("returns stable keys for top-level resources", () => {
    expect(queryKeys.projects).toEqual(["projects"]);
    expect(queryKeys.recentAudios).toEqual(["audios", "recent"]);
    expect(queryKeys.quota).toEqual(["quotas"]);
    expect(queryKeys.jiraStatus).toEqual(["jira", "status"]);
  });

  it("builds parameterized keys", () => {
    expect(queryKeys.project("p1")).toEqual(["projects", "p1"]);
    expect(queryKeys.audio("a1")).toEqual(["audios", "a1"]);
    expect(queryKeys.projectAudios("p1")).toEqual(["audios", { projectId: "p1" }]);
  });

  it("returns distinct keys for distinct ids", () => {
    expect(queryKeys.project("p1")).not.toEqual(queryKeys.project("p2"));
    expect(queryKeys.audio("a1")).not.toEqual(queryKeys.audio("a2"));
  });
});
