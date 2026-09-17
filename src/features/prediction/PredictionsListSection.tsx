import { useRef, useState, type RefObject } from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { PredictionListCard } from "@/features/prediction/PredictionListCard";
import {
  PREDICTION_SORT_OPTIONS,
  type PredictionSortKey,
} from "@/features/prediction/useModelPredictionsBoard";
import type { ModelPredictionRow } from "@/lib/modelPredictions/modelPredictionRows";
import { fonts } from "@/theme/typography";

type MenuAnchor = { x: number; y: number; width: number; height: number };

export function PredictionsListSection({
  rows,
  emptyMessage,
  nowMs,
  search,
  onSearchChange,
  sort,
  sortDir,
  onSortChange,
  onToggleSortDir,
}: {
  rows: ModelPredictionRow[];
  emptyMessage: string;
  nowMs: number;
  search: string;
  onSearchChange: (value: string) => void;
  sort: PredictionSortKey;
  sortDir: "asc" | "desc";
  onSortChange: (key: PredictionSortKey) => void;
  onToggleSortDir: () => void;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>All Model Predictions</Text>

      <View style={styles.toolbar}>
        <View style={styles.searchWrap}>
          <Svg
            fill="none"
            height={16}
            style={styles.searchIcon}
            viewBox="0 0 24 24"
            width={16}
          >
            <Path
              d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z"
              stroke="#71717A"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
            />
          </Svg>
          <TextInput
            accessibilityLabel="Search predictions"
            onChangeText={onSearchChange}
            placeholder="Search…"
            placeholderTextColor="#52525B"
            style={styles.searchInput}
            value={search}
          />
        </View>

        <View style={styles.sortTools}>
          <SortSelect onChange={onSortChange} value={sort} />
          <Pressable
            accessibilityLabel={
              sortDir === "desc"
                ? "Sort descending (highest first)"
                : "Sort ascending (lowest first)"
            }
            onPress={onToggleSortDir}
            style={({ pressed }) => [
              styles.dirBtn,
              pressed ? styles.dirBtnPressed : null,
            ]}
          >
            <Svg fill="none" height={16} viewBox="0 0 24 24" width={16}>
              {sortDir === "asc" ? (
                <Path
                  d="M8 15l4-4 4 4"
                  stroke="#A1A1AA"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              ) : (
                <Path
                  d="M8 9l4 4 4-4"
                  stroke="#A1A1AA"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              )}
            </Svg>
          </Pressable>
        </View>
      </View>

      {rows.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyCopy}>{emptyMessage}</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {rows.map((row) => (
            <PredictionListCard
              key={row.pick.eventId}
              nowMs={nowMs}
              row={row}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function SortSelect({
  value,
  onChange,
}: {
  value: PredictionSortKey;
  onChange: (key: PredictionSortKey) => void;
}) {
  const triggerRef = useRef<View>(null);
  const [anchor, setAnchor] = useState<MenuAnchor | null>(null);
  const selected =
    PREDICTION_SORT_OPTIONS.find((opt) => opt.value === value)?.label ?? value;
  const menuHeight = Math.min(224, PREDICTION_SORT_OPTIONS.length * 36 + 8);

  return (
    <View style={styles.sortField}>
      <View collapsable={false} ref={triggerRef}>
        <Pressable
          accessibilityLabel="Sort predictions"
          onPress={() => {
            if (anchor) setAnchor(null);
            else measureTrigger(triggerRef, setAnchor);
          }}
          style={({ pressed }) => [
            styles.sortTrigger,
            pressed ? styles.sortTriggerPressed : null,
          ]}
        >
          <Text numberOfLines={1} style={styles.sortTriggerText}>
            {selected}
          </Text>
          <Svg fill="#71717A" height={14} viewBox="0 0 20 20" width={14}>
            <Path
              clipRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
              fillRule="evenodd"
            />
          </Svg>
        </Pressable>
      </View>

      {anchor ? (
        <Modal
          animationType="none"
          onRequestClose={() => setAnchor(null)}
          transparent
          visible
        >
          <View style={styles.menuLayer}>
            <Pressable
              onPress={() => setAnchor(null)}
              style={styles.menuDismiss}
            />
            <View
              style={[
                styles.menu,
                {
                  top: menuTop(anchor, menuHeight),
                  left: Math.max(8, anchor.x + anchor.width - 148),
                  width: Math.max(148, anchor.width),
                  maxHeight: menuHeight,
                },
              ]}
            >
              {PREDICTION_SORT_OPTIONS.map((opt) => {
                const active = opt.value === value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => {
                      onChange(opt.value);
                      setAnchor(null);
                    }}
                    style={[styles.menuItem, active ? styles.menuItemOn : null]}
                  >
                    <Text
                      style={[
                        styles.menuText,
                        active ? styles.menuTextOn : null,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

function measureTrigger(
  ref: RefObject<View | null>,
  onMeasured: (anchor: MenuAnchor) => void
) {
  const run = () => {
    ref.current?.measureInWindow((x, y, width, height) => {
      if (!width || !height) {
        requestAnimationFrame(run);
        return;
      }
      onMeasured({ x, y, width, height });
    });
  };
  requestAnimationFrame(run);
}

function menuTop(anchor: MenuAnchor, menuHeight: number) {
  const windowHeight = Dimensions.get("window").height;
  const below = anchor.y + anchor.height + 4;
  if (below + menuHeight <= windowHeight - 12) return below;
  const above = anchor.y - menuHeight - 4;
  return Math.max(12, above);
}

const styles = StyleSheet.create({
  section: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#161616",
    padding: 16,
    gap: 12,
  },
  title: {
    fontFamily: fonts.displaySemiBold,
    color: "#FFFFFF",
    fontSize: 18,
    textAlign: "center",
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  searchWrap: {
    flex: 1,
    minWidth: 0,
    position: "relative",
    justifyContent: "center",
  },
  searchIcon: {
    position: "absolute",
    left: 10,
    zIndex: 1,
  },
  searchInput: {
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#111111",
    paddingLeft: 32,
    paddingRight: 10,
    fontFamily: fonts.sansRegular,
    color: "#E4E4E7",
    fontSize: 14,
  },
  sortTools: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },
  sortField: {
    width: 116,
  },
  sortTrigger: {
    height: 36,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#111111",
    paddingHorizontal: 8,
  },
  sortTriggerPressed: {
    borderColor: "rgba(167,139,250,0.5)",
  },
  sortTriggerText: {
    flex: 1,
    fontFamily: fonts.sansRegular,
    color: "#E4E4E7",
    fontSize: 12,
  },
  dirBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#111111",
    alignItems: "center",
    justifyContent: "center",
  },
  dirBtnPressed: {
    borderColor: "rgba(255,255,255,0.2)",
  },
  list: {
    gap: 12,
  },
  empty: {
    marginTop: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(17,17,17,0.5)",
    paddingHorizontal: 16,
    paddingVertical: 32,
  },
  emptyCopy: {
    fontFamily: fonts.sansRegular,
    color: "#71717A",
    fontSize: 14,
    textAlign: "center",
  },
  menuLayer: {
    flex: 1,
  },
  menuDismiss: {
    ...StyleSheet.absoluteFill,
  },
  menu: {
    position: "absolute",
    zIndex: 1000,
    overflow: "hidden",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#111111",
    paddingVertical: 4,
    elevation: 24,
    shadowColor: "#000",
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  menuItem: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  menuItemOn: {
    backgroundColor: "rgba(76,29,149,0.4)",
  },
  menuText: {
    fontFamily: fonts.sansRegular,
    color: "#D4D4D8",
    fontSize: 12,
  },
  menuTextOn: {
    color: "#DDD6FE",
  },
});
