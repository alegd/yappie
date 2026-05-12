const mockInit = jest.fn();
jest.mock("@sentry/react-native", () => ({
  init: mockInit,
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { initSentry } = require("./sentry") as typeof import("./sentry");

describe("initSentry", () => {
  beforeEach(() => {
    mockInit.mockReset();
  });

  it("should call Sentry.init when DSN is provided", () => {
    initSentry("https://sentry.example.com/123");
    expect(mockInit).toHaveBeenCalledWith(
      expect.objectContaining({ dsn: "https://sentry.example.com/123" }),
    );
  });

  it("should NOT call Sentry.init when DSN is undefined", () => {
    initSentry(undefined);
    expect(mockInit).not.toHaveBeenCalled();
  });

  it("should swallow errors thrown by Sentry.init", () => {
    mockInit.mockImplementation(() => {
      throw new Error("boom");
    });
    expect(() => initSentry("https://sentry.example.com/123")).not.toThrow();
  });
});
