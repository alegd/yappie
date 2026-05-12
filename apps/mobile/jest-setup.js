/* eslint-disable @typescript-eslint/no-require-imports */
// Mock @gorhom/bottom-sheet to render its children inline when "open".
// Avoids needing react-native-reanimated worklets in tests.
jest.mock("@gorhom/bottom-sheet", () => {
  const React = require("react");
  const { View } = require("react-native");
  const BottomSheet = React.forwardRef((props, ref) => {
    React.useImperativeHandle(ref, () => ({
      snapToIndex: jest.fn(),
      close: jest.fn(),
      expand: jest.fn(),
      collapse: jest.fn(),
    }));
    if ((props.index ?? -1) < 0) return null;
    return React.createElement(View, { testID: "bottom-sheet" }, props.children);
  });
  return { __esModule: true, default: BottomSheet };
});
