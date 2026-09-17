import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { AppScreen } from "@/components/layout/AppScreen";
import { OddsApiErrorBanner } from "@/components/ui/OddsApiErrorBanner";
import { AccountInactiveNotice } from "@/features/auth/AccountInactiveNotice";
import { useSession } from "@/features/auth/SessionProvider";
import {
  ModelPredictionsBoardUiProvider,
  useModelPredictionsBoardUi,
} from "@/features/prediction/ModelPredictionsBoardUiContext";
import { PredictionRefreshControls } from "@/features/prediction/PredictionRefreshControls";
import { PredictionSportTabs } from "@/features/prediction/PredictionSportTabs";
import {
  TopPredictionCard,
  TopPredictionEmpty,
} from "@/features/prediction/TopPredictionCard";
import { PredictionsListSection } from "@/features/prediction/PredictionsListSection";
import { AboutModelPredictionsCard } from "@/features/prediction/AboutModelPredictionsCard";
import { ModelPredictionsFiltersModal } from "@/features/prediction/ModelPredictionsFiltersModal";
import {
  useModelPredictionsBoard,
  type FreshnessTone,
} from "@/features/prediction/useModelPredictionsBoard";
import { isAccountActive } from "@/lib/accountStatus";
import { getPlanPriceLabel } from "@/lib/billing/plans";
import { openPricing } from "@/lib/openLinks";
import { isEliteUser, isProUser } from "@/lib/planAccess";
import { colors } from "@/theme/tokens";
import { fonts, typography } from "@/theme/typography";
import type { AuthUser } from "@/types/auth";

const PAGE_SUBTITLE =
  "AI-powered pre-game win probability, confidence, and projected edge.";

export function PredictionScreen() {
  const { user, ready, refresh } = useSession();

  if (!ready) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.success} />
      </View>
    );
  }

  return (
    <ModelPredictionsBoardUiProvider>
      <PredictionScreenBody refresh={refresh} user={user} />
    </ModelPredictionsBoardUiProvider>
  );
}

