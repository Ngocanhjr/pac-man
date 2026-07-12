// ProblemModelPanel.jsx — Thẻ terminal giải thích MÔ HÌNH KHÔNG GIAN TRẠNG THÁI
// của bài toán đang chọn. Giúp người xem (giám khảo) nắm khái niệm mà không cần
// nghe thuyết trình miệng: State / Actions / Goal / Path cost.

// Nội dung theo từng bài toán. Mỗi mục là [nhãn, mô tả].
const MODELS = {
  eat_all: {
    title: "Description of the state space — Eat all food",
    rows: [
      // ["State", "(p, F)"],
      ["Initial State", "((1,1), F₀)"],
      ["Goal State", "((x,y), ∅)"],
      ["Actions", "move UP / DOWN / LEFT / RIGHT (excluding walls)"],
      ["Path cost", "each step costs 1 → optimal means the fewest steps"],
    ],
    dedup: {
      key: "state_key = ((x,y), F)",
      lines: [
        "Discard a child only when its complete state_key has already appeared.",
        "Same p but different F means a different state, so keep it.",
      ],
    },
    note: "p = Pac-man cell; F₀ is the initial food set; ∅ means no food remains.",
  },
  path_to_farthest: {
    title: "Description of the state space — Reach the farthest food",
    rows: [
      ["Initial State", "p = (1,1)"],
      ["Goal State", "p = (x_goal, y_goal)"],
      ["Actions", "move UP / DOWN / LEFT / RIGHT (excluding walls)"],
      ["Path cost", "each step costs 1 → optimal means the shortest path to the goal"],
    ],
    dedup: {
      key: "state_key = p = (x,y)",
      lines: [
        "Discard a child only when its complete state_key = p has already appeared.",
      ],
    },
    note: "p is Pac-man's current cell; (x_goal, y_goal) is the farthest food position.",
  },
};

export function ProblemModelPanel({ problem }) {
  const model = MODELS[problem] || MODELS.eat_all;

  return (
    <div className="crt-panel p-4">
      <h2 className="crt-label mb-3" style={{ color: "var(--color-pac)" }}>
        ◢ {model.title}
      </h2>
      <dl className="font-term text-[15px] flex flex-col gap-1.5">
        {model.rows.map(([label, desc]) => (
          <div key={label} className="grid grid-cols-[120px_1fr] gap-2 items-baseline">
            <dt className="text-[color:var(--color-inky)] font-semibold">{label}</dt>
            <dd className="text-[color:var(--color-amber)] m-0">{desc}</dd>
          </div>
        ))}
      </dl>

      {model.dedup && (
        <div className="mt-3 rounded border border-[rgba(255,176,0,.3)] bg-[#07070f] p-3">
          <div className="crt-label text-[11px] mb-1" style={{ color: "var(--color-pac)" }}>
            Duplicate-state elimination (explored / closed list)
          </div>
          <code className="block font-term text-[13px] text-[color:var(--color-inky)] mb-1">
            {model.dedup.key}
          </code>
          <p className="font-term text-[13px] text-[color:var(--color-amber)] leading-snug m-0">
            {model.dedup.lines.join(" ")}
          </p>
        </div>
      )}

      <p className="mt-3 text-[13px] text-[color:var(--color-amber-dim)] leading-snug">
        {model.note}
      </p>
    </div>
  );
}
