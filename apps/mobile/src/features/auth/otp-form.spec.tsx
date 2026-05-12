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
jest.mock("@/lib/api", () => ({ apiFetch: jest.fn() }));

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  navigate: jest.fn(),
};
jest.mock("expo-router", () => ({
  router: mockRouter,
  useRouter: () => mockRouter,
}));

import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const api = require("@/lib/api") as typeof import("@/lib/api");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { useAuthStore } = require("./auth-store") as typeof import("./auth-store");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ApiError } = require("@/lib/api-error") as typeof import("@/lib/api-error");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { OtpForm } = require("./otp-form") as typeof import("./otp-form");

const apiFetchMock = api.apiFetch as jest.Mock;

function renderForm(email = "user@example.com") {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <OtpForm email={email} />
    </QueryClientProvider>,
  );
}

describe("OtpForm", () => {
  beforeEach(() => {
    mockStorage.clear();
    apiFetchMock.mockReset();
    mockRouter.replace.mockReset();
    useAuthStore.setState({ accessToken: null, user: null, hydrated: false });
  });

  it("shows inline error when OTP is wrong (401)", async () => {
    apiFetchMock.mockRejectedValueOnce(new ApiError(401, { message: "bad code" }, "bad code"));
    const { getByPlaceholderText, getByText, findByText } = renderForm();
    fireEvent.changeText(getByPlaceholderText("1234"), "9999");
    fireEvent.press(getByText("Verify"));
    expect(await findByText(/incorrect or expired/i)).toBeTruthy();
  });

  it("on 200 routes to (tabs)", async () => {
    apiFetchMock.mockResolvedValueOnce({
      accessToken: "at",
      refreshToken: "rt",
      user: { id: "u1", email: "user@example.com", name: "User" },
    });
    const { getByPlaceholderText, getByText } = renderForm();
    fireEvent.changeText(getByPlaceholderText("1234"), "1234");
    fireEvent.press(getByText("Verify"));

    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/(tabs)"));
  });

  it("on 404 reveals name field and switches button to 'Create account'", async () => {
    apiFetchMock.mockRejectedValueOnce(
      new ApiError(404, { message: "not found" }, "not found"),
    );
    const { getByPlaceholderText, getByText, findByPlaceholderText, findByText } = renderForm();
    fireEvent.changeText(getByPlaceholderText("1234"), "1234");
    fireEvent.press(getByText("Verify"));

    expect(await findByPlaceholderText("Your name")).toBeTruthy();
    expect(await findByText("Create account")).toBeTruthy();
  });

  it("after 404, submitting with name calls complete-register", async () => {
    apiFetchMock
      .mockRejectedValueOnce(new ApiError(404, { message: "not found" }, "not found"))
      .mockResolvedValueOnce({
        accessToken: "at",
        refreshToken: "rt",
        user: { id: "u2", email: "new@example.com", name: "New" },
      });

    const { getByPlaceholderText, getByText, findByPlaceholderText, findByText } =
      renderForm("new@example.com");
    fireEvent.changeText(getByPlaceholderText("1234"), "1234");
    fireEvent.press(getByText("Verify"));

    const nameInput = await findByPlaceholderText("Your name");
    fireEvent.changeText(nameInput, "New User");
    fireEvent.press(await findByText("Create account"));

    await waitFor(() =>
      expect(apiFetchMock).toHaveBeenCalledWith(
        "/auth/complete-register",
        expect.objectContaining({ method: "POST" }),
      ),
    );
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/(tabs)"));
  });
});
