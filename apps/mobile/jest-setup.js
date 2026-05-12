/* eslint-disable @typescript-eslint/no-require-imports */
// Provide a safe default for the env loader so transitive imports of
// lib/env do not fail when a test forgets to mock it.
process.env.EXPO_PUBLIC_API_URL = process.env.EXPO_PUBLIC_API_URL || "https://api.test";

// Mock useSafeAreaInsets so components reading insets work without a
// SafeAreaProvider wrapper in every test render.
jest.mock("react-native-safe-area-context", () => {
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  const actual = jest.requireActual("react-native-safe-area-context");
  return {
    ...actual,
    useSafeAreaInsets: () => inset,
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
  };
});

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
