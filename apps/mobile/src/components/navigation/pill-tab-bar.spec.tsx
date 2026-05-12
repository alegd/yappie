import { render, fireEvent } from "@testing-library/react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { PillTabBar } from "./pill-tab-bar";

function buildProps(
  overrides: { activeIndex?: number; onNavigate?: jest.Mock } = {},
): BottomTabBarProps {
  const navigate = overrides.onNavigate ?? jest.fn();
  return {
    state: {
      index: overrides.activeIndex ?? 0,
      routes: [
        { key: "home-1", name: "home" },
        { key: "projects-1", name: "projects" },
      ],
    },
    navigation: { navigate, emit: jest.fn() },
    descriptors: {
      "home-1": { options: {} },
      "projects-1": { options: {} },
    },
    insets: { top: 0, bottom: 0, left: 0, right: 0 },
  } as unknown as BottomTabBarProps;
}

describe("PillTabBar", () => {
  it("renders Home and Projects labels", () => {
    const { getByText } = render(<PillTabBar {...buildProps()} />);
    expect(getByText("Home")).toBeTruthy();
    expect(getByText("Projects")).toBeTruthy();
  });

  it("marks the active tab as selected via accessibilityState", () => {
    const { getByTestId } = render(<PillTabBar {...buildProps({ activeIndex: 1 })} />);
    const projectsTab = getByTestId("pill-tab-projects");
    expect(projectsTab.props.accessibilityState).toMatchObject({ selected: true });
    const homeTab = getByTestId("pill-tab-home");
    expect(homeTab.props.accessibilityState).toMatchObject({ selected: false });
  });

  it("navigates to the pressed tab when inactive", () => {
    const navigate = jest.fn();
    const { getByText } = render(<PillTabBar {...buildProps({ onNavigate: navigate })} />);
    fireEvent.press(getByText("Projects"));
    expect(navigate).toHaveBeenCalledWith("projects");
  });

  it("does NOT navigate when the active tab is pressed", () => {
    const navigate = jest.fn();
    const { getByText } = render(
      <PillTabBar {...buildProps({ activeIndex: 0, onNavigate: navigate })} />,
    );
    fireEvent.press(getByText("Home"));
    expect(navigate).not.toHaveBeenCalled();
  });
});
