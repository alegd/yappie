import { render } from "@testing-library/react-native";
import { Skeleton } from "./skeleton";

describe("Skeleton", () => {
  it("renders with a testID for queryability", () => {
    const { getByTestId } = render(<Skeleton width={100} height={20} />);
    expect(getByTestId("skeleton")).toBeTruthy();
  });

  it("applies width and height as style", () => {
    const { getByTestId } = render(<Skeleton width={150} height={30} />);
    const node = getByTestId("skeleton");
    const flatStyle = Array.isArray(node.props.style)
      ? Object.assign({}, ...node.props.style)
      : node.props.style;
    expect(flatStyle.width).toBe(150);
    expect(flatStyle.height).toBe(30);
  });

  it("uses borderRadius when provided", () => {
    const { getByTestId } = render(<Skeleton width={100} height={20} borderRadius={8} />);
    const node = getByTestId("skeleton");
    const flatStyle = Array.isArray(node.props.style)
      ? Object.assign({}, ...node.props.style)
      : node.props.style;
    expect(flatStyle.borderRadius).toBe(8);
  });
});