function PredictionScreenBody({
  user,
  refresh,
}: {
  user: AuthUser | null;
  refresh: () => Promise<AuthUser | null>;
}) {
  const elite = isEliteUser(user);
  const pro = isProUser(user);
  const accountActive = user ? isAccountActive(user.accountStatus) : true;
  const { filtersOpen, setFiltersOpen, setActiveFilterCount } =
    useModelPredictionsBoardUi();
  const board = useModelPredictionsBoard({
    userId: user?.id ?? null,
    enabled: elite && accountActive,
    refresh,
  });
  const openFilters = useCallback(
    () => setFiltersOpen(true),
    [setFiltersOpen]
  );

  useEffect(() => {
    setActiveFilterCount(board.activeFilterCount);
  }, [board.activeFilterCount, setActiveFilterCount]);

  return (
    <AppScreen>
      <Header
        showFilters={elite && accountActive}
        filterCount={board.activeFilterCount}
        onOpenFilters={openFilters}
      />

      {!accountActive ? (
        <AccountInactiveNotice />
      ) : elite ? (
        <EliteBoardShell board={board} />
      ) : (
        <EliteUpgradeCard pro={pro} />
      )}

      <Text style={styles.disclaimer}>
        Model predictions are for informational purposes only. Not financial
        advice.
      </Text>

      {elite && accountActive ? (
        <ModelPredictionsFiltersModal
          minConfidence={board.minConfidence}
          minEdge={board.minEdge}
          open={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          onMinConfidenceChange={board.setMinConfidence}
          onMinEdgeChange={board.setMinEdge}
          onReset={board.resetFilters}
        />
      ) : null}
    </AppScreen>
  );
}

/** Step 4: refresh chrome wired; sport tabs / cards next. */
function EliteBoardShell({
  board,
}: {
  board: ReturnType<typeof useModelPredictionsBoard>;
}) {
  if (!board.initialLoadComplete) {
    return (
      <View style={styles.boardShell}>
        <ActivityIndicator color={colors.success} />
        <Text style={styles.boardShellCopy}>Loading model predictions…</Text>
      </View>
    );
  }

  const showUpdated = Boolean(board.updatedAgoLabel) || board.loading;

  return (
    <View style={styles.boardStack}>
      {board.error ? (
        <OddsApiErrorBanner
          error={board.error}
          errorCode={board.errorCode}
          errorTitle={board.errorTitle}
        />
      ) : null}

      {board.predictionsWarning ? (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>{board.predictionsWarning}</Text>
        </View>
      ) : null}

      <View style={styles.refreshBlock}>
        {showUpdated ? (
          <Text style={styles.updatedLine}>
            {board.updatedAgoLabel ? (
              <>
                Updated{" "}
                <Text style={freshnessStyle(board.updatedTone)}>
                  {board.updatedAgoLabel}
                </Text>
                {board.autoRefresh ? (
                  <Text style={styles.updatedEvery}>
                    {" "}
                    · every {board.pollIntervalSec}s
                  </Text>
                ) : null}
              </>
            ) : null}
            {board.loading ? (
              <Text>
                {board.updatedAgoLabel ? "  " : ""}
                Fetching…
              </Text>
            ) : null}
          </Text>
        ) : null}

        <PredictionRefreshControls
          autoRefresh={board.autoRefresh}
          loading={board.loading}
          onAutoRefreshChange={board.setAutoRefresh}
          onRefresh={() => void board.reload()}
          onRefreshIntervalChange={board.setRefreshIntervalSec}
          refreshIntervalSec={board.refreshIntervalSec}
        />
      </View>

      <PredictionSportTabs
        active={board.sportTab}
        onChange={board.setSportTab}
      />

      {board.top ? (
        <TopPredictionCard nowMs={board.nowMs} row={board.top} />
      ) : (
        <TopPredictionEmpty message={board.featuredEmptyMessage} />
      )}

      <PredictionsListSection
        emptyMessage={board.listEmptyMessage}
        nowMs={board.nowMs}
        onSearchChange={board.setSearch}
        onSortChange={board.setSortKey}
        onToggleSortDir={board.toggleSortDir}
        rows={board.searched}
        search={board.search}
        sort={board.sort}
        sortDir={board.sortDir}
      />

      <AboutModelPredictionsCard />
    </View>
  );
}

function freshnessStyle(tone: FreshnessTone) {
  if (tone === "fresh") return styles.updatedFresh;
  if (tone === "warm") return styles.updatedWarm;
  if (tone === "stale") return styles.updatedStale;
  return styles.updatedIdle;
}

function Header({
  showFilters,
  filterCount,
  onOpenFilters,
}: {
  showFilters: boolean;
  filterCount: number;
  onOpenFilters: () => void;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Model Predictions</Text>
          <View style={styles.eliteBadge}>
            <Text style={styles.eliteBadgeText}>ELITE</Text>
          </View>
        </View>
        {showFilters ? (
          <Pressable
            onPress={onOpenFilters}
            style={({ pressed }) => [
              styles.filtersBtn,
              pressed ? styles.filtersBtnPressed : null,
            ]}
          >
            <Svg fill="none" height={16} viewBox="0 0 24 24" width={16}>
              <Path
                d="M3 4h18M7 8h10M10 12h4M12 16h0"
                stroke="#A1A1AA"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </Svg>
            <Text style={styles.filtersText}>Filters</Text>
            {filterCount > 0 ? (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{filterCount}</Text>
              </View>
            ) : null}
          </Pressable>
        ) : null}
      </View>
      <Text style={styles.subtitle}>{PAGE_SUBTITLE}</Text>
    </View>
  );
}

function EliteUpgradeCard({ pro }: { pro: boolean }) {
  const elitePrice = getPlanPriceLabel("elite", "month");
  return (
    <View style={styles.gate}>
      <View style={styles.gateIcon}>
        <Ionicons color="#C4B5FD" name="sparkles-outline" size={22} />
      </View>
      <View style={styles.gatePill}>
        <Text style={styles.gatePillText}>Elite</Text>
      </View>
      <Text style={styles.gateTitle}>Unlock Model Predictions</Text>
      <Text style={styles.gateCopy}>
        {pro
          ? `Upgrade to Elite (${elitePrice}) for AI win probability, confidence, and model edge across MLB, NBA, NFL, and NHL.`
          : "Elite unlocks the Prediction Engine — model win probability, confidence, and projected edge. Start with Pro or go straight to Elite."}
      </Text>
      <Pressable
        onPress={() => void openPricing("/model-predictions")}
        style={({ pressed }) => [
          styles.primaryBtn,
          pressed ? styles.pressed : null,
        ]}
      >
        <Text style={styles.primaryBtnText}>
          {pro ? "Upgrade to Elite" : "View Elite plans"}
        </Text>
      </Pressable>
      <Pressable
        onPress={() => router.push("/(app)/(tabs)/value-bets")}
        style={({ pressed }) => [
          styles.secondaryBtn,
          pressed ? styles.pressed : null,
        ]}
      >
        <Text style={styles.secondaryBtnText}>Open Value Bets</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  header: {
    marginBottom: 4,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(39,39,42,0.8)",
    gap: 6,
  },
  headerTop: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexShrink: 1,
  },
  title: {
    ...typography.pageTitle,
    color: "#FFFFFF",
  },
  subtitle: {
    ...typography.pageSubtitle,
  },
  /** Matches web AppPageHeader badge: rounded + bg-violet-600 + text-xs. */
  eliteBadge: {
    borderRadius: 4,
    backgroundColor: "#7C3AED",
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  eliteBadgeText: {
    fontFamily: fonts.sansBold,
    color: "#FFFFFF",
    fontSize: 12,
  },
  filtersBtn: {
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#3F3F46",
    backgroundColor: "#18181B",
    paddingHorizontal: 16,
  },
  filtersBtnPressed: {
    borderColor: "#71717A",
  },
  filtersText: {
    fontFamily: fonts.sansSemiBold,
    color: "#E4E4E7",
    fontSize: 12,
    letterSpacing: 0.96,
    textTransform: "uppercase",
  },
  filterBadge: {
    borderRadius: 999,
    backgroundColor: "rgba(5, 150, 105, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  filterBadgeText: {
    fontFamily: fonts.sansBold,
    color: "#FFFFFF",
    fontSize: 10,
    fontVariant: ["tabular-nums"],
  },
  boardStack: {
    gap: 12,
  },
  refreshBlock: {
    gap: 8,
  },
  updatedLine: {
    fontFamily: fonts.sansRegular,
    color: "#A1A1AA",
    fontSize: 12,
  },
  updatedEvery: {
    color: "#52525B",
  },
  updatedFresh: {
    color: "#34D399",
  },
  updatedWarm: {
    color: "#FCD34D",
  },
  updatedStale: {
    color: "#F87171",
  },
  updatedIdle: {
    color: "#A1A1AA",
  },
  boardShell: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(24,24,27,0.4)",
    paddingHorizontal: 16,
    paddingVertical: 28,
    alignItems: "center",
    gap: 8,
  },
  boardShellCopy: {
    marginTop: 8,
    fontFamily: fonts.sansRegular,
    color: "#71717A",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  warningBanner: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.35)",
    backgroundColor: "rgba(251,191,36,0.08)",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  warningText: {
    fontFamily: fonts.sansRegular,
    color: "#FCD34D",
    fontSize: 13,
    lineHeight: 18,
  },
  disclaimer: {
    fontFamily: fonts.sansRegular,
    color: "#71717A",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  gate: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.3)",
    backgroundColor: "rgba(139,92,246,0.06)",
    paddingHorizontal: 24,
    paddingVertical: 40,
    alignItems: "center",
  },
  gateIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.4)",
    backgroundColor: "rgba(139,92,246,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  gatePill: {
    marginTop: 16,
    borderRadius: 999,
    backgroundColor: "rgba(139,92,246,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  gatePillText: {
    fontFamily: fonts.sansBold,
    color: "#C4B5FD",
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  gateTitle: {
    marginTop: 12,
    fontFamily: fonts.displaySemiBold,
    color: "#FFFFFF",
    fontSize: 20,
    textAlign: "center",
  },
  gateCopy: {
    marginTop: 12,
    maxWidth: 360,
    fontFamily: fonts.sansRegular,
    color: "#A1A1AA",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  primaryBtn: {
    marginTop: 32,
    alignSelf: "stretch",
    borderRadius: 6,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  primaryBtnText: {
    fontFamily: fonts.sansBold,
    color: "#FFFFFF",
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  secondaryBtn: {
    marginTop: 12,
    alignSelf: "stretch",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  secondaryBtnText: {
    fontFamily: fonts.sansBold,
    color: "#E4E4E7",
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  pressed: {
    opacity: 0.85,
  },
});
