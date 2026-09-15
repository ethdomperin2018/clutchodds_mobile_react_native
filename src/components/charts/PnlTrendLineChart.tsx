import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, Line, Path, Text as SvgText } from "react-native-svg";

export type PnlChartPoint = {
  index: number;
  cumulative: number;
};

/** Same tokens as web `lib/charts/pnlChartTheme`. */
const PNL_CHART = {
  lineColor: "rgb(16, 185, 129)",
  gridStroke: "rgba(255,255,255,0.12)",
  axisStroke: "rgba(255,255,255,0.2)",
  tickFill: "#71717a",
  tickFontSize: 11,
} as const;

/** Same margins as web Recharts `LineChart` (bottom padded for tick labels). */
const MARGIN = { top: 8, right: 12, left: 0, bottom: 22 } as const;
const Y_AXIS_WIDTH = 50;

/** Web default `PNL_CHART.heightClass` = `h-40` (160). */
export const PNL_CHART_DEFAULT_HEIGHT = 160;

type PnlTrendLineChartProps = {
  data: PnlChartPoint[];
  height?: number;
};

function niceScale(
  min: number,
  max: number,
  tickCount: number
): { domainMin: number; domainMax: number; ticks: number[] } {
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return { domainMin: 0, domainMax: 1, ticks: [0, 1] };
  }
  if (min === max) {
    const pad = Math.max(Math.abs(min) * 0.1, 1);
    min -= pad;
    max += pad;
  }

  const span = max - min;
  const rawStep = span / Math.max(tickCount - 1, 1);
  const mag = 10 ** Math.floor(Math.log10(Math.max(rawStep, 1e-6)));
  const norm = rawStep / mag;
  const niceNorm = norm <= 1.5 ? 1 : norm <= 3 ? 2 : norm <= 7 ? 5 : 10;
  const step = niceNorm * mag;

  const domainMin = Math.floor(min / step) * step;
  const domainMax = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = domainMin; v <= domainMax + step * 0.5; v += step) {
    ticks.push(Number(v.toFixed(6)));
  }
  return { domainMin, domainMax, ticks };
}

/**
 * X ticks like Recharts numeric axis: integer steps, endpoints included,
 * thinned so labels don't collide.
 */
function xAxisTicks(min: number, max: number, maxTicks: number): number[] {
  const lo = Math.round(min);
  const hi = Math.round(max);
  if (lo === hi) return [lo];

  const span = hi - lo;
  const budget = Math.max(2, maxTicks);
  if (span + 1 <= budget) {
    return Array.from({ length: span + 1 }, (_, i) => lo + i);
  }

  let step = Math.ceil(span / (budget - 1));
  const mag = 10 ** Math.floor(Math.log10(Math.max(step, 1)));
  step = ([1, 2, 5, 10].map((n) => n * mag).find((c) => c >= step) ?? step);

  const ticks: number[] = [lo];
  for (let v = lo + step; v < hi; v += step) {
    ticks.push(v);
  }
  if (ticks[ticks.length - 1] !== hi) ticks.push(hi);
  return ticks;
}

