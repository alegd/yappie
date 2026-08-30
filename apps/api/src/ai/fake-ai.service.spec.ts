import { FakeAIService } from "./fake-ai.service.js";

describe("FakeAIService", () => {
  const svc = new FakeAIService();

  it("transcribe returns deterministic text and duration", async () => {
    const r = await svc.transcribe(Buffer.from(""), "x.wav");
    expect(r.text).toContain("login");
    expect(r.duration).toBe(5);
  });

  it("decompose returns a non-empty deterministic task list", async () => {
    const tasks = await svc.decompose("anything");
    expect(tasks.length).toBeGreaterThan(0);
    expect(tasks[0].title).toBe("Add login button");
  });

  it("generateTickets maps tasks to tickets with a valid priority", async () => {
    const tickets = await svc.generateTickets([{ title: "T", description: "D" }]);
    expect(tickets[0]).toMatchObject({ title: "T", description: "D", priority: "MEDIUM" });
  });
});
