import React from "react";

jest.mock("@/lib/api/account", () => ({
  deleteAccountRequest: jest.fn(),
  deleteAccountConfirm: jest.fn(),
}));

jest.mock("expo-router", () => ({
  router: { replace: jest.fn(), back: jest.fn() },
  useRouter: () => ({ replace: jest.fn(), back: jest.fn() }),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { render, fireEvent, waitFor } = require("@testing-library/react-native") as typeof import("@testing-library/react-native");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { QueryClient, QueryClientProvider } = require("@tanstack/react-query") as typeof import("@tanstack/react-query");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const accountApi = require("@/lib/api/account") as typeof import("@/lib/api/account");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { useAuthStore } = require("@/features/auth/auth-store") as typeof import("@/features/auth/auth-store");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { AccountDeletionScreen } = require("./account-deletion-screen") as typeof import("./account-deletion-screen");

const requestMock = accountApi.deleteAccountRequest as jest.Mock;
const confirmMock = accountApi.deleteAccountConfirm as jest.Mock;

function renderScreen() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <AccountDeletionScreen />
    </QueryClientProvider>,
  );
}

const TEST_EMAIL = "alice@example.com";

describe("AccountDeletionScreen", () => {
  beforeEach(() => {
    requestMock.mockReset();
    confirmMock.mockReset();
    useAuthStore.setState({
      accessToken: "test-token",
      user: { id: "user-1", email: TEST_EMAIL, name: "Alice" },
      hydrated: true,
    });
  });

  afterEach(() => {
    useAuthStore.setState({ accessToken: null, user: null, hydrated: false });
  });

  describe("step: request", () => {
    it("renders the user's email on the initial step", () => {
      const { getByText } = renderScreen();
      expect(getByText(TEST_EMAIL)).toBeTruthy();
    });

    it("calls deleteAccountRequest with the user's email when the send button is pressed", async () => {
      requestMock.mockResolvedValueOnce({ requested: true });
      const { getByText } = renderScreen();

      fireEvent.press(getByText(/send verification code/i));

      await waitFor(() => {
        expect(requestMock).toHaveBeenCalledWith(TEST_EMAIL);
      });
    });

    it("transitions to the confirm step after a successful request", async () => {
      requestMock.mockResolvedValueOnce({ requested: true });
      const { getByText, findByPlaceholderText } = renderScreen();

      fireEvent.press(getByText(/send verification code/i));

      const otpInput = await findByPlaceholderText(/1234/);
      expect(otpInput).toBeTruthy();
    });

    it("shows an inline error when the request fails", async () => {
      requestMock.mockRejectedValueOnce(new Error("Too many requests"));
      const { getByText, findByText } = renderScreen();

      fireEvent.press(getByText(/send verification code/i));

      const errorMessage = await findByText(/couldn.t send code/i);
      expect(errorMessage).toBeTruthy();
    });
  });

  describe("step: confirm", () => {
    async function advanceToConfirm() {
      requestMock.mockResolvedValueOnce({ requested: true });
      const utils = renderScreen();
      fireEvent.press(utils.getByText(/send verification code/i));
      await utils.findByPlaceholderText(/1234/);
      return utils;
    }

    it("keeps the Delete button disabled until both OTP and DELETE phrase are entered", async () => {
      const { getByPlaceholderText, getByRole } = await advanceToConfirm();

      const deleteButton = getByRole("button", { name: /delete my account/i });
      expect(deleteButton.props.accessibilityState?.disabled).toBe(true);

      fireEvent.changeText(getByPlaceholderText(/1234/), "1234");
      // Phrase still empty
      expect(deleteButton.props.accessibilityState?.disabled).toBe(true);

      fireEvent.changeText(getByPlaceholderText(/type delete/i), "DELETE");
      expect(deleteButton.props.accessibilityState?.disabled).toBe(false);
    });

    it("calls deleteAccountConfirm with the email and code when Delete is pressed", async () => {
      confirmMock.mockResolvedValueOnce({ deleted: true });
      const { getByPlaceholderText, getByText } = await advanceToConfirm();

      fireEvent.changeText(getByPlaceholderText(/1234/), "1234");
      fireEvent.changeText(getByPlaceholderText(/type delete/i), "DELETE");
      fireEvent.press(getByText(/delete my account/i));

      await waitFor(() => {
        expect(confirmMock).toHaveBeenCalledWith(TEST_EMAIL, "1234");
      });
    });

    it("calls the auth store logout after a successful delete", async () => {
      confirmMock.mockResolvedValueOnce({ deleted: true });
      const logoutSpy = jest.fn().mockResolvedValue(undefined);
      useAuthStore.setState({
        accessToken: "test-token",
        user: { id: "user-1", email: TEST_EMAIL, name: "Alice" },
        hydrated: true,
        logout: logoutSpy,
      });

      const { getByPlaceholderText, getByText } = await advanceToConfirm();
      fireEvent.changeText(getByPlaceholderText(/1234/), "1234");
      fireEvent.changeText(getByPlaceholderText(/type delete/i), "DELETE");
      fireEvent.press(getByText(/delete my account/i));

      await waitFor(() => {
        expect(logoutSpy).toHaveBeenCalled();
      });
    });

    it("shows an inline error when confirm fails", async () => {
      confirmMock.mockRejectedValueOnce(new Error("Invalid"));
      const { getByPlaceholderText, getByText, findByText } = await advanceToConfirm();

      fireEvent.changeText(getByPlaceholderText(/1234/), "9999");
      fireEvent.changeText(getByPlaceholderText(/type delete/i), "DELETE");
      fireEvent.press(getByText(/delete my account/i));

      const errorMessage = await findByText(/couldn.t delete/i);
      expect(errorMessage).toBeTruthy();
    });
  });
});