/** Monotone cubic Hermite — same family as Recharts `type="monotone"`. */
function monotonePath(coords: Array<{ x: number; y: number }>): string {
  const n = coords.length;
  if (n === 0) return "";
  if (n === 1) return `M${coords[0]!.x} ${coords[0]!.y}`;
  if (n === 2) {
    return `M${coords[0]!.x} ${coords[0]!.y}L${coords[1]!.x} ${coords[1]!.y}`;
  }

  const dx: number[] = [];
  const dy: number[] = [];
  const m: number[] = [];

  for (let i = 0; i < n - 1; i++) {
    const h = coords[i + 1]!.x - coords[i]!.x;
    dx.push(h);
    dy.push((coords[i + 1]!.y - coords[i]!.y) / (h || 1));
  }

  m.push(dy[0]!);
  for (let i = 1; i < n - 1; i++) {
    if (dy[i - 1]! * dy[i]! <= 0) {
      m.push(0);
    } else {
      const w1 = 2 * dx[i]! + dx[i - 1]!;
      const w2 = dx[i]! + 2 * dx[i - 1]!;
      m.push(
        w1 + w2 > 0 ? (w1 + w2) / (w1 / dy[i - 1]! + w2 / dy[i]!) : 0
      );
    }
  }
  m.push(dy[n - 2]!);

  let d = `M${coords[0]!.x} ${coords[0]!.y}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = coords[i]!;
    const p1 = coords[i + 1]!;
    const h = dx[i]!;
    const x1 = p0.x + h / 3;
    const y1 = p0.y + (m[i]! * h) / 3;
    const x2 = p1.x - h / 3;
    const y2 = p1.y - (m[i + 1]! * h) / 3;
    d += `C${x1} ${y1} ${x2} ${y2} ${p1.x} ${p1.y}`;
  }
  return d;
}

function xToPixel(
  index: number,
  xMin: number,
  xSpan: number,
  plotLeft: number,
  plotW: number,
  single: boolean
): number {
  if (single) return plotLeft + plotW / 2;
  return plotLeft + ((index - xMin) / xSpan) * plotW;
}

/**
 * Dashboard / My Bets P/L chart — matches web Recharts `PnlTrendLineChart`.
 */
export function PnlTrendLineChart({
  data,
  height = PNL_CHART_DEFAULT_HEIGHT,
}: PnlTrendLineChartProps) {
  const [width, setWidth] = useState(0);

  const chart = useMemo(() => {
    if (data.length === 0 || width <= 0) return null;

    const single = data.length === 1;
    const points = data;

    const plotLeft = MARGIN.left + Y_AXIS_WIDTH;
    const plotRight = width - MARGIN.right;
    const plotTop = MARGIN.top;
    const plotBottom = height - MARGIN.bottom;
    const plotW = Math.max(plotRight - plotLeft, 1);
    const plotH = Math.max(plotBottom - plotTop, 1);

    const yTickCount = Math.max(2, Math.min(5, Math.floor(plotH / 28) + 1));
    const yValues = points.map((p) => p.cumulative);
    const { domainMin, domainMax, ticks: yTicks } = niceScale(
      Math.min(...yValues),
      Math.max(...yValues),
      yTickCount
    );
    const ySpan = domainMax - domainMin || 1;

    const xMin = points[0]!.index;
    const xMax = points[points.length - 1]!.index;
    const xSpan = Math.max(xMax - xMin, 1);
    // ~28px per label keeps bet numbers from colliding.
    const maxXTicks = Math.max(2, Math.floor(plotW / 28));
    const xTicks = single
      ? [xMin]
      : xAxisTicks(xMin, xMax, maxXTicks);

    const coords = points.map((point) => ({
      x: xToPixel(point.index, xMin, xSpan, plotLeft, plotW, single),
      y: plotTop + (1 - (point.cumulative - domainMin) / ySpan) * plotH,
      index: point.index,
    }));

    const pathCoords =
      single && coords[0]
        ? [
            { x: plotLeft, y: coords[0].y },
            { x: plotRight, y: coords[0].y },
          ]
        : coords;

    return {
      plotLeft,
      plotRight,
      plotTop,
      plotBottom,
      plotH,
      domainMin,
      domainMax,
      yTicks,
      xTicks,
      xMin,
      xSpan,
      single,
      coords,
      path: monotonePath(pathCoords),
    };
  }, [data, height, width]);

  return (
    <View
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={[styles.root, { height }]}
    >
      {chart ? (
        <Svg height={height} width={width}>
          {chart.yTicks.map((tick) => {
            const y =
              chart.plotTop +
              (1 -
                (tick - chart.domainMin) /
                  (chart.domainMax - chart.domainMin || 1)) *
                chart.plotH;
            return (
              <Line
                key={`hgrid-${tick}`}
                x1={chart.plotLeft}
                x2={chart.plotRight}
                y1={y}
                y2={y}
                stroke={PNL_CHART.gridStroke}
                strokeDasharray="3 5"
                strokeWidth={1}
              />
            );
          })}

          {chart.xTicks.map((tick) => {
            const x = xToPixel(
              tick,
              chart.xMin,
              chart.xSpan,
              chart.plotLeft,
              chart.plotRight - chart.plotLeft,
              chart.single
            );
            return (
              <Line
                key={`vgrid-${tick}`}
                x1={x}
                x2={x}
                y1={chart.plotTop}
                y2={chart.plotBottom}
                stroke={PNL_CHART.gridStroke}
                strokeDasharray="3 5"
                strokeWidth={1}
              />
            );
          })}

          <Line
            x1={chart.plotLeft}
            x2={chart.plotLeft}
            y1={chart.plotTop}
            y2={chart.plotBottom}
            stroke={PNL_CHART.axisStroke}
            strokeWidth={1}
          />
          <Line
            x1={chart.plotLeft}
            x2={chart.plotRight}
            y1={chart.plotBottom}
            y2={chart.plotBottom}
            stroke={PNL_CHART.axisStroke}
            strokeWidth={1}
          />

          {chart.yTicks.map((tick) => {
            const y =
              chart.plotTop +
              (1 -
                (tick - chart.domainMin) /
                  (chart.domainMax - chart.domainMin || 1)) *
                chart.plotH;
            return (
              <SvgText
                key={`ytick-${tick}`}
                fill={PNL_CHART.tickFill}
                fontSize={PNL_CHART.tickFontSize}
                textAnchor="end"
                x={chart.plotLeft - 6}
                y={y + 4}
              >
                {`$${Number(tick).toFixed(0)}`}
              </SvgText>
            );
          })}

          {chart.xTicks.map((tick, i) => {
            const x = xToPixel(
              tick,
              chart.xMin,
              chart.xSpan,
              chart.plotLeft,
              chart.plotRight - chart.plotLeft,
              chart.single
            );
            const isFirst = i === 0;
            const isLast = i === chart.xTicks.length - 1;
            return (
              <SvgText
                key={`xtick-${tick}`}
                fill={PNL_CHART.tickFill}
                fontSize={PNL_CHART.tickFontSize}
                textAnchor={
                  isFirst && !chart.single
                    ? "start"
                    : isLast && !chart.single
                      ? "end"
                      : "middle"
                }
                x={x}
                y={chart.plotBottom + 14}
              >
                {String(tick)}
              </SvgText>
            );
          })}

          <Path
            d={chart.path}
            fill="none"
            stroke={PNL_CHART.lineColor}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
          />

          {chart.coords.map((point) => (
            <Circle
              key={`dot-${point.index}`}
              cx={point.x}
              cy={point.y}
              fill={PNL_CHART.lineColor}
              r={2}
            />
          ))}
        </Svg>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginTop: 8,
    width: "100%",
  },
});
