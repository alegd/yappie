import React from "react";

const mockStorage = new Map<string, string>();

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(async (key: string) => mockStorage.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockStorage.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    mockStorage.delete(key);
  }),
}));

jest.mock("@/lib/env", () => ({ env: { apiUrl: "https://api.test" } }));

jest.mock("@/lib/api/client", () => ({
  apiFetch: jest.fn(),
}));

import { renderHook, act } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const api = require("@/lib/api/client") as typeof import("@/lib/api/client");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { useAuthStore } = require("./auth-store") as typeof import("./auth-store");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { useAuth } = require("./use-auth") as typeof import("./use-auth");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ApiError } = require("@/lib/api-error") as typeof import("@/lib/api-error");

const apiFetchMock = api.apiFetch as jest.Mock;

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useAuth", () => {
  beforeEach(() => {
    mockStorage.clear();
    apiFetchMock.mockReset();
    useAuthStore.setState({ accessToken: null, user: null, hydrated: false });
  });

  it("requestOtp calls POST /auth/request-otp with email", async () => {
    apiFetchMock.mockResolvedValueOnce({});
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.requestOtp.mutateAsync("user@example.com");
    });

    expect(apiFetchMock).toHaveBeenCalledWith("/auth/request-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "user@example.com" }),
    });
  });

  it("verifyOtp on success stores tokens and user via auth store", async () => {
    apiFetchMock.mockResolvedValueOnce({
      accessToken: "at",
      refreshToken: "rt",
      user: { id: "u1", email: "user@example.com", name: "User" },
    });
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.verifyOtp.mutateAsync({
        email: "user@example.com",
        code: "123456",
      });
    });

    expect(useAuthStore.getState().accessToken).toBe("at");
    expect(useAuthStore.getState().user?.id).toBe("u1");
  });

  it("verifyOtp on 404 throws without storing tokens (signal to register)", async () => {
    apiFetchMock.mockRejectedValueOnce(
      new ApiError(404, { message: "User not found" }, "Not found"),
    );
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await expect(
        result.current.verifyOtp.mutateAsync({
          email: "new@example.com",
          code: "123456",
        }),
      ).rejects.toMatchObject({ status: 404 });
    });

    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it("completeRegister calls POST /auth/complete-register and stores tokens", async () => {
    apiFetchMock.mockResolvedValueOnce({
      accessToken: "at2",
      refreshToken: "rt2",
      user: { id: "u2", email: "new@example.com", name: "New User" },
    });
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.completeRegister.mutateAsync({
        email: "new@example.com",
        code: "123456",
        name: "New User",
      });
    });

    expect(apiFetchMock).toHaveBeenCalledWith(
      "/auth/complete-register",
      expect.objectContaining({ method: "POST" }),
    );
    expect(useAuthStore.getState().accessToken).toBe("at2");
  });

  it("logout posts to /auth/logout with refresh token and clears auth store", async () => {
    await useAuthStore.getState().login(
      { accessToken: "at", refreshToken: "rt" },
      { id: "u1", email: "x@y.com", name: "x" },
    );

    apiFetchMock.mockResolvedValueOnce({});
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.logout.mutateAsync();
    });

    expect(apiFetchMock).toHaveBeenCalledWith(
      "/auth/logout",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ refreshToken: "rt" }),
      }),
    );
    expect(useAuthStore.getState().accessToken).toBeNull();
  });
});
