/* eslint-disable @typescript-eslint/no-require-imports */
import type { ReactNode } from "react";

const mockSocketInstance = {
  connected: false,
  on: jest.fn(),
  disconnect: jest.fn(),
};

const mockIo = jest.fn(() => mockSocketInstance);

jest.mock("socket.io-client", () => ({
  io: mockIo,
}));

const mockGetAccessToken = jest.fn();
jest.mock("@/lib/secure-store", () => ({
  getAccessToken: () => mockGetAccessToken(),
  getRefreshToken: jest.fn(),
  setAccessToken: jest.fn(),
  setRefreshToken: jest.fn(),
  clearTokens: jest.fn(),
}));

jest.mock("expo-router", () => {
  const { Text } = jest.requireActual("react-native");
  return {
    Redirect: ({ href }: { href: string }) => <Text>{`redirect:${href}`}</Text>,
    Stack: Object.assign(({ children }: { children?: ReactNode }) => <>{children}</>, {
      Screen: () => null,
    }),
  };
});

jest.mock("@sentry/react-native", () => ({
  captureException: jest.fn(),
}));

jest.mock("@/components/navigation/floating-record-button", () => ({
  FloatingRecordButton: () => null,
}));

jest.mock("@/components/navigation/floating-back-button", () => ({
  FloatingBackButton: () => null,
}));

jest.mock("@/components/ui/toast", () => ({
  ToastContainer: () => null,
}));

const { render, waitFor } =
  require("@testing-library/react-native") as typeof import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  require("@tanstack/react-query") as typeof import("@tanstack/react-query");
const { useAuthStore } =
  require("@/features/auth/auth-store") as typeof import("@/features/auth/auth-store");
const { disconnectSocket } = require("@/lib/socket") as typeof import("@/lib/socket");
const AppLayout = require("@/app/(app)/_layout").default as React.ComponentType;

function renderInsideRootProvider() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <AppLayout />
    </QueryClientProvider>,
  );
}

describe("authenticated app layout", () => {
  beforeEach(() => {
    mockIo.mockClear();
    mockGetAccessToken.mockReset();
    mockGetAccessToken.mockResolvedValue("token-abc");
    disconnectSocket();
    useAuthStore.setState({ accessToken: null, user: null, hydrated: true });
  });

  it("opens the realtime connection that the audio screens depend on", async () => {
    useAuthStore.setState({
      accessToken: "token-abc",
      user: { id: "u1", email: "a@b.com", name: "Ale" },
      hydrated: true,
    });

    renderInsideRootProvider();

    await waitFor(() => {
      expect(mockIo).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ auth: { token: "token-abc" } }),
      );
    });
  });
});
