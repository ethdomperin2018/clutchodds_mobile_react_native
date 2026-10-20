import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import {
  formatPredictionRecord,
  formatSlateButton,
  formatWinRate,
  predictionSlateToday,
  slateDateFromUtcParts,
  type PredictionHistoryRecord,
} from "@/lib/predictions/history";
import { fonts } from "@/theme/typography";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

export function PredictionDateCard({
  date,
  today,
  earliest,
  loading,
  record,
  onChange,
  onStep,
}: {
  date: string;
  today: string;
  earliest?: string | null;
  loading: boolean;
  record: PredictionHistoryRecord;
  onChange: (date: string) => void;
  onStep: (days: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const canStepForward = date < today;
  const canStepBack = !earliest || date > earliest;

  return (
    <View style={styles.card}>
      <View style={styles.controls}>
        <Pressable
          accessibilityLabel="Previous day"
          disabled={!canStepBack}
          onPress={() => onStep(-1)}
          style={[styles.cardStepBtn, !canStepBack ? styles.stepBtnDisabled : null]}
        >
          <Ionicons color="#D4D4D8" name="chevron-back" size={14} />
        </Pressable>
        <Pressable
          accessibilityLabel="Prediction date"
          onPress={() => setOpen(true)}
          style={styles.dateBtn}
        >
          <Text numberOfLines={1} style={styles.dateBtnText}>
            {formatSlateButton(date)}
          </Text>
        </Pressable>
        <Pressable
          accessibilityLabel="Next day"
          disabled={!canStepForward}
          onPress={() => onStep(1)}
          style={[styles.cardStepBtn, !canStepForward ? styles.stepBtnDisabled : null]}
        >
          <Ionicons color="#D4D4D8" name="chevron-forward" size={14} />
        </Pressable>
      </View>

      <View style={styles.rateCluster}>
        <View style={styles.rateMeta}>
          <Text style={styles.rateLabel}>Win rate</Text>
          <Text style={styles.rateRecord}>
            {loading ? "Loading…" : formatPredictionRecord(record, { date, today })}
          </Text>
        </View>
        <Text style={styles.rateValue}>
          {loading ? "—" : formatWinRate(record.winRate)}
        </Text>
      </View>

      <SlateCalendarModal
        date={date}
        earliest={earliest}
        onClose={() => setOpen(false)}
        onSelect={(next) => {
          onChange(next);
          setOpen(false);
        }}
        open={open}
        today={today}
      />
    </View>
  );
}

function SlateCalendarModal({
  open,
  date,
  today,
  earliest,
  onClose,
  onSelect,
}: {
  open: boolean;
  date: string;
  today: string;
  earliest?: string | null;
  onClose: () => void;
  onSelect: (date: string) => void;
}) {
  const [year, month] = date.split("-").map(Number);
  const [cursor, setCursor] = useState(() => ({
    year,
    monthIndex: month - 1,
  }));

  useEffect(() => {
    if (!open) return;
    const [nextYear, nextMonth] = date.split("-").map(Number);
    setCursor({ year: nextYear, monthIndex: nextMonth - 1 });
  }, [open, date]);

  const cells = useMemo(() => {
    const firstWeekday = new Date(
      Date.UTC(cursor.year, cursor.monthIndex, 1)
    ).getUTCDay();
    const daysInMonth = new Date(
      Date.UTC(cursor.year, cursor.monthIndex + 1, 0)
    ).getUTCDate();
    const slots: Array<string | null> = [
      ...Array.from({ length: firstWeekday }, () => null),
    ];
    for (let day = 1; day <= daysInMonth; day += 1) {
      slots.push(slateDateFromUtcParts(cursor.year, cursor.monthIndex, day));
    }
    return slots;
  }, [cursor]);

  const monthLabel = new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(cursor.year, cursor.monthIndex, 1, 12)));

  const todayParts = today.split("-").map(Number);
  const atCurrentMonth =
    cursor.year > todayParts[0] ||
    (cursor.year === todayParts[0] && cursor.monthIndex >= todayParts[1] - 1);
  const earliestParts = earliest?.split("-").map(Number);
  const atEarliestMonth = earliestParts
    ? cursor.year < earliestParts[0] ||
      (cursor.year === earliestParts[0] &&
        cursor.monthIndex <= earliestParts[1] - 1)
    : false;

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={open}>
      <Pressable onPress={onClose} style={styles.backdrop}>
        <Pressable onPress={() => undefined} style={styles.sheet}>
          <View style={styles.monthRow}>
            <Pressable
              accessibilityLabel="Previous month"
              disabled={atEarliestMonth}
              onPress={() =>
                setCursor((current) => {
                  const date = new Date(Date.UTC(current.year, current.monthIndex - 1, 1));
                  return {
                    year: date.getUTCFullYear(),
                    monthIndex: date.getUTCMonth(),
                  };
                })
              }
              style={[styles.stepBtn, atEarliestMonth ? styles.stepBtnDisabled : null]}
            >
              <Ionicons color="#D4D4D8" name="chevron-back" size={18} />
            </Pressable>
            <Text style={styles.monthLabel}>{monthLabel}</Text>
            <Pressable
              accessibilityLabel="Next month"
              disabled={atCurrentMonth}
              onPress={() =>
                setCursor((current) => {
                  const date = new Date(Date.UTC(current.year, current.monthIndex + 1, 1));
                  return {
                    year: date.getUTCFullYear(),
                    monthIndex: date.getUTCMonth(),
                  };
                })
              }
              style={[styles.stepBtn, atCurrentMonth ? styles.stepBtnDisabled : null]}
            >
              <Ionicons color="#D4D4D8" name="chevron-forward" size={18} />
            </Pressable>
          </View>
          <View style={styles.weekRow}>
            {WEEKDAYS.map((label, index) => (
              <Text key={`${label}-${index}`} style={styles.weekday}>
                {label}
              </Text>
            ))}
          </View>
          <View style={styles.grid}>
            {cells.map((value, index) => {
              if (!value) {
                return <View key={`empty-${index}`} style={styles.dayCell} />;
              }
              const disabled = value > today || Boolean(earliest && value < earliest);
              const selected = value === date;
              return (
                <Pressable
                  key={value}
                  disabled={disabled}
                  onPress={() => onSelect(value)}
                  style={styles.dayCell}
                >
                  <View style={[styles.dayDot, selected ? styles.daySelected : null]}>
                    <Text
                      style={[
                        styles.dayText,
                        disabled ? styles.dayDisabled : null,
                        selected ? styles.daySelectedText : null,
                      ]}
                    >
                      {Number(value.slice(8))}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
          <Pressable
            onPress={() => onSelect(predictionSlateToday())}
            style={styles.todayBtn}
          >
            <Text style={styles.todayBtnText}>Today</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#161616",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 1,
    minWidth: 0,
  },
  cardStepBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#111111",
    alignItems: "center",
    justifyContent: "center",
  },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#111111",
    alignItems: "center",
    justifyContent: "center",
  },
  stepBtnDisabled: {
    opacity: 0.4,
  },
  dateBtn: {
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#111111",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  dateBtnText: {
    textAlign: "center",
    fontFamily: fonts.sansSemiBold,
    color: "#E4E4E7",
    fontSize: 12,
  },
  rateCluster: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },
  rateMeta: {
    alignItems: "flex-end",
  },
  rateLabel: {
    fontFamily: fonts.sansSemiBold,
    color: "#71717A",
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  rateValue: {
    fontFamily: fonts.displayBold,
    color: "#FFFFFF",
    fontSize: 20,
    fontVariant: ["tabular-nums"],
  },
  rateRecord: {
    marginTop: 1,
    fontFamily: fonts.sansRegular,
    color: "#A1A1AA",
    fontSize: 11,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    padding: 20,
  },
  sheet: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#161616",
    padding: 16,
  },
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  monthLabel: {
    flex: 1,
    textAlign: "center",
    fontFamily: fonts.sansSemiBold,
    color: "#FFFFFF",
    fontSize: 16,
  },
  weekRow: {
    marginTop: 12,
    flexDirection: "row",
  },
  weekday: {
    width: "14.285%",
    textAlign: "center",
    fontFamily: fonts.sansSemiBold,
    color: "#71717A",
    fontSize: 11,
  },
  grid: {
    marginTop: 8,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.285%",
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  dayDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  dayText: {
    fontFamily: fonts.sansRegular,
    color: "#E4E4E7",
    fontSize: 14,
  },
  dayDisabled: {
    color: "#3F3F46",
  },
  daySelected: {
    borderRadius: 999,
    backgroundColor: "#7C3AED",
  },
  daySelectedText: {
    color: "#FFFFFF",
    fontFamily: fonts.sansSemiBold,
  },
  todayBtn: {
    marginTop: 8,
    alignSelf: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  todayBtnText: {
    fontFamily: fonts.sansSemiBold,
    color: "#C4B5FD",
    fontSize: 14,
  },
});
