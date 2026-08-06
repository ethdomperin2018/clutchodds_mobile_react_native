import {
  Pressable,
  StyleSheet,
  Text,
  type GestureResponderEvent,
} from "react-native";
import { colors, radii, spacing } from "@/theme/tokens";
import { fonts, typography } from "@/theme/typography";

type PrimaryButtonProps = {
  label: string;
  onPress?: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  variant?: "solid" | "ghost";
};

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  variant = "solid",
}: PrimaryButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === "solid" ? styles.solid : styles.ghost,
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
      ]}
    >
      <Text style={[styles.label, variant === "ghost" ? styles.ghostLabel : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  solid: {
    backgroundColor: colors.primary,
  },
  ghost: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    ...typography.button,
    color: "#FFFFFF",
    fontFamily: fonts.sansSemiBold,
  },
  ghostLabel: {
    color: colors.text,
  },
});
