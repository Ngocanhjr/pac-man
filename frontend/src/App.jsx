// App.jsx — Orchestrator chính: nối renderer (canvas) + hooks điều phối + UI.
//
// - Tạo PacmanRenderer trên canvas (qua ref) và giữ trong rendererRef.
// - Vòng lặp requestAnimationFrame: vẽ lại liên tục để pellet và miệng Pac-man
//   luôn động, đồng thời cập nhật + vẽ particle.
// - Nạp bản đồ khi đổi map; điều phối chạy/pause/step/reset/compare qua useRunner.

import { useCallback, useEffect, useRef, useState } from "react";
import { Cabinet } from "./components/Cabinet";
import { CRTScreen } from "./components/CRTScreen";
import { ControlDeck } from "./components/ControlDeck";
import { StatsPanel } from "./components/StatsPanel";
import { ProblemModelPanel } from "./components/ProblemModelPanel";
import { CompareTable } from "./components/CompareTable";
import { ComparisonView } from "./components/ComparisonView";
import { CompareCharts } from "./components/CompareCharts";
import { FghChart } from "./components/FghChart";
import { SearchTreePanel } from "./components/SearchTreePanel";
import { PacmanRenderer } from "./game/PacmanRenderer";
import { effects } from "./game/effects";
import { audio } from "./sound/audio";
import { Api } from "./api/client";
import { useMetadata } from "./hooks/useMetadata";
import { useRunner } from "./hooks/useRunner";

const DEFAULT_CFG = {
  map: "small",
  problem: "eat_all",
  algorithm: "astar",
  heuristic: "farthest_food", // khớp bài eat_all; path_to_farthest sẽ tự đổi sang manhattan
  speed: 12,
  runMode: "auto", // "auto" = tự chạy | "step" = bấm từng bước
  compareAlgos: ["astar", "greedy"],
};

