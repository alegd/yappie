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
jest.mock("@/lib/api/client", () => ({ apiFetch: jest.fn() }));

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
const api = require("@/lib/api/client") as typeof import("@/lib/api/client");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { EmailForm } = require("./email-form") as typeof import("./email-form");

const apiFetchMock = api.apiFetch as jest.Mock;

function renderForm() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <EmailForm />
    </QueryClientProvider>,
  );
}

describe("EmailForm", () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
    mockRouter.push.mockReset();
  });

  it("renders the 'What's your email?' heading and Continue button", () => {
    const { getByText } = renderForm();
    expect(getByText(/what's your email\?/i)).toBeTruthy();
    expect(getByText("Continue")).toBeTruthy();
  });

  it("shows error when submitting an invalid email", async () => {
    const { getByText, getByPlaceholderText, findByText } = renderForm();
    fireEvent.changeText(getByPlaceholderText("you@example.com"), "not-an-email");
    fireEvent.press(getByText("Continue"));
    expect(await findByText(/valid email/i)).toBeTruthy();
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it("calls request-otp and navigates to /verify on success", async () => {
    apiFetchMock.mockResolvedValueOnce({});
    const { getByText, getByPlaceholderText } = renderForm();
    fireEvent.changeText(getByPlaceholderText("you@example.com"), "user@example.com");
    fireEvent.press(getByText("Continue"));

    await waitFor(() => {
      expect(apiFetchMock).toHaveBeenCalledWith(
        "/auth/request-otp",
        expect.objectContaining({ method: "POST" }),
      );
    });
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith({
        pathname: "/verify",
        params: { email: "user@example.com" },
      });
    });
  });

  it("shows throttled message on 429", async () => {
    apiFetchMock.mockRejectedValueOnce(Object.assign(new Error("Too many"), { status: 429 }));
    const { getByText, getByPlaceholderText, findByText } = renderForm();
    fireEvent.changeText(getByPlaceholderText("you@example.com"), "user@example.com");
    fireEvent.press(getByText("Continue"));
    expect(await findByText(/wait a minute/i)).toBeTruthy();
  });
});
