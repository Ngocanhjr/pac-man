// StatsPanel.jsx — Bảng số liệu phosphor amber (đọc như terminal CRT).
//algorithm metrics

// [nhãn, key, chú thích (hover)] — chú thích giúp người xem hiểu ý nghĩa số liệu.
const ROWS = [
  // ["Expanded nodes", "nodes_expanded", "Nodes removed from the frontier for expansion"],
  // ["Generated nodes", "nodes_generated", "Child nodes generated during search"],
  // ["Maximum frontier", "max_frontier", "Largest open-list size — a space-complexity indicator"],
  ["Time (ms)", "time_ms", "Algorithm runtime"],
  ["Path length", "path_length", "Number of steps in the solution"],
  ["Cost", "cost", "Total path cost (each step costs 1)"],
];

const fmt = (v) => (v === undefined || v === null ? "—" : v);

export function StatsPanel({ stats }) {
  return (
    <div className="crt-panel p-4">
      <h2 className="crt-label mb-3">◢ Algorithm metrics</h2>
      <table className="stat-grid w-full text-[20px] leading-tight">
        <tbody>
          {ROWS.map(([label, key, hint]) => (
            <tr key={key}>
              <td className="stat-key py-[3px] pr-2 cursor-help" title={hint}>{label}</td>
              <td className="stat-value py-[3px] text-right">{fmt(stats?.[key])}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
