// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";

const { mockPost, mockSetToken } = vi.hoisted(() => ({
  mockPost: vi.fn(),
  mockSetToken: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  api: {
    post: mockPost,
    setToken: mockSetToken,
  },
}));

// Import after mock
import { useAuthStore } from "./auth-store";

describe("useAuthStore", () => {
  const storage: Record<string, string> = {};

  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(storage).forEach((k) => delete storage[k]);

    vi.stubGlobal("localStorage", {
      getItem: (key: string) => storage[key] ?? null,
      setItem: (key: string, value: string) => {
        storage[key] = value;
      },
      removeItem: (key: string) => {
        delete storage[key];
      },
      clear: () => {
        Object.keys(storage).forEach((k) => delete storage[k]);
      },
    });

    useAuthStore.setState({
      user: null,
      accessToken: null,
      isAuthenticated: false,
    });
  });

  describe("login", () => {
    it("should set user and tokens on successful login", async () => {
      mockPost.mockResolvedValue({
        accessToken: "access-123",
        refreshToken: "refresh-123",
        user: { id: "u-1", email: "john@test.com", name: "John" },
      });

      await useAuthStore.getState().login("john@test.com", "password");

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user?.email).toBe("john@test.com");
      expect(state.accessToken).toBe("access-123");
      expect(localStorage.getItem("accessToken")).toBe("access-123");
      expect(mockSetToken).toHaveBeenCalledWith("access-123");
    });
  });

  describe("register", () => {
    it("should set user and tokens on successful registration", async () => {
      mockPost.mockResolvedValue({
        accessToken: "access-456",
        refreshToken: "refresh-456",
        user: { id: "u-2", email: "jane@test.com", name: "Jane" },
      });

      await useAuthStore.getState().register("Jane", "jane@test.com", "password");

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user?.name).toBe("Jane");
    });
  });

  describe("logout", () => {
    it("should clear state and localStorage", () => {
      useAuthStore.setState({
        user: { id: "u-1", email: "john@test.com", name: "John" },
        accessToken: "token",
        isAuthenticated: true,
      });
      localStorage.setItem("accessToken", "token");

      useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(localStorage.getItem("accessToken")).toBeNull();
      expect(mockSetToken).toHaveBeenCalledWith(null);
    });
  });

  describe("hydrate", () => {
    it("should restore state from localStorage", () => {
      localStorage.setItem("accessToken", "stored-token");
      localStorage.setItem("user", JSON.stringify({ id: "u-1", email: "a@b.com", name: "A" }));

      useAuthStore.getState().hydrate();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.accessToken).toBe("stored-token");
    });

    it("should not authenticate if no stored token", () => {
      useAuthStore.getState().hydrate();

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });
});
