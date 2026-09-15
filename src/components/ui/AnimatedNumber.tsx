import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Text, type StyleProp, type TextStyle } from "react-native";

export type AnimatedNumberFormat =
  | "signed-percent-2"
  | "signed-percent-whole"
  | "percent-round"
  | "percent-2"
  | "currency-2"
  | "integer"
  | "decimal-1";

const DEFAULT_DURATION_MS = 650;

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

export function formatAnimatedNumber(
  value: number,
  format: AnimatedNumberFormat
): string {
  switch (format) {
    case "signed-percent-2": {
      const sign = value >= 0 ? "+" : "";
      return `${sign}${value.toFixed(2)}%`;
    }
    case "signed-percent-whole": {
      const rounded = Math.round(value);
      const sign = rounded >= 0 ? "+" : "";
      return `${sign}${rounded}%`;
    }
    case "percent-round":
      return `${Math.round(value)}%`;
    case "percent-2":
      return `${value.toFixed(2)}%`;
    case "currency-2": {
      const abs = Math.abs(value).toFixed(2);
      return value < 0 ? `-$${abs}` : `$${abs}`;
    }
    case "integer":
      return `${Math.round(value)}`;
    case "decimal-1":
      return value.toFixed(1);
  }
}

export function useAnimatedNumber(
  target: number,
  {
    durationMs = DEFAULT_DURATION_MS,
    delayMs = 0,
    enabled = true,
    resetKey,
  }: {
    durationMs?: number;
    delayMs?: number;
    enabled?: boolean;
    /** When this changes, the count restarts from zero. */
    resetKey?: unknown;
  } = {}
): number {
  const [display, setDisplay] = useState(enabled ? 0 : target);
  const [reduceMotion, setReduceMotion] = useState(false);
  const displayRef = useRef(display);
  const resetKeyRef = useRef(resetKey);

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabledMotion) => {
      if (mounted) setReduceMotion(enabledMotion);
    });
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion
    );
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  useEffect(() => {
    displayRef.current = display;
  }, [display]);

  useEffect(() => {
    if (!Number.isFinite(target)) {
      setDisplay(target);
      displayRef.current = target;
      return;
    }

    if (!enabled || reduceMotion) {
      setDisplay(target);
      displayRef.current = target;
      return;
    }

    const restart = resetKey !== resetKeyRef.current;
    if (restart) {
      resetKeyRef.current = resetKey;
    }

    const from = restart ? 0 : displayRef.current;
    let raf = 0;
    let delayTimeout: ReturnType<typeof setTimeout> | undefined;

    const run = () => {
      const start = Date.now();

      const tick = () => {
        const elapsed = Date.now() - start;
        const t = Math.min(1, elapsed / durationMs);
        const next = from + (target - from) * easeOutCubic(t);
        displayRef.current = next;
        setDisplay(next);
        if (t < 1) {
          raf = requestAnimationFrame(tick);
        } else {
          displayRef.current = target;
          setDisplay(target);
        }
      };

      raf = requestAnimationFrame(tick);
    };

    if (delayMs > 0) {
      delayTimeout = setTimeout(run, delayMs);
    } else {
      run();
    }

    return () => {
      if (delayTimeout) clearTimeout(delayTimeout);
      cancelAnimationFrame(raf);
    };
  }, [target, durationMs, delayMs, enabled, resetKey, reduceMotion]);

  return display;
}

export function AnimatedNumber({
  value,
  format,
  style,
  durationMs,
  delayMs,
  enabled = true,
  resetKey,
}: {
  value: number;
  format: AnimatedNumberFormat;
  style?: StyleProp<TextStyle>;
  durationMs?: number;
  delayMs?: number;
  enabled?: boolean;
  resetKey?: unknown;
}) {
  const display = useAnimatedNumber(value, {
    durationMs,
    delayMs,
    enabled,
    resetKey,
  });

  return (
    <Text style={style}>{formatAnimatedNumber(display, format)}</Text>
  );
}
