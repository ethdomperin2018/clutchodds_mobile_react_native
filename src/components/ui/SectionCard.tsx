import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing } from "@/theme/tokens";
import { typography } from "@/theme/typography";

type SectionCardProps = {
  title: string;
  description?: string;
  children?: ReactNode;
};

export function SectionCard({
  title,
  description,
  children,
}: SectionCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    ...typography.cardTitle,
    color: colors.text,
  },
  description: {
    ...typography.bodyMuted,
    color: colors.textMuted,
  },
});
