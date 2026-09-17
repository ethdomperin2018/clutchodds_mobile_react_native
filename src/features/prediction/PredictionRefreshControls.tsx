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
 * Matches web `ScannerRefreshControls` with violet focus (Model Predictions).
 */
export function PredictionRefreshControls({
  refreshIntervalSec,
  onRefreshIntervalChange,
  autoRefresh,
  onAutoRefreshChange,
  onRefresh,
  loading,
}: {
  refreshIntervalSec: string;
  onRefreshIntervalChange: (value: string) => void;
  autoRefresh: boolean;
  onAutoRefreshChange: (checked: boolean) => void;
  onRefresh: () => void;
  loading: boolean;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.intervalGroup}>
        <Text style={styles.everyLabel}>Refresh every</Text>
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
        <Text style={styles.secLabel}>sec</Text>
      </View>

      <Pressable
        onPress={() => onAutoRefreshChange(!autoRefresh)}
        style={styles.autoWrap}
      >
        <View style={[styles.checkbox, autoRefresh ? styles.checkboxOn : null]}>
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
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  intervalGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },
  everyLabel: {
    fontFamily: fonts.sansRegular,
    color: "#71717A",
    fontSize: 12,
  },
  intervalInput: {
    width: 48,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#3F3F46",
    backgroundColor: "#18181B",
    paddingHorizontal: 8,
    fontFamily: fonts.sansRegular,
    color: "#FFFFFF",
    fontSize: 12,
    textAlign: "center",
  },
  intervalDisabled: {
    opacity: 0.5,
  },
  secLabel: {
    fontFamily: fonts.sansRegular,
    color: "#52525B",
    fontSize: 12,
  },
  autoWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
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
    fontFamily: fonts.sansRegular,
    color: "#A1A1AA",
    fontSize: 12,
  },
  refreshBtn: {
    height: 32,
    minWidth: 84,
    borderRadius: 8,
    backgroundColor: "#059669",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
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
