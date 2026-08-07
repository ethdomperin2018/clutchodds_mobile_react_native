export const colors = {
  background: "#000000",
  surface: "#141414",
  surfaceMuted: "#1A1A1A",
  border: "rgba(255,255,255,0.12)",
  borderStrong: "rgba(255,255,255,0.18)",
  text: "#FFFFFF",
  textMuted: "#9CA3AF",
  primary: "#FF1E1E",
  primaryMuted: "rgba(255,30,30,0.16)",
  danger: "#FF6B6B",
  warning: "#FACC15",
  info: "#38BDF8",
  success: "#22C55E",
} as const;

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

export const radii = {
  sm: 10,
  md: 12,
  lg: 16,
  pill: 999,
} as const;
