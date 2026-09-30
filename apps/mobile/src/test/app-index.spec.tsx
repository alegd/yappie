/* eslint-disable @typescript-eslint/no-require-imports */
jest.mock("expo-router", () => ({
  Redirect: ({ href }: { href: string }) => {
    const { Text } = jest.requireActual("react-native");
    return <Text>{`redirect:${href}`}</Text>;
  },
}));

const { render } =
  require("@testing-library/react-native") as typeof import("@testing-library/react-native");
const { useAuthStore } =
  require("@/features/auth/auth-store") as typeof import("@/features/auth/auth-store");
const Index = require("@/app/index").default as React.ComponentType;

describe("app index route", () => {
  beforeEach(() => {
    useAuthStore.setState({ accessToken: null, user: null, hydrated: true });
  });

  it("redirects to /projects when authenticated", () => {
    useAuthStore.setState({
      accessToken: "token-123",
      user: { id: "u1", email: "a@b.com", name: "Ale" },
      hydrated: true,
    });
    const { getByText } = render(<Index />);
    expect(getByText("redirect:/projects")).toBeTruthy();
  });

  it("redirects to /(auth)/welcome when not authenticated", () => {
    const { getByText } = render(<Index />);
    expect(getByText("redirect:/(auth)/welcome")).toBeTruthy();
  });
});
