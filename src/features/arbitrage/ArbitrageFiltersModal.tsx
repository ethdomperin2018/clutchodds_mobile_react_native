import { useRef, useState, type ReactNode, type RefObject } from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { BookLogo } from "@/components/BookLogo";
import type { ArbitrageSidebarFilters } from "@/features/arbitrage/useArbitrageBoard";
import {
  MAX_LINE_AGE_GAP_OPTIONS,
  MIN_ROI_FILTER_OPTIONS,
  TIME_RANGE_OPTIONS,
} from "@/features/arbitrage/useArbitrageBoard";
import { getBookDisplayName, TRACKED_BOOKMAKER_KEYS } from "@/lib/bookmakerDisplay";
import { normalizeBookKey } from "@/lib/odds/filterArbs";
import { fonts } from "@/theme/typography";

type MenuAnchor = { x: number; y: number; width: number; height: number };

export function ArbitrageFiltersModal({
  open,
  filters,
  selectedBooks,
  onChangeFilters,
  onToggleBook,
  onSelectAllBooks,
  onClearAllBooks,
  onReset,
  onClose,
}: {
  open: boolean;
  filters: ArbitrageSidebarFilters;
  selectedBooks: ReadonlySet<string>;
  onChangeFilters: (next: ArbitrageSidebarFilters) => void;
  onToggleBook: (bookKey: string) => void;
  onSelectAllBooks: () => void;
  onClearAllBooks: () => void;
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
            <View style={styles.grid}>
              <View style={styles.row}>
                <FilterSelect
                  label="Time Range"
                  onChange={(value) =>
                    onChangeFilters({
                      ...filters,
                      timeRange: value as ArbitrageSidebarFilters["timeRange"],
                    })
                  }
                  options={TIME_RANGE_OPTIONS.map((option) => ({
                    value: option.value,
                    label: option.label,
                  }))}
                  value={filters.timeRange}
                />
                <FilterSelect
                  label="Max Line Age Gap"
                  onChange={(value) =>
                    onChangeFilters({ ...filters, maxLineAgeGapMin: value })
                  }
                  options={MAX_LINE_AGE_GAP_OPTIONS.map((value) => ({
                    value,
                    label: value === "all" ? "All" : `${value} min`,
                  }))}
                  value={filters.maxLineAgeGapMin}
                />
              </View>
              <View style={styles.row}>
                <FilterSelect
                  label="Minimum ROI"
                  onChange={(value) =>
                    onChangeFilters({ ...filters, minRoi: value })
                  }
                  options={MIN_ROI_FILTER_OPTIONS.map((value) => ({
                    value,
                    label: `${value}%`,
                  }))}
                  value={filters.minRoi}
                />
                <BookMultiSelect
                  onClearAllBooks={onClearAllBooks}
                  onSelectAllBooks={onSelectAllBooks}
                  onToggleBook={onToggleBook}
                  selectedBooks={selectedBooks}
                />
              </View>
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
  width,
  maxHeight,
  children,
  onClose,
}: {
  visible: boolean;
  anchor: MenuAnchor | null;
  width?: number;
  maxHeight: number;
  children: ReactNode;
  onClose: () => void;
}) {
  if (!visible || !anchor) return null;
  const top = menuTop(anchor, maxHeight);
  const left = Math.max(8, anchor.x);
  const menuWidth = width ?? anchor.width;

  return (
    <Modal animationType="none" onRequestClose={onClose} transparent visible>
      <View style={styles.menuLayer}>
        <Pressable onPress={onClose} style={styles.menuDismiss} />
        <View style={[styles.menu, { top, left, width: menuWidth, maxHeight }]}>
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

function BookMultiSelect({
  selectedBooks,
  onToggleBook,
  onSelectAllBooks,
  onClearAllBooks,
}: {
  selectedBooks: ReadonlySet<string>;
  onToggleBook: (bookKey: string) => void;
  onSelectAllBooks: () => void;
  onClearAllBooks: () => void;
}) {
  const triggerRef = useRef<View>(null);
  const [anchor, setAnchor] = useState<MenuAnchor | null>(null);
  const singleBook = selectedBooks.size === 1 ? [...selectedBooks][0]! : null;
  const booksLabel =
    selectedBooks.size === 0
      ? "All Books"
      : selectedBooks.size === 1
        ? getBookDisplayName(singleBook!)
        : `${selectedBooks.size} selected`;

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>Books</Text>
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
          <View style={styles.bookTrigger}>
            {singleBook ? (
              <BookLogo bookKey={singleBook} bookTitle={booksLabel} size={18} />
            ) : null}
            <Text numberOfLines={1} style={styles.selectText}>
              {booksLabel}
            </Text>
          </View>
          <SelectChevron />
        </Pressable>
      </View>
      <OverlayMenu
        anchor={anchor}
        maxHeight={224}
        onClose={() => setAnchor(null)}
        visible={!!anchor}
      >
        <ScrollView nestedScrollEnabled style={styles.bookList}>
          {TRACKED_BOOKMAKER_KEYS.map((key) => {
            const active = selectedBooks.has(normalizeBookKey(key));
            const title = getBookDisplayName(key);
            return (
              <Pressable
                key={key}
                onPress={() => onToggleBook(normalizeBookKey(key))}
                style={[styles.bookItem, active ? styles.menuItemOn : null]}
              >
                <BookLogo bookKey={key} bookTitle={title} size={20} />
                <Text
                  numberOfLines={1}
                  style={[styles.bookItemText, active ? styles.menuTextOn : null]}
                >
                  {title}
                </Text>
                {active ? <CheckIcon /> : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </OverlayMenu>
      <View style={styles.bookActions}>
        <Pressable onPress={onSelectAllBooks}>
          <Text style={styles.bookAction}>Select all</Text>
        </Pressable>
        <Pressable onPress={onClearAllBooks}>
          <Text style={styles.bookAction}>Clear all</Text>
        </Pressable>
      </View>
    </View>
  );
}

function CheckIcon() {
  return (
    <Svg fill="#34D399" height={14} viewBox="0 0 20 20" width={14}>
      <Path
        clipRule="evenodd"
        d="M16.704 5.29a1 1 0 010 1.42l-7.25 7.25a1 1 0 01-1.42 0l-3.25-3.25a1 1 0 111.42-1.42l2.54 2.54 6.54-6.54a1 1 0 011.42 0z"
        fillRule="evenodd"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 32,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  dialog: {
    width: "100%",
    maxWidth: 576,
    alignSelf: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#09090B",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 16 },
    elevation: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(9,9,11,0.8)",
  },
  title: {
    fontFamily: fonts.displaySemiBold,
    color: "#FFFFFF",
    fontSize: 18,
    lineHeight: 22,
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
  grid: {
    gap: 14,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  field: {
    flex: 1,
    minWidth: 0,
  },
  fieldLabel: {
    fontFamily: fonts.sansSemiBold,
    color: "#71717A",
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 0.25,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  select: {
    height: 36,
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
    borderColor: "#52525B",
  },
  selectText: {
    flex: 1,
    fontFamily: fonts.sansRegular,
    color: "#E4E4E7",
    fontSize: 12,
    lineHeight: 16,
  },
  bookTrigger: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 0,
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
    backgroundColor: "rgba(2,44,34,0.4)",
  },
  menuText: {
    fontFamily: fonts.sansRegular,
    color: "#D4D4D8",
    fontSize: 12,
  },
  menuTextOn: {
    color: "#A7F3D0",
  },
  bookList: {
    maxHeight: 224,
  },
  bookItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  bookItemText: {
    flex: 1,
    fontFamily: fonts.sansRegular,
    color: "#D4D4D8",
    fontSize: 12,
  },
  bookActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 6,
  },
  bookAction: {
    fontFamily: fonts.sansMedium,
    color: "#71717A",
    fontSize: 10,
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
});
