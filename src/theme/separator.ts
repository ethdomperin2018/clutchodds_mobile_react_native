import { PixelRatio, StyleSheet } from "react-native";

/**
 * Retina iPhones often drop StyleSheet.hairlineWidth / 1px borders.
 * Use at least 2 device pixels so separators stay visible.
 */
export const SEPARATOR_THICKNESS = Math.max(
  2,
  PixelRatio.roundToNearestPixel(2)
);

export const separatorColor = "rgba(255,255,255,0.28)";

export const separatorLineStyle = StyleSheet.create({
  horizontal: {
    height: SEPARATOR_THICKNESS,
    minHeight: SEPARATOR_THICKNESS,
    backgroundColor: separatorColor,
  },
}).horizontal;
