import { useRef, useState, type ReactNode, type RefObject } from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import {
  MIN_CONFIDENCE_OPTIONS,
  MIN_EDGE_OPTIONS,
} from "@/features/prediction/useModelPredictionsBoard";
import { fonts } from "@/theme/typography";

type MenuAnchor = { x: number; y: number; width: number; height: number };

export function ModelPredictionsFiltersModal({
  open,
  minEdge,
  minConfidence,
  onMinEdgeChange,
  onMinConfidenceChange,
  onReset,
  onClose,
}: {
  open: boolean;
  minEdge: string;
  minConfidence: number;
  onMinEdgeChange: (value: string) => void;
  onMinConfidenceChange: (value: number) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={open}>
      <View style={styles.root}>
        <Pressable onPress={onClose} style={styles.backdrop} />
        <View style={styles.dialog}>
          <View style={styles.header}>
            <Text style={styles.title}>Filters</Text>
            <Pressable
              accessibilityLabel="Done"
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeBtn,
                pressed ? styles.closeBtnPressed : null,
              ]}
            >
              <Svg fill="none" height={16} viewBox="0 0 24 24" width={16}>
                <Path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="#A1A1AA"
                  strokeLinecap="round"
                  strokeWidth={2}
                />
              </Svg>
            </Pressable>
          </View>

          <View style={styles.body}>
            <View style={styles.row}>
              <FilterSelect
                label="Minimum Model Edge"
                onChange={onMinEdgeChange}
                options={MIN_EDGE_OPTIONS.map((opt) => ({
                  value: opt.value,
                  label: opt.label,
                }))}
                value={minEdge}
              />
              <FilterSelect
                label="Minimum Confidence"
                onChange={(value) => onMinConfidenceChange(Number(value) || 0)}
                options={MIN_CONFIDENCE_OPTIONS.map((opt) => ({
                  value: opt.value,
                  label: opt.label,
                }))}
                value={String(minConfidence)}
              />
            </View>
          </View>

          <View style={styles.footer}>
            <Pressable
              onPress={onReset}
              style={({ pressed }) => (pressed ? styles.resetPressed : null)}
            >
              <Text style={styles.reset}>Reset</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function SelectChevron() {
  return (
    <Svg fill="#71717A" height={14} viewBox="0 0 20 20" width={14}>
      <Path
        clipRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
        fillRule="evenodd"
      />
    </Svg>
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

function OverlayMenu({
  visible,
  anchor,
  maxHeight,
  children,
  onClose,
}: {
  visible: boolean;
  anchor: MenuAnchor | null;
  maxHeight: number;
  children: ReactNode;
  onClose: () => void;
}) {
  if (!visible || !anchor) return null;
  const top = menuTop(anchor, maxHeight);
  const left = Math.max(8, anchor.x);

  return (
    <Modal animationType="none" onRequestClose={onClose} transparent visible>
      <View style={styles.menuLayer}>
        <Pressable onPress={onClose} style={styles.menuDismiss} />
        <View
          style={[
            styles.menu,
            { top, left, width: anchor.width, maxHeight },
          ]}
        >
          {children}
        </View>
      </View>
    </Modal>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  const triggerRef = useRef<View>(null);
  const [anchor, setAnchor] = useState<MenuAnchor | null>(null);
  const selected = options.find((opt) => opt.value === value)?.label ?? value;
  const menuHeight = Math.min(224, options.length * 36 + 8);

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View collapsable={false} ref={triggerRef}>
        <Pressable
          onPress={() => {
            if (anchor) setAnchor(null);
            else measureTrigger(triggerRef, setAnchor);
          }}
          style={({ pressed }) => [
            styles.select,
            pressed ? styles.selectPressed : null,
          ]}
        >
          <Text numberOfLines={1} style={styles.selectText}>
            {selected}
          </Text>
          <SelectChevron />
        </Pressable>
      </View>
      <OverlayMenu
        anchor={anchor}
        maxHeight={menuHeight}
        onClose={() => setAnchor(null)}
        visible={!!anchor}
      >
        {options.map((opt) => {
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
              <Text style={[styles.menuText, active ? styles.menuTextOn : null]}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </OverlayMenu>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  dialog: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#09090B",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontFamily: fonts.displaySemiBold,
    color: "#FFFFFF",
    fontSize: 18,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(63,63,70,0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnPressed: {
    borderColor: "#71717A",
    backgroundColor: "#18181B",
  },
  body: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  field: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  fieldLabel: {
    fontFamily: fonts.sansMedium,
    color: "#A1A1AA",
    fontSize: 11,
  },
  select: {
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#111111",
    paddingHorizontal: 10,
  },
  selectPressed: {
    borderColor: "rgba(167,139,250,0.5)",
  },
  selectText: {
    flex: 1,
    fontFamily: fonts.sansRegular,
    color: "#E4E4E7",
    fontSize: 12,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(9,9,11,0.6)",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  reset: {
    fontFamily: fonts.sansMedium,
    color: "#FF1E1E",
    fontSize: 12,
  },
  resetPressed: {
    opacity: 0.85,
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
