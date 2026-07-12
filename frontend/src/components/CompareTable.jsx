// CompareTable.jsx — Bảng so sánh các thuật toán trên cùng bản đồ.
//
// Nhận compareRows từ /compare: [{algorithm, found, optimal, stats, tree}] hoặc
// {algorithm, error}. Tô đậm (class .best) ô tốt nhất theo từng tiêu chí.

const COLS = [
  ["Time (ms)", "time_ms"],
  ["Cost", "cost"],
];

const fmt = (v) => (v === undefined || v === null ? "—" : v);

export function CompareTable({ rows, algoInfo }) {
  if (!rows || rows.length === 0) return null;

  // Tìm giá trị tốt nhất (nhỏ nhất) mỗi cột để tô đậm.
  const best = {};
  for (const [, key] of COLS) {
    let min = Infinity;
    for (const r of rows) {
      const v = r.stats?.[key];
      if (typeof v === "number" && v < min) min = v;
    }
    best[key] = min;
  }

  const nameOf = (k) => algoInfo?.[k]?.name || k;

  return (
    <div className="crt-panel p-4">
      <h2 className="crt-label mb-3">◢ Algorithm comparison</h2>
      <div className="max-h-[280px] overflow-auto">
        <table className="compare">
          <thead>
            <tr>
              <th>Algorithm</th>
              {COLS.map(([label]) => (
                <th key={label}>{label}</th>
              ))}
              <th
                className="cursor-help"
                title="Optimal means the path has minimum total cost. BFS/UCS are always optimal; A* is optimal with an admissible heuristic; DFS/Greedy are not guaranteed."
              >
                Optimal
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.algorithm}>
                <td>{nameOf(r.algorithm)}</td>
                {r.error ? (
                  <td colSpan={COLS.length + 1} className="text-left" style={{ color: "var(--color-clyde)" }}>
                    {r.error}
                  </td>
                ) : (
                  <>
                    {COLS.map(([, key]) => {
                      const v = r.stats?.[key];
                      const isBest = typeof v === "number" && v === best[key];
                      return (
                        <td key={key} className={isBest ? "best" : ""}>
                          {fmt(v)}
                        </td>
                      );
                    })}
                    <td style={{ color: r.optimal ? "var(--color-pac)" : "var(--color-clyde)" }}>
                      {r.optimal ? "✓" : "✗"}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
