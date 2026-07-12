// ComparisonView.jsx — So sánh cây duyệt của nhiều thuật toán.
//
// Nhận rows từ /compare (mỗi row có tree + stats). Cây là phần chính vì nó
// cho thấy thuật toán khác nhau ở thứ tự mở node và độ rẽ nhánh.

import { SearchTreePreview } from "./SearchTreePanel";

function QuickStatItem({ label, row, unit, statKey, nameOf }) {
  return (
    <div>
      <div className="crt-label text-[13px]">{label}</div>
      <div className="font-term text-[20px]" style={{ color: "var(--color-pac)" }}>
        {nameOf(row)} ({row.stats[statKey]}{unit})
      </div>
    </div>
  );
}

function QuickStats({ rows, algoInfo }) {
  const valid = rows.filter((r) => !r.error && r.stats);
  if (!valid.length) return null;
  const nameOf = (r) => algoInfo?.[r.algorithm]?.name || r.algorithm;
  const minBy = (key) =>
    valid.reduce((a, b) => ((b.stats[key] ?? Infinity) < (a.stats[key] ?? Infinity) ? b : a));

  const fastest = minBy("time_ms");
  const efficient = minBy("nodes_expanded");

  return (
    <div className="crt-panel p-4 flex flex-col gap-3">
      <h2 className="crt-label">◢ Quick Stats</h2>
      <QuickStatItem label="Fastest" row={fastest} unit="ms" statKey="time_ms" nameOf={nameOf} />
      <QuickStatItem label="Fewest nodes" row={efficient} unit=" nodes" statKey="nodes_expanded" nameOf={nameOf} />
    </div>
  );
}

export function ComparisonView({ rows, algoInfo, problem, treeStep }) {
  if (!rows || rows.length === 0) return null;

  const cols = rows.length <= 1 ? "grid-cols-1" : "grid-cols-1 2xl:grid-cols-2";
  const nameOf = (row) => algoInfo?.[row.algorithm]?.name || row.algorithm;
  const statLine = (row) => {
    const s = row.stats || {};
    return `expanded ${s.nodes_expanded ?? "—"} · path ${s.path_length ?? "—"} · cost ${s.cost ?? "—"} · ${s.time_ms ?? "—"}ms`;
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_240px] items-start">
      <div>
        <h2 className="crt-label mb-3">◢ Search tree comparison ({rows.length} algorithms)</h2>
        <div className={`grid gap-3 ${cols}`}>
          {rows.map((r) => (
            <SearchTreePreview
              key={r.algorithm}
              tree={r.tree}
              title={nameOf(r)}
              subtitle={r.error ? r.error : statLine(r)}
              treeMeta={{ truncated: !!r.tree_truncated, limit: r.tree_limit || 0 }}
              problem={problem}
              step={treeStep}
            />
          ))}
        </div>
      </div>
      <QuickStats rows={rows} algoInfo={algoInfo} />
    </div>
  );
}
