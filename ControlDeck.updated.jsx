// ControlDeck.updated.jsx
// ------------------------------------------------------------
// File này là source code của BẢNG ĐIỀU KHIỂN bên phải giao diện.
// Nó quản lý:
// 1. Chọn map, problem, algorithm, heuristic.
// 2. Bật/tắt âm thanh.
// 3. Chạy thuật toán ở 2 chế độ: Automatic và Step-by-step.
// 4. Chọn nhiều thuật toán để so sánh trong tab Compare.
//
// Điểm đã bổ sung:
// - Tách phần nút chạy Automatic / Step-by-step thành component RunModePanel.
// - Render RunModePanel cả trong tab Compare, để bảng điều khiển có nút như hình 2.
// ------------------------------------------------------------

const GROUP_LABEL = {
  uninformed: "Uninformed search",
  informed: "Informed search",
};

const HEURISTIC_LABEL = {
  null: "None",
  manhattan: "Manhattan distance",
  nearest_food: "Nearest food",
  farthest_food: "Farthest food",
  food_count: "Food remaining",
};

// Khi đổi problem, chọn heuristic mặc định phù hợp.
// Eat all food thường hợp với farthest_food.
// Reach the farthest food là bài đi tới 1 điểm, nên manhattan phù hợp hơn.
function problemPatch(problem) {
  const heuristic = problem === "eat_all" ? "farthest_food" : "manhattan";
  return { problem, heuristic };
}

// Nút bật/tắt âm thanh, dùng lại ở Configuration và Compare.
function SoundButton({ soundOn, onToggleSound }) {
  return (
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
  );
}

