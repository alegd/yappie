import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockAuth, mockApiFetcher, mockRedirect } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockApiFetcher: vi.fn(),
  mockRedirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

vi.mock("@/config/auth.config", () => ({ auth: mockAuth }));
vi.mock("@/lib/api-fetcher", () => ({ apiFetcher: mockApiFetcher }));
vi.mock("next/navigation", () => ({ redirect: mockRedirect }));

const Page = (await import("./page")).default;

describe("Legacy /dashboard/tickets/[id] redirect page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to /auth when there is no session", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(Page({ params: Promise.resolve({ id: "t-1" }) })).rejects.toThrow(
      "NEXT_REDIRECT:/auth",
    );
  });

  it("redirects to /dashboard when apiFetcher throws", async () => {
    mockAuth.mockResolvedValue({ accessToken: "jwt" });
    mockApiFetcher.mockRejectedValue(new Error("not found"));
    await expect(Page({ params: Promise.resolve({ id: "t-1" }) })).rejects.toThrow(
      "NEXT_REDIRECT:/dashboard",
    );
  });

  it("redirects to /dashboard when the ticket has no audioRecording.projectId", async () => {
    mockAuth.mockResolvedValue({ accessToken: "jwt" });
    mockApiFetcher.mockResolvedValue({ id: "t-1", audioRecording: null });
    await expect(Page({ params: Promise.resolve({ id: "t-1" }) })).rejects.toThrow(
      "NEXT_REDIRECT:/dashboard",
    );
  });

  it("redirects to the project view with ?ticket= for a valid ticket", async () => {
    mockAuth.mockResolvedValue({ accessToken: "jwt" });
    mockApiFetcher.mockResolvedValue({
      id: "t-1",
      audioRecording: { id: "a-1", fileName: "rec.webm", projectId: "p-1" },
    });
    await expect(Page({ params: Promise.resolve({ id: "t-1" }) })).rejects.toThrow(
      "NEXT_REDIRECT:/dashboard/projects/p-1?ticket=t-1",
    );
  });
});
