import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "@/theme/tokens";
import { typography } from "@/theme/typography";

export function LoadingScreen({ label }: { label: string }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    gap: spacing.md,
  },
  label: {
    ...typography.bodyMuted,
    color: colors.textMuted,
  },
});
