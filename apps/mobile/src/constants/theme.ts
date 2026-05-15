export const colors = {
  background: "#1C1C28",
  surface: "#2A2A38",
  surfaceElevated: "#33333F",
  border: "rgba(255,255,255,0.08)",
  borderStrong: "rgba(255,255,255,0.16)",

  text: "#F5F5F5",
  textMuted: "#A0A0B8",
  textDim: "#6B6B80",

  primary: "#E8612F",
  primaryPressed: "#C04F26",

  danger: "#FF4757",
  success: "#15803D",
  warning: "#FFB347",
  info: "#5B86E5",

  priorityLow: "#A0A0B8",
  priorityMedium: "#5B86E5",
  priorityHigh: "#FF6B35",
  priorityCritical: "#FF4757",

  statusDraft: "#5B86E5",
  statusApproved: "#2ED47A",
  statusExported: "#15803D",
  statusRejected: "#FF4757",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  huge: 64,
} as const;

export const radii = {
  sm: 6,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const fontSize = {
  xs: 12,
  badge: 11,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  display: 32,
} as const;

export const fontWeight = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
} as const;

export const font = {
  heading: {
    medium: "Sora_500Medium",
    semibold: "Sora_600SemiBold",
    bold: "Sora_700Bold",
    extraBold: "Sora_800ExtraBold",
  },
  body: {
    regular: "DMSans_400Regular",
    medium: "DMSans_500Medium",
    bold: "DMSans_700Bold",
  },
} as const;

export const iconSize = {
  xs: 16,
  sm: 20,
  md: 22,
  lg: 24,
  xl: 26,
  display: 64,
} as const;

export const componentSize = {
  fab: 56,
  hitArea: 36,
  closeButton: 32,
  checkbox: 22,
  recordingDot: 12,
  recordingMic: 160,
  progressBarHeight: 6,
  descriptionMinHeight: 120,
} as const;

export const borderWidth = {
  thin: 1,
  medium: 1.5,
  thick: 2,
} as const;

export const opacity = {
  pressed: 0.6,
  pressedSubtle: 0.7,
  skeleton: 0.6,
  disabled: 0.5,
} as const;

export const duration = {
  recordingTick: 1000,
  toastDismiss: 3000,
} as const;

export type Colors = typeof colors;
export type Spacing = typeof spacing;
export type Radii = typeof radii;
export type FontSize = typeof fontSize;
export type FontWeight = typeof fontWeight;
export type Font = typeof font;
export type IconSize = typeof iconSize;
export type ComponentSize = typeof componentSize;
export type BorderWidth = typeof borderWidth;
export type Opacity = typeof opacity;
export type Duration = typeof duration;