// Panel chọn chế độ chạy.
// Automatic: chạy liên tục, có Run / Pause / Reset và chỉnh speed.
// Step-by-step: chạy từng bước, có Step back / Next step / Reset.
function RunModePanel({
  cfg,
  set,
  busy,
  paused,
  onRun,
  onPause,
  onStep,
  onStepBack,
  canStepBack,
  canStepNext,
  onReset,
}) {
  const runMode = cfg.runMode || "auto";

  return (
    <div className="crt-panel p-4 flex flex-col gap-3">
      <h2 className="crt-label">◢ Run mode</h2>

      {/* Hai nút chọn chế độ chạy như hình 2 */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          className={`arcade-btn ${runMode === "auto" ? "btn-run" : "btn-mode-off"}`}
          disabled={busy}
          onClick={() => set({ runMode: "auto" })}
        >
          ▶ Automatic
        </button>

        <button
          type="button"
          className={`arcade-btn ${runMode === "step" ? "btn-step" : "btn-mode-off"}`}
          disabled={busy}
          onClick={() => set({ runMode: "step" })}
        >
          ⇥ Step-by-step
        </button>
      </div>

      {/* Chỉ hiện thanh speed khi chạy tự động */}
      {runMode === "auto" && (
        <Field label={`Speed: ${cfg.speed} steps/second`}>
          <input
            type="range"
            className="crt-range"
            min={1}
            max={60}
            value={cfg.speed}
            onChange={(e) => set({ speed: parseInt(e.target.value, 10) })}
          />
        </Field>
      )}

      {/* Bộ nút tương ứng với từng chế độ */}
      {runMode === "auto" ? (
        <div className="grid grid-cols-3 gap-2 mt-1">
          <button className="arcade-btn btn-run" disabled={busy || !onRun} onClick={onRun}>
            ▶ Run
          </button>
          <button className="arcade-btn btn-pause" disabled={!busy || !onPause} onClick={onPause}>
            {paused ? "▶ Resume" : "‖ Pause"}
          </button>
          <button className="arcade-btn btn-reset" disabled={busy || !onReset} onClick={onReset}>
            ↻ Reset
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 mt-1">
          <button
            className="arcade-btn btn-back"
            disabled={busy || !canStepBack || !onStepBack}
            onClick={onStepBack}
          >
            ⇤ Step back
          </button>
          <button
            className="arcade-btn btn-step"
            disabled={busy || !canStepNext || !onStep}
            onClick={onStep}
          >
            ⇥ Next step
          </button>
          <button className="arcade-btn btn-reset" disabled={busy || !onReset} onClick={onReset}>
            ↻ Reset
          </button>
        </div>
      )}
    </div>
  );
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
  // Hàm set dùng để cập nhật cfg.
  // resetCached = true: reset kết quả/cây đang có khi đổi map/problem/algorithm.
  const set = (patch, resetCached = false) => {
    if (resetCached) onReset?.();
    setCfg((c) => ({ ...c, ...patch }));
  };

  const usesHeuristic = algoInfo?.[cfg.algorithm]?.uses_heuristic;
  const isCompare = tab === "compare";

  // Gom thuật toán thành 2 nhóm để hiển thị trong select/checkbox.
  const groups = { uninformed: [], informed: [] };
  for (const a of algorithms) {
    if (a.group === "uninformed" || a.group === "informed") {
      groups[a.group].push(a);
    }
  }

  // TAB COMPARE
  // Trước đây nhánh này chỉ hiện panel Compare.
  // Bây giờ thêm RunModePanel phía trên để có nút Automatic / Step-by-step như hình 2.
  if (isCompare) {
    return (
      <div className="flex flex-col gap-4">
        <RunModePanel
          cfg={cfg}
          set={set}
          busy={busy}
          paused={paused}
          onRun={onRun}
          onPause={onPause}
          onStep={onStep}
          onStepBack={onStepBack}
          canStepBack={canStepBack}
          canStepNext={canStepNext}
          onReset={onReset}
        />

        <div className="crt-panel p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="crt-label">◢ Compare</h2>
            <SoundButton soundOn={soundOn} onToggleSound={onToggleSound} />
          </div>

          <Field label="Map">
            <select
              className="crt-select"
              value={cfg.map}
              disabled={busy}
              onChange={(e) => set({ map: e.target.value }, true)}
            >
              {maps.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </Field>

          <Field label="Problem">
            <select
              className="crt-select"
              value={cfg.problem}
              disabled={busy}
              onChange={(e) => set(problemPatch(e.target.value), true)}
            >
              <option value="eat_all">Eat all food</option>
              <option value="path_to_farthest">Reach the farthest food</option>
            </select>
          </Field>

          <Field label="Heuristic (for A*/Greedy)">
            <select
              className="crt-select"
              value={cfg.heuristic}
              disabled={busy}
              onChange={(e) => set({ heuristic: e.target.value }, true)}
            >
              {heuristics.map((h) => (
                <option key={h} value={h}>{HEURISTIC_LABEL[h] || h}</option>
              ))}
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
      </div>
    );
  }

  const showRunControls = section === "all" || section === "run";
  const showSettings = section === "all" || section === "settings";

  // TAB PLAY
  return (
    <div className="flex flex-col gap-4">
      {showRunControls && (
        <RunModePanel
          cfg={cfg}
          set={set}
          busy={busy}
          paused={paused}
          onRun={onRun}
          onPause={onPause}
          onStep={onStep}
          onStepBack={onStepBack}
          canStepBack={canStepBack}
          canStepNext={canStepNext}
          onReset={onReset}
        />
      )}

      {showSettings && (
        <div className="crt-panel p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="crt-label">◢ Configuration</h2>
            <SoundButton soundOn={soundOn} onToggleSound={onToggleSound} />
          </div>

          <Field label="Map">
            <select
              className="crt-select"
              value={cfg.map}
              disabled={busy}
              onChange={(e) => set({ map: e.target.value }, true)}
            >
              {maps.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </Field>

          <Field label="Problem">
            <select
              className="crt-select"
              value={cfg.problem}
              disabled={busy}
              onChange={(e) => set(problemPatch(e.target.value), true)}
            >
              <option value="eat_all">Eat all food</option>
              <option value="path_to_farthest">Reach the farthest food</option>
            </select>
          </Field>

          <Field label="Algorithm">
            <select
              className="crt-select"
              value={cfg.algorithm}
              disabled={busy}
              onChange={(e) => set({ algorithm: e.target.value }, true)}
            >
              {["uninformed", "informed"].map((g) =>
                groups[g].length ? (
                  <optgroup key={g} label={GROUP_LABEL[g]}>
                    {groups[g].map((a) => (
                      <option key={a.key} value={a.key}>{a.name}</option>
                    ))}
                  </optgroup>
                ) : null
              )}
            </select>
          </Field>

          {usesHeuristic && (
            <Field label="Heuristic">
              <select
                className="crt-select"
                value={cfg.heuristic}
                disabled={busy}
                onChange={(e) => set({ heuristic: e.target.value }, true)}
              >
                {heuristics.map((h) => (
                  <option key={h} value={h}>{HEURISTIC_LABEL[h] || h}</option>
                ))}
              </select>
            </Field>
          )}
        </div>
      )}
    </div>
  );
}

// Component nhỏ để thống nhất giao diện label + input/select.
function Field({ label, children }) {
  return (
    <label className="block">
      <span className="crt-label block mb-1">{label}</span>
      {children}
    </label>
  );
}
