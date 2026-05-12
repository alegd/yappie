import { render } from "@testing-library/react-native";
import { HeaderTitle } from "./header-title";

describe("HeaderTitle", () => {
  it("renders the title", () => {
    const { getByText } = render(<HeaderTitle title="Projects" />);
    expect(getByText("Projects")).toBeTruthy();
  });

  it("renders the subtitle when provided", () => {
    const { getByText } = render(<HeaderTitle title="Projects" subtitle="3 in total" />);
    expect(getByText("3 in total")).toBeTruthy();
  });

  it("does NOT render subtitle area when missing", () => {
    const { queryByTestId } = render(<HeaderTitle title="Projects" />);
    expect(queryByTestId("header-subtitle")).toBeNull();
  });
});
