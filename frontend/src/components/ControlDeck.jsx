// ControlDeck.jsx — Bảng điều khiển kiểu nút bấm arcade.
//
// Quản lý toàn bộ lựa chọn cấu hình (controlled inputs) và phát ra qua onChange.
// Config shape khớp với useRunner: {map, problem, algorithm, heuristic, speed}.

const GROUP_LABEL = { uninformed: "Uninformed search", informed: "Informed search" };
const HEURISTIC_LABEL = {
  null: "None",
  manhattan: "Manhattan distance",
  nearest_food: "Nearest food",
  farthest_food: "Farthest food",
  food_count: "Food remaining",
};

// Heuristic hợp với từng bài toán. Chọn sai nhóm thì heuristic trả 0 -> A* suy
// biến thành UCS, nên khi đổi bài toán ta tự đặt heuristic mặc định phù hợp.
function problemPatch(problem) {
  const heuristic = problem === "eat_all" ? "farthest_food" : "manhattan";
  return { problem, heuristic };
}

export function ControlDeck({
  tab = "play",
  section = "all",
  maps,
  algorithms,
  heuristics,
  algoInfo,
  cfg,
  setCfg,
  busy,
  paused,
  soundOn,
  onToggleSound,
  onRun,
  onPause,
  onStep,
  onStepBack,
  canStepBack,
  canStepNext,
  onReset,
  onCompare,
}) {
  const set = (patch, resetCached = false) => {
    if (resetCached) onReset?.();
    setCfg((c) => ({ ...c, ...patch }));
  };

  const usesHeuristic = algoInfo?.[cfg.algorithm]?.uses_heuristic;
  const isCompare = tab === "compare";

  // Nhóm thuật toán tĩnh theo uninformed/informed.
  const groups = { uninformed: [], informed: [] };
  for (const a of algorithms) {
    if (a.group === "uninformed" || a.group === "informed") groups[a.group].push(a);
  }

  if (isCompare) {
    return (
      <div className="crt-panel p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="crt-label">◢ Compare</h2>
          <button
            className="font-term text-[18px] leading-none px-2 py-1 rounded border"
            style={{
              color: soundOn ? "var(--color-pac)" : "var(--color-amber-dim)",
              borderColor: "rgba(255,176,0,.35)",
            }}
            onClick={onToggleSound}
            title="Toggle sound"
            aria-label={soundOn ? "Turn sound off" : "Turn sound on"}
            aria-pressed={soundOn}
          >
            {soundOn ? "🔊 ON" : "🔇 OFF"}
          </button>
        </div>

        <Field label="Map">
          <select className="crt-select" value={cfg.map} disabled={busy}
            onChange={(e) => set({ map: e.target.value }, true)}>
            {maps.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </Field>
        <Field label="Problem">
          <select className="crt-select" value={cfg.problem} disabled={busy}
            onChange={(e) => set(problemPatch(e.target.value), true)}>
            <option value="eat_all">Eat all food</option>
            <option value="path_to_farthest">Reach the farthest food</option>
          </select>
        </Field>
        <Field label="Heuristic (for A*/Greedy)">
          <select className="crt-select" value={cfg.heuristic} disabled={busy}
            onChange={(e) => set({ heuristic: e.target.value }, true)}>
            {heuristics.map((h) => <option key={h} value={h}>{HEURISTIC_LABEL[h] || h}</option>)}
          </select>
        </Field>
        <Field label="Algorithms to compare">
          <div className="grid grid-cols-2 gap-1">
            {[...groups.uninformed, ...groups.informed].map((a) => {
              const checked = (cfg.compareAlgos || []).includes(a.key);
              return (
                <label key={a.key} className="flex items-center gap-1 crt-label cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={busy}
                    onChange={(e) => {
                      const cur = new Set(cfg.compareAlgos || []);
                      if (e.target.checked) cur.add(a.key);
                      else cur.delete(a.key);
                      set({ compareAlgos: [...cur] });
                    }}
                  />
                  {a.name}
                </label>
              );
            })}
          </div>
        </Field>
        <button className="arcade-btn btn-compare" disabled={busy} onClick={onCompare}>
          ⊞ Compare {(cfg.compareAlgos || []).length || "all"}
        </button>
      </div>
    );
  }

  const showRunControls = section === "all" || section === "run";
  const showSettings = section === "all" || section === "settings";

  return (
    <div className="flex flex-col gap-4">
      {showRunControls && (
      <div className="crt-panel p-4 flex flex-col gap-3">
        <h2 className="crt-label">◢ Run mode</h2>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className={`arcade-btn ${cfg.runMode === "auto" ? "btn-run" : "btn-mode-off"}`}
            disabled={busy}
            onClick={() => set({ runMode: "auto" })}
          >
            ▶ Automatic
          </button>
          <button
            type="button"
            className={`arcade-btn ${cfg.runMode === "step" ? "btn-step" : "btn-mode-off"}`}
            disabled={busy}
            onClick={() => set({ runMode: "step" })}
          >
            ⇥ Step-by-step
          </button>
        </div>

        {cfg.runMode === "auto" && (
          <Field label={`Speed: ${cfg.speed} steps/second`}>
            <input type="range" className="crt-range" min={1} max={60} value={cfg.speed}
              onChange={(e) => set({ speed: parseInt(e.target.value, 10) })} />
          </Field>
        )}

        {cfg.runMode === "auto" ? (
          <div className="grid grid-cols-3 gap-2 mt-1">
            <button className="arcade-btn btn-run" disabled={busy} onClick={onRun}>▶ Run</button>
            <button className="arcade-btn btn-pause" disabled={!busy} onClick={onPause}>
              {paused ? "▶ Resume" : "‖ Pause"}
            </button>
            <button className="arcade-btn btn-reset" disabled={busy} onClick={onReset}>↻ Reset</button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 mt-1">
            <button className="arcade-btn btn-back" disabled={busy || !canStepBack} onClick={onStepBack}>⇤ Step back</button>
            <button className="arcade-btn btn-step" disabled={busy || !canStepNext} onClick={onStep}>⇥ Next step</button>
            <button className="arcade-btn btn-reset" disabled={busy} onClick={onReset}>↻ Reset</button>
          </div>
        )}
      </div>
      )}

      {showSettings && (
      <div className="crt-panel p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="crt-label">◢ Configuration</h2>
        <button
          className="font-term text-[18px] leading-none px-2 py-1 rounded border"
          style={{
            color: soundOn ? "var(--color-pac)" : "var(--color-amber-dim)",
            borderColor: "rgba(255,176,0,.35)",
          }}
          onClick={onToggleSound}
          title="Toggle sound"
          aria-label={soundOn ? "Turn sound off" : "Turn sound on"}
          aria-pressed={soundOn}
        >
          {soundOn ? "🔊 ON" : "🔇 OFF"}
        </button>
      </div>

      <Field label="Map">
        <select className="crt-select" value={cfg.map} disabled={busy}
          onChange={(e) => set({ map: e.target.value }, true)}>
          {maps.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </Field>

        <Field label="Problem">
          <select className="crt-select" value={cfg.problem} disabled={busy}
            onChange={(e) => set(problemPatch(e.target.value), true)}>
            <option value="eat_all">Eat all food</option>
            <option value="path_to_farthest">Reach the farthest food</option>
          </select>
        </Field>
        <Field label="Algorithm">
          <select className="crt-select" value={cfg.algorithm} disabled={busy}
            onChange={(e) => set({ algorithm: e.target.value }, true)}>
            {["uninformed", "informed"].map((g) =>
              groups[g].length ? (
                <optgroup key={g} label={GROUP_LABEL[g]}>
                  {groups[g].map((a) => <option key={a.key} value={a.key}>{a.name}</option>)}
                </optgroup>
              ) : null
            )}
          </select>
        </Field>
        {usesHeuristic && (
          <Field label="Heuristic">
            <select className="crt-select" value={cfg.heuristic} disabled={busy}
              onChange={(e) => set({ heuristic: e.target.value }, true)}>
              {heuristics.map((h) => <option key={h} value={h}>{HEURISTIC_LABEL[h] || h}</option>)}
            </select>
          </Field>
        )}
      </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="crt-label block mb-1">{label}</span>
      {children}
    </label>
  );
}
