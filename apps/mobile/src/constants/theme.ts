export const colors = {
  background: "#0a0a0a",
  surface: "#0f0f10",
  surfaceElevated: "#1f1f23",
  border: "#27272a",
  borderStrong: "#3f3f46",

  text: "#fafafa",
  textMuted: "#a1a1aa",
  textDim: "#71717a",

  primary: "#f97316",
  primaryPressed: "#ea580c",

  danger: "#ef4444",
  success: "#22c55e",
  warning: "#eab308",
  info: "#3b82f6",

  priorityLow: "#71717a",
  priorityMedium: "#3b82f6",
  priorityHigh: "#f97316",
  priorityCritical: "#ef4444",

  statusDraft: "#71717a",
  statusApproved: "#3b82f6",
  statusExported: "#22c55e",
  statusRejected: "#ef4444",
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
export type IconSize = typeof iconSize;
export type ComponentSize = typeof componentSize;
export type BorderWidth = typeof borderWidth;
export type Opacity = typeof opacity;
export type Duration = typeof duration;
