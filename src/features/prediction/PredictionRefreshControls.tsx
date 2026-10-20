import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { fonts } from "@/theme/typography";

export function PredictionRefreshControls({
  refreshIntervalSec,
  onRefreshIntervalChange,
  autoRefresh,
  onAutoRefreshChange,
  onRefresh,
  loading,
  updatedAgoLabel,
}: {
  refreshIntervalSec: string;
  onRefreshIntervalChange: (value: string) => void;
  autoRefresh: boolean;
  onAutoRefreshChange: (checked: boolean) => void;
  onRefresh: () => void;
  loading: boolean;
  updatedAgoLabel?: string | null;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.intervalGroup}>
          <Text style={styles.intervalLabel}>INTERVAL</Text>
          <TextInput
            editable={autoRefresh}
            keyboardType="number-pad"
            onChangeText={onRefreshIntervalChange}
            style={[
              styles.intervalInput,
              !autoRefresh ? styles.intervalDisabled : null,
            ]}
            value={refreshIntervalSec}
          />
          <Text style={styles.minLabel}>min</Text>
        </View>

        <Pressable
          onPress={() => onAutoRefreshChange(!autoRefresh)}
          style={styles.autoWrap}
        >
          <View style={[styles.checkbox, autoRefresh ? styles.checkboxOn : null]}>
            {autoRefresh ? (
              <Ionicons color="#0EA5E9" name="checkmark" size={11} />
            ) : null}
          </View>
          <Text style={styles.autoLabel}>Auto</Text>
        </Pressable>
      </View>

      <View style={styles.bottomRow}>
        <Text numberOfLines={1} style={styles.updated}>
          {loading && !updatedAgoLabel
            ? "Fetching…"
            : updatedAgoLabel
              ? `Updated ${updatedAgoLabel}`
              : ""}
        </Text>
        <Pressable
          disabled={loading}
          onPress={onRefresh}
          style={({ pressed }) => [
            styles.refreshBtn,
            loading ? styles.refreshDisabled : null,
            pressed && !loading ? styles.refreshPressed : null,
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.refreshText}>Refresh</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#161616",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  intervalGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 1,
  },
  intervalLabel: {
    fontFamily: fonts.sansSemiBold,
    color: "#71717A",
    fontSize: 10,
    letterSpacing: 0.6,
  },
  intervalInput: {
    width: 48,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#111111",
    paddingHorizontal: 4,
    fontFamily: fonts.sansRegular,
    color: "#FFFFFF",
    fontSize: 12,
    textAlign: "center",
  },
  intervalDisabled: {
    opacity: 0.5,
  },
  minLabel: {
    fontFamily: fonts.sansRegular,
    color: "#71717A",
    fontSize: 11,
  },
  autoWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  checkbox: {
    width: 14,
    height: 14,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: "#52525B",
    backgroundColor: "#18181B",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxOn: {
    borderColor: "#0EA5E9",
    backgroundColor: "#0C4A6E",
  },
  autoLabel: {
    fontFamily: fonts.sansRegular,
    color: "#D4D4D8",
    fontSize: 12,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    paddingTop: 10,
  },
  updated: {
    flex: 1,
    fontFamily: fonts.sansRegular,
    color: "#A1A1AA",
    fontSize: 11,
  },
  refreshBtn: {
    height: 32,
    minWidth: 76,
    borderRadius: 8,
    backgroundColor: "#059669",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  refreshPressed: {
    opacity: 0.9,
  },
  refreshDisabled: {
    opacity: 0.5,
  },
  refreshText: {
    fontFamily: fonts.sansSemiBold,
    color: "#FFFFFF",
    fontSize: 12,
  },
});
