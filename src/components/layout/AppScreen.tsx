import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { colors, spacing } from "@/theme/tokens";

type AppScreenProps = {
  children: ReactNode;
  scrollable?: boolean;
};

/** Page chrome for signed-in tabs. Top safe area + AppHeader live in tabs layout. */
export function AppScreen({ children, scrollable = true }: AppScreenProps) {
  const content = scrollable ? (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      style={styles.flex}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, styles.scrollContent]}>{children}</View>
  );

  return <View style={styles.root}>{content}</View>;
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
});
