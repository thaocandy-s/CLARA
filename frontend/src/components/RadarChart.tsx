import { useMemo } from "react";
import type { RadarAxis } from "../types";

interface RadarChartProps {
  axes: RadarAxis[];
  size?: number;
}

const RadarChart = ({ axes, size = 260 }: RadarChartProps) => {
  const svg = useMemo(() => {
    const center = size / 2;
    const radius = size * 0.3;
    const totalAxes = axes.length;
    const angleSlice = (Math.PI * 2) / totalAxes;
    const levels = [0.33, 0.66, 1.0];

    const pointAt = (r: number, i: number) => {
      const angle = i * angleSlice - Math.PI / 2;
      return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle), angle };
    };

    const gridPolygons = levels.map((level, li) => {
      const pts = axes.map((_, i) => {
        const { x, y } = pointAt(radius * level, i);
        return `${x},${y}`;
      });
      return (
        <polygon
          key={li}
          points={pts.join(" ")}
          fill="none"
          stroke="var(--clara-chart-grid)"
          strokeWidth={1}
        />
      );
    });

    const axisLines = axes.map((_, i) => {
      const { x, y } = pointAt(radius, i);
      return (
        <line
          key={i}
          x1={center}
          y1={center}
          x2={x}
          y2={y}
          stroke="var(--clara-chart-axis)"
          strokeWidth={1}
        />
      );
    });

    const labels = axes.map((axis, i) => {
      const labelR = radius + 14;
      const { x, y, angle } = pointAt(labelR, i);
      let anchor: "middle" | "start" | "end" = "middle";
      if (Math.cos(angle) > 0.3) anchor = "start";
      else if (Math.cos(angle) < -0.3) anchor = "end";

      const words = axis.label.split(" ");
      const lines =
        words.length > 1
          ? [words.slice(0, Math.ceil(words.length / 2)).join(" "), words.slice(Math.ceil(words.length / 2)).join(" ")]
          : [axis.label];
      const startY = y + 4 - ((lines.length - 1) * 5.5) / 2;

      return (
        <text
          key={axis.key}
          x={x}
          y={startY}
          textAnchor={anchor}
          fill="var(--clara-text-secondary)"
          fontSize={9}
          fontFamily="'Plus Jakarta Sans', sans-serif"
          fontWeight={600}
          style={{ cursor: "default" }}
        >
          <title>{axis.label}</title>
          {lines.map((line, li) => (
            <tspan key={li} x={x} dy={li === 0 ? 0 : "1.1em"}>
              {line}
            </tspan>
          ))}
        </text>
      );
    });

    const dataPoints = axes.map((axis, i) => {
      const score = axis.value / 100;
      return pointAt(radius * score, i);
    });

    const polygonPoints = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

    return (
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${size} ${size}`}
        style={{ overflow: "visible" }}
      >
        <defs>
          <linearGradient id="radarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e11d48" stopOpacity={0.45} />
            <stop offset="60%" stopColor="#db2777" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.15} />
          </linearGradient>
        </defs>
        {gridPolygons}
        {axisLines}
        <polygon points={polygonPoints} fill="url(#radarGrad)" stroke="#e11d48" strokeWidth={2.5} />
        {dataPoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3.5} fill="var(--clara-bg-secondary)" stroke="#e11d48" strokeWidth={2} />
        ))}
        {labels}
      </svg>
    );
  }, [axes, size]);

  return svg;
};

export default RadarChart;
