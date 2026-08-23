import { formatChartDate } from "@/lib/dates";

type Point = { date: string; kg: number };

export function WeightChart({
  entries,
  className,
}: {
  entries: Point[];
  className?: string;
}) {
  const series = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  if (series.length === 0) return null;

  const width = 320;
  const height = 168;
  const left = 40;
  const right = 12;
  const top = 18;
  const bottom = 28;
  const plotW = width - left - right;
  const plotH = height - top - bottom;
  const values = series.map((item) => item.kg);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = Math.max(0.3, (max - min) * 0.18);
  const low = min - pad;
  const high = max + pad;
  const span = high - low;
  const step = series.length === 1 ? 0 : plotW / (series.length - 1);

  const coords = series.map((item, index) => {
    const x = left + index * step;
    const y = top + ((high - item.kg) / span) * plotH;
    return { ...item, x, y };
  });

  const line = coords.map((point) => `${point.x},${point.y}`).join(" ");
  const area = `${left},${top + plotH} ${line} ${coords[coords.length - 1].x},${top + plotH}`;
  const last = coords[coords.length - 1];
  const first = coords[0];

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-40 w-full"
        role="img"
        aria-label={`Body weight from ${first.kg.toFixed(1)} to ${last.kg.toFixed(1)} kilograms`}
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
        <polygon points={area} className="fill-primary/15" />
        {coords.length > 1 ? (
          <polyline
            points={line}
            fill="none"
            className="stroke-primary"
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
            className="fill-primary"
          />
        ))}
        <text
          x={4}
          y={top + 4}
          className="fill-muted-foreground"
          fontSize="10"
        >
          {max.toFixed(1)}
        </text>
        <text
          x={4}
          y={top + plotH}
          className="fill-muted-foreground"
          fontSize="10"
        >
          {min.toFixed(1)}
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
          {last.kg.toFixed(1)}
        </text>
      </svg>
    </div>
  );
}
