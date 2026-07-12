// FghChart.jsx — So sánh một metric f/g/h theo thứ tự mở rộng node.

import { useState } from "react";
import { buildFghSeries } from "./fghSeries";

const W = 520;
const H = 220;
const PAD = { l: 40, r: 12, t: 16, b: 28 };
const COLORS = ["#ffe600", "#00ffff", "#ffb852", "#ff6b8a", "#9dff6b"];

const sx = (i, n) => PAD.l + (n > 1 ? (i / (n - 1)) * (W - PAD.l - PAD.r) : (W - PAD.l - PAD.r) / 2);
const sy = (v, max) => {
  const h = H - PAD.t - PAD.b;
  return PAD.t + h - (max ? (v / max) * h : 0);
};

export function FghChart({ rows, algoInfo }) {
  const [metric, setMetric] = useState("f");
  const nameOf = (key) => algoInfo?.[key]?.name || key;
  const series = buildFghSeries(rows, metric, nameOf);

  if (!series.length) return null;

  const maxOrder = Math.max(...series.flatMap((s) => s.orders)) + 1;
  const maxValue = Math.max(1, ...series.flatMap((s) => s.values));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(maxValue * t));
  const line = (s) => s.values
    .map((value, i) => `${i === 0 ? "M" : "L"}${sx(s.orders[i], maxOrder)},${sy(value, maxValue)}`)
    .join(" ");
  const truncated = series.filter((s) => s.truncated);
  const limit = Math.max(0, ...truncated.map((s) => s.limit));

  return (
    <div className="crt-panel p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <h2 className="crt-label">◢ F / G / H by node expansion order</h2>
        <div className="flex gap-2" aria-label="Select metric">
          {["f", "g", "h"].map((key) => (
            <button
              key={key}
              type="button"
              className={`arcade-btn px-3 py-1 ${metric === key ? "btn-step" : "btn-mode-off"}`}
              aria-pressed={metric === key}
              onClick={() => setMetric(key)}
            >
              {key.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {ticks.map((value, i) => {
          const y = sy(value, maxValue);
          return (
            <g key={i}>
              <line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y} stroke="rgba(255,176,0,0.1)" />
              <text x={PAD.l - 6} y={y + 4} textAnchor="end" fill="var(--color-amber-dim)" fontSize="10">{value}</text>
            </g>
          );
        })}
        {series.map((s, i) => (
          <path key={s.algorithm} d={line(s)} fill="none" stroke={COLORS[i % COLORS.length]} strokeWidth="2" />
        ))}
        <text x={PAD.l} y={H - 8} fill="var(--color-amber-dim)" fontSize="10">Expansion #1</text>
        <text x={W - PAD.r} y={H - 8} textAnchor="end" fill="var(--color-amber-dim)" fontSize="10">#{maxOrder}</text>
      </svg>

      <div className="crt-label text-[12px] flex flex-wrap gap-4 mt-1 normal-case">
        {series.map((s, i) => (
          <span key={s.algorithm} style={{ color: COLORS[i % COLORS.length] }}>● {s.name}</span>
        ))}
      </div>
      {truncated.length > 0 && (
        <p className="crt-label text-[12px] mt-2 normal-case">
          Tree limited to {limit || 250} nodes; the chart shows only the recorded portion.
        </p>
      )}
    </div>
  );
}
