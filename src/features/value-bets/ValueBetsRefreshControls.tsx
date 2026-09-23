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

/**
 * Phone control panel — matches web `ValueBetsControlPanel` compact row:
 * Stake · Interval · Auto · Refresh (+ updated footer).
 */
export function ValueBetsRefreshControls({
  logStake,
  onLogStakeChange,
  refreshIntervalSec,
  onRefreshIntervalChange,
  autoRefresh,
  onAutoRefreshChange,
  onRefresh,
  loading,
  predictionsLoading = false,
  updatedAgoLabel,
  updatedToneStyle,
}: {
  logStake: string;
  onLogStakeChange: (value: string) => void;
  refreshIntervalSec: string;
  onRefreshIntervalChange: (value: string) => void;
  autoRefresh: boolean;
  onAutoRefreshChange: (checked: boolean) => void;
  onRefresh: () => void;
  loading: boolean;
  predictionsLoading?: boolean;
  updatedAgoLabel: string | null;
  updatedToneStyle?: object;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Stake ($)</Text>
          <TextInput
            keyboardType="number-pad"
            onChangeText={onLogStakeChange}
            style={styles.input}
            value={logStake}
          />
        </View>

        <View style={[styles.field, styles.intervalField]}>
          <Text style={styles.fieldLabel}>Interval</Text>
          <View style={styles.intervalWrap}>
            <TextInput
              editable={autoRefresh}
              keyboardType="number-pad"
              onChangeText={onRefreshIntervalChange}
              style={[
                styles.input,
                styles.intervalInput,
                !autoRefresh ? styles.inputDisabled : null,
              ]}
              value={refreshIntervalSec}
            />
            <Text style={styles.secSuffix}>sec</Text>
          </View>
        </View>

        <Pressable
          onPress={() => onAutoRefreshChange(!autoRefresh)}
          style={styles.autoWrap}
        >
          <View
            style={[styles.checkbox, autoRefresh ? styles.checkboxOn : null]}
          >
            {autoRefresh ? (
              <Ionicons color="#0EA5E9" name="checkmark" size={12} />
            ) : null}
          </View>
          <Text style={styles.autoLabel}>Auto</Text>
        </Pressable>

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

      <View style={styles.footer}>
        {updatedAgoLabel ? (
          <View style={styles.updatedRow}>
            <Text style={styles.updatedCopy}>
              Updated{" "}
              <Text style={updatedToneStyle}>{updatedAgoLabel}</Text>
              {autoRefresh ? (
                <Text style={styles.everyCopy}>
                  {" "}
                  · every {refreshIntervalSec}s
                </Text>
              ) : null}
            </Text>
            <View style={styles.liveDot} />
          </View>
        ) : null}
        {loading ? <Text style={styles.fetching}>Fetching…</Text> : null}
        {predictionsLoading ? (
          <Text style={styles.predictionLoading}>
            Loading Prediction Engine…
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#161616",
    padding: 12,
    gap: 12,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-end",
    gap: 8,
  },
  field: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 72,
    minWidth: 64,
    gap: 4,
  },
  intervalField: {
    flexBasis: 88,
    minWidth: 80,
  },
  fieldLabel: {
    fontFamily: fonts.sansSemiBold,
    color: "#71717A",
    fontSize: 9,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  input: {
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#111111",
    paddingHorizontal: 8,
    fontFamily: fonts.sansRegular,
    color: "#FFFFFF",
    fontSize: 14,
    fontVariant: ["tabular-nums"],
  },
  inputDisabled: {
    opacity: 0.5,
  },
  intervalWrap: {
    position: "relative",
    justifyContent: "center",
  },
  intervalInput: {
    paddingRight: 32,
  },
  secSuffix: {
    position: "absolute",
    right: 8,
    fontFamily: fonts.sansRegular,
    color: "#71717A",
    fontSize: 10,
  },
  autoWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 36,
    flexShrink: 0,
  },
  checkbox: {
    width: 16,
    height: 16,
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
    fontFamily: fonts.sansMedium,
    color: "#D4D4D8",
    fontSize: 9,
  },
  refreshBtn: {
    height: 36,
    minWidth: 72,
    borderRadius: 8,
    backgroundColor: "#059669",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    flexShrink: 0,
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
  footer: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    paddingTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
  },
  updatedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  updatedCopy: {
    fontFamily: fonts.sansRegular,
    color: "#A1A1AA",
    fontSize: 12,
  },
  everyCopy: {
    color: "#52525B",
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#34D399",
  },
  fetching: {
    fontFamily: fonts.sansRegular,
    color: "#71717A",
    fontSize: 12,
  },
  predictionLoading: {
    fontFamily: fonts.sansRegular,
    color: "#C4B5FD",
    fontSize: 12,
  },
});
