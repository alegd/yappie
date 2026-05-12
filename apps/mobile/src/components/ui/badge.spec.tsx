import { render } from "@testing-library/react-native";
import { Badge } from "./badge";

describe("Badge", () => {
  it("renders the label", () => {
    const { getByText } = render(<Badge label="CRITICAL" variant="critical" />);
    expect(getByText("CRITICAL")).toBeTruthy();
  });

  it("renders for every priority variant", () => {
    const variants = ["low", "medium", "high", "critical"] as const;
    for (const variant of variants) {
      const { getByText } = render(<Badge label={variant.toUpperCase()} variant={variant} />);
      expect(getByText(variant.toUpperCase())).toBeTruthy();
    }
  });

  it("renders for every status variant", () => {
    const variants = ["draft", "approved", "exported", "rejected"] as const;
    for (const variant of variants) {
      const { getByText } = render(<Badge label={variant.toUpperCase()} variant={variant} />);
      expect(getByText(variant.toUpperCase())).toBeTruthy();
    }
  });

  it("renders for every audio status variant", () => {
    const variants = ["pending", "transcribing", "analyzing", "completed", "failed"] as const;
    for (const variant of variants) {
      const { getByText } = render(<Badge label={variant.toUpperCase()} variant={variant} />);
      expect(getByText(variant.toUpperCase())).toBeTruthy();
    }
  });
});
