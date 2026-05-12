import { formatDuration, timeAgo } from "./format";

describe("formatDuration", () => {
  it("formats whole minutes", () => {
    expect(formatDuration(120)).toBe("2:00");
  });

  it("pads seconds with zero", () => {
    expect(formatDuration(65)).toBe("1:05");
  });

  it("returns 0:00 for null or zero", () => {
    expect(formatDuration(null)).toBe("0:00");
    expect(formatDuration(0)).toBe("0:00");
  });

  it("handles fractional seconds", () => {
    expect(formatDuration(47.6)).toBe("0:47");
  });
});

describe("timeAgo", () => {
  const now = new Date("2026-05-12T12:00:00Z").getTime();

  beforeEach(() => {
    jest.spyOn(Date, "now").mockReturnValue(now);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns 'just now' for under a minute", () => {
    expect(timeAgo("2026-05-12T11:59:30Z")).toBe("just now");
  });

  it("returns minutes for under an hour", () => {
    expect(timeAgo("2026-05-12T11:30:00Z")).toBe("30m ago");
  });

  it("returns hours for under a day", () => {
    expect(timeAgo("2026-05-12T10:00:00Z")).toBe("2h ago");
  });

  it("returns days for under a week", () => {
    expect(timeAgo("2026-05-10T12:00:00Z")).toBe("2d ago");
  });
});
