import { StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing } from "@/theme/tokens";
import { typography } from "@/theme/typography";

type StatusPillProps = {
  label: string;
  tone?: "success" | "info" | "warning";
};

const toneStyles = {
  success: {
    backgroundColor: colors.primaryMuted,
    textColor: colors.primary,
  },
  info: {
    backgroundColor: "rgba(56,189,248,0.12)",
    textColor: colors.info,
  },
  warning: {
    backgroundColor: "rgba(250,204,21,0.12)",
    textColor: colors.warning,
  },
} as const;

export function StatusPill({
  label,
  tone = "info",
}: StatusPillProps) {
  const toneStyle = toneStyles[tone];

  return (
    <View style={[styles.pill, { backgroundColor: toneStyle.backgroundColor }]}>
      <Text style={[styles.label, { color: toneStyle.textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: "flex-start",
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  label: {
    ...typography.eyebrow,
    fontSize: 12,
    letterSpacing: 0.6,
  },
});
