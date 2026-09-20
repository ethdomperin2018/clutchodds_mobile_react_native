import { StyleSheet } from "react-native";
import { colors } from "@/theme/tokens";
import { typography } from "@/theme/typography";

/**
 * Canonical product-page chrome (matches web `productPagePadding` phone: px-3).
 * Every signed-in tab/page should use these — do not invent local padding.
 */
export const PAGE_PAD_X = 12;
export const PAGE_PAD_TOP = 12;
export const PAGE_PAD_BOTTOM = 24;
export const PAGE_STACK_GAP = 16;

export const pageChromeStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: PAGE_PAD_X,
    paddingTop: PAGE_PAD_TOP,
    paddingBottom: PAGE_PAD_BOTTOM,
    gap: PAGE_STACK_GAP,
    backgroundColor: colors.background,
  },
});

/**
 * Shared page title / subtitle / underline — same on every product page.
 */
export const pageHeaderStyles = StyleSheet.create({
  header: {
    gap: 6,
    marginBottom: 0,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(39,39,42,0.8)",
  },
  title: {
    ...typography.pageTitle,
    color: "#FFFFFF",
    flexShrink: 1,
  },
  subtitle: {
    ...typography.pageSubtitle,
  },
});
