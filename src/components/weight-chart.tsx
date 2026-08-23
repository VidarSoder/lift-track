import { formatChartDate } from "@/lib/dates";

export type TrendPoint = { date: string; value: number };

type TrendChartProps = {
  points: TrendPoint[];
  unit: string;
  className?: string;
  strokeClass?: string;
  fillClass?: string;
  decimals?: number;
};

export function TrendChart({
  points,
  unit,
  className,
  strokeClass = "stroke-primary",
  fillClass = "fill-primary/15",
  decimals = 1,
}: TrendChartProps) {
  const series = [...points].sort((a, b) => a.date.localeCompare(b.date));
  if (series.length === 0) return null;

  const width = 320;
  const height = 168;
  const left = 40;
  const right = 12;
  const top = 18;
  const bottom = 28;
  const plotW = width - left - right;
  const plotH = height - top - bottom;
  const values = series.map((item) => item.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = Math.max(decimals === 0 ? 1 : 0.3, (max - min) * 0.18);
  const low = min - pad;
  const high = max + pad;
  const span = high - low;
  const step = series.length === 1 ? 0 : plotW / (series.length - 1);

  const coords = series.map((item, index) => {
    const x = left + index * step;
    const y = top + ((high - item.value) / span) * plotH;
    return { ...item, x, y };
  });

  const line = coords.map((point) => `${point.x},${point.y}`).join(" ");
  const area = `${left},${top + plotH} ${line} ${coords[coords.length - 1].x},${top + plotH}`;
  const last = coords[coords.length - 1];
  const first = coords[0];
  const fmt = (value: number) => value.toFixed(decimals);

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-40 w-full"
        role="img"
        aria-label={`${unit} from ${fmt(first.value)} to ${fmt(last.value)}`}
      >
        <line
          x1={left}
          x2={width - right}
          y1={top}
          y2={top}
          className="stroke-border"
          strokeWidth="1"
        />
        <line
          x1={left}
          x2={width - right}
          y1={top + plotH / 2}
          y2={top + plotH / 2}
          className="stroke-border"
          strokeDasharray="3 4"
          strokeWidth="1"
        />
        <line
          x1={left}
          x2={width - right}
          y1={top + plotH}
          y2={top + plotH}
          className="stroke-border"
          strokeWidth="1"
        />
        <polygon points={area} className={fillClass} />
        {coords.length > 1 ? (
          <polyline
            points={line}
            fill="none"
            className={strokeClass}
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ) : null}
        {coords.map((point) => (
          <circle
            key={point.date}
            cx={point.x}
            cy={point.y}
            r={coords.length > 12 ? 2.5 : 3.5}
            className={strokeClass.replace("stroke-", "fill-")}
          />
        ))}
        <text
          x={4}
          y={top + 4}
          className="fill-muted-foreground"
          fontSize="10"
        >
          {fmt(max)}
        </text>
        <text
          x={4}
          y={top + plotH}
          className="fill-muted-foreground"
          fontSize="10"
        >
          {fmt(min)}
        </text>
        <text
          x={first.x}
          y={height - 8}
          className="fill-muted-foreground"
          fontSize="10"
        >
          {formatChartDate(first.date)}
        </text>
        {coords.length > 1 ? (
          <text
            x={last.x}
            y={height - 8}
            textAnchor="end"
            className="fill-muted-foreground"
            fontSize="10"
          >
            {formatChartDate(last.date)}
          </text>
        ) : null}
        <text
          x={Math.min(last.x + 6, width - 8)}
          y={last.y - 8}
          textAnchor={last.x > width * 0.7 ? "end" : "start"}
          className="fill-foreground"
          fontSize="11"
          fontWeight="600"
        >
          {fmt(last.value)}
        </text>
      </svg>
    </div>
  );
}

import { bmiForKg } from "@/lib/bmi";

type WeightEntry = { date: string; kg: number };
type BmiEntry = { date: string; bmi: number };

export function WeightChart({
  entries,
  className,
}: {
  entries: WeightEntry[];
  className?: string;
}) {
  return (
    <TrendChart
      className={className}
      unit="kilograms"
      points={entries.map((item) => ({ date: item.date, value: item.kg }))}
      decimals={1}
    />
  );
}

export function BmiChart({
  entries,
  className,
}: {
  entries: BmiEntry[];
  className?: string;
}) {
  return (
    <TrendChart
      className={className}
      unit="BMI"
      points={entries.map((item) => ({
        date: item.date,
        value: item.bmi,
      }))}
      strokeClass="stroke-chart-2"
      fillClass="fill-chart-2/15"
      decimals={1}
    />
  );
}

/** Build BMI series from weigh-ins (one point per saved weight). */
export function bmiChartEntries(entries: WeightEntry[]) {
  return entries.map((item) => ({
    date: item.date,
    bmi: bmiForKg(item.kg),
  }));
}
