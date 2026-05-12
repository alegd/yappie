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

import { render, waitFor } from "@testing-library/react-native";
import { Text } from "react-native";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const tokenStorage = require("@/lib/secure-store") as typeof import("@/lib/secure-store");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { AuthGate } = require("./auth-gate") as typeof import("./auth-gate");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { useAuthStore } = require("./auth-store") as typeof import("./auth-store");

function Child() {
  return <Text>children rendered</Text>;
}

describe("AuthGate", () => {
  beforeEach(() => {
    mockStorage.clear();
    useAuthStore.setState({ accessToken: null, user: null, hydrated: false });
  });

  it("hydrates from SecureStore on mount and renders children once hydrated", async () => {
    await tokenStorage.setAccessToken("persisted");
    const { findByText } = render(
      <AuthGate>
        <Child />
      </AuthGate>,
    );
    await findByText("children rendered");
    expect(useAuthStore.getState().hydrated).toBe(true);
    expect(useAuthStore.getState().accessToken).toBe("persisted");
  });

  it("renders children when no token exists (children handle redirect)", async () => {
    const { findByText } = render(
      <AuthGate>
        <Child />
      </AuthGate>,
    );
    await findByText("children rendered");
    expect(useAuthStore.getState().hydrated).toBe(true);
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it("does not render children before hydration completes", async () => {
    const { queryByText } = render(
      <AuthGate>
        <Child />
      </AuthGate>,
    );
    expect(queryByText("children rendered")).toBeNull();
    await waitFor(() => expect(useAuthStore.getState().hydrated).toBe(true));
  });
});