export default function App() {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);

  const meta = useMetadata();
  const [cfg, setCfg] = useState(DEFAULT_CFG);
  const [soundOn, setSoundOn] = useState(true);
  const [poweron, setPoweron] = useState(true);
  const [mapError, setMapError] = useState(null);
  const [tab, setTab] = useState("play"); // "play" = chạy 1 thuật toán | "compare" = so sánh

  const runner = useRunner(rendererRef);

  // Tạo renderer 1 lần khi canvas sẵn sàng + chạy vòng lặp vẽ.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const r = new PacmanRenderer(canvas);
    rendererRef.current = r;

    // Tôn trọng "giảm chuyển động": bỏ particle, chỉ vẽ game.
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    let raf;
    const loop = () => {
      const ctx = r.ctx;
      if (reduceMotion) {
        r.draw();
      } else {
        effects.update();
        r.draw();
        effects.draw(ctx);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Tắt cờ power-on sau khi animation chạy 1 lần.
  useEffect(() => {
    const t = setTimeout(() => setPoweron(false), 700);
    return () => clearTimeout(t);
  }, []);

  // Nạp layout mỗi khi đổi bản đồ.
  useEffect(() => {
    const r = rendererRef.current;
    if (!r || meta.loading) return;
    let alive = true;
    (async () => {
      try {
        const map = await Api.getMap(cfg.map);
        if (!alive) return;
        r.setMap(map);
        effects.clear();
        runner.reset();
        setMapError(null);
      } catch (e) {
        if (alive) setMapError(e.message);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg.map, meta.loading]);

  // Đồng bộ bật/tắt âm thanh.
  useEffect(() => {
    audio.setEnabled(soundOn);
  }, [soundOn]);

  const handleRun = useCallback(() => {
    if (tab === "compare") return runner.runCompareTree(cfg);
    return runner.runStatic(cfg);
  }, [runner, cfg, tab]);
  const handleStep = useCallback(() => {
    if (tab === "compare") return runner.stepCompareTree(cfg, 1);
    return runner.stepStatic(cfg, 1);
  }, [runner, cfg, tab]);
  const handleStepBack = useCallback(() => {
    if (tab === "compare") return runner.stepCompareTree(cfg, -1);
    return runner.stepStatic(cfg, -1);
  }, [runner, cfg, tab]);
  const handleCompare = useCallback(() => runner.compare(cfg), [runner, cfg]);

  // Props chung cho mọi lần render ControlDeck (tránh lặp ~15 dòng mỗi chỗ).
  const deckProps = {
    tab,
    maps: meta.maps,
    algorithms: meta.algorithms,
    heuristics: meta.heuristics,
    algoInfo: meta.algoInfo,
    cfg,
    setCfg,
    busy: runner.busy,
    paused: runner.paused,
    canStepBack: tab === "compare" ? runner.compareCanStepBack : runner.canStepBack,
    canStepNext: tab === "compare" ? runner.compareCanStepNext : runner.canStepNext,
    isComplete: runner.isComplete,
    soundOn,
    onToggleSound: () => setSoundOn((s) => !s),
    onRun: handleRun,
    onPause: runner.pause,
    onStep: handleStep,
    onStepBack: handleStepBack,
    onReset: runner.reset,
    onCompare: handleCompare,
  };

  const backendError = (meta.error || mapError) && (
    <div className="crt-panel p-3 font-term text-[18px]" style={{ color: "var(--color-clyde)" }}>
      {meta.error
        ? `Cannot connect to backend (${Api.baseUrl}). Run: py -3.12 -m uvicorn backend.api.main:app`
        : mapError}
    </div>
  );

  return (
    <Cabinet>
      {/* Thanh tab */}
      <div className="flex gap-2 mb-4">
        <button
          className={`tab-btn ${tab === "play" ? "tab-on" : ""}`}
          onClick={() => setTab("play")}
        >
          ▶ Run algorithm
        </button>
        <button
          className={`tab-btn ${tab === "compare" ? "tab-on" : ""}`}
          onClick={() => setTab("compare")}
        >
          ⊞ Compare algorithms
        </button>
      </div>

      {backendError}

      {/* Tab Play: đọc từ trên xuống theo luồng demo — cấu hình → chạy → xem kết quả.
          Cột trái: cấu hình + màn hình + nút chạy. Cột phải: cây duyệt + số liệu. */}
      <div className={tab === "play" ? "flex flex-col gap-4" : "hidden"}>
        {/* Hàng chính: [màn hình + nút chạy] | [cây duyệt từng bước] cạnh nhau
            -> vừa bấm Bước tiếp vừa theo dõi cây mọc. */}
        <div className="grid gap-4 xl:grid-cols-[minmax(400px,540px)_minmax(560px,1fr)] items-start">
          <div className="flex flex-col gap-4">
            <div>
              <CRTScreen ref={canvasRef} poweron={poweron} />
            </div>
            <ControlDeck {...deckProps} section="run" />
          </div>
          <SearchTreePanel
            tree={runner.tree}
            active
            step={runner.searchStep}
            treeMeta={runner.treeMeta}
            problem={cfg.problem}
          />
        </div>
        {/* Hàng dưới: [cấu hình + mô hình bài toán] | [số liệu] */}
        <div className="grid gap-4 xl:grid-cols-[minmax(400px,540px)_minmax(560px,1fr)] items-start">
          <div className="flex flex-col gap-4">
            <ControlDeck {...deckProps} section="settings" />
            <ProblemModelPanel problem={cfg.problem} />
          </div>
          <StatsPanel stats={runner.stats} />
        </div>
      </div>

      {tab === "compare" && (
        <div className="grid gap-5 lg:grid-cols-[1fr_320px] items-start">
          <div className="flex flex-col gap-4 order-2 lg:order-1">
            {runner.compareRows.length > 0 ? (
              <>
                <ComparisonView
                  rows={runner.compareRows}
                  algoInfo={meta.algoInfo}
                  problem={cfg.problem}
                  treeStep={runner.compareTreeStep}
                />
                <CompareTable rows={runner.compareRows} algoInfo={meta.algoInfo} />
                <FghChart rows={runner.compareRows} algoInfo={meta.algoInfo} />
                <CompareCharts rows={runner.compareRows} algoInfo={meta.algoInfo} />
              </>
            ) : (
              <div className="crt-panel p-4 crt-label">
                Select algorithms on the right, then click "Compare" to view results.
              </div>
            )}
          </div>

          <div className="order-1 lg:order-2">
            <ControlDeck {...deckProps} />
          </div>
        </div>
      )}
    </Cabinet>
  );
}
