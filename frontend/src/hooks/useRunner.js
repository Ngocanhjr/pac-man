// useRunner.js — Máy điều phối chạy thuật toán tìm kiếm tĩnh.
//
// Nhận một ref tới PacmanRenderer. Cung cấp chạy/pause/step/reset/compare cho
// tìm kiếm tĩnh + state hiển thị (status, stats, compareRows, busy).
//
// Renderer chạy imperative (không re-render qua React) để animation mượt; hook
// chỉ giữ các state cần hiển thị trên panel.

import { useCallback, useRef, useState } from "react";
import { Api } from "../api/client";
import { audio } from "../sound/audio";
import { effects } from "../game/effects";

const EMPTY_TREE_META = { truncated: false, limit: 0 };
const EMPTY_STEP_STATE = { current: 0, total: null, complete: false };

function staticKey(cfg) {
  return JSON.stringify({
    map: cfg.map,
    algorithm: cfg.algorithm,
    heuristic: cfg.heuristic,
    problem: cfg.problem,
  });
}

function expandedTreeNodes(solve) {
  return (solve?.tree || [])
    .filter((n) => n.expanded_order != null)
    .sort((a, b) => a.expanded_order - b.expanded_order);
}

export function useRunner(rendererRef) {
  const [status, setStatus] = useState("Ready");
  const [stats, setStats] = useState(null);     // {nodes_expanded, time_ms, ...}
  const [compareRows, setCompareRows] = useState([]);
  const [tree, setTree] = useState([]);
  const [treeMeta, setTreeMeta] = useState(EMPTY_TREE_META);
  const [searchStep, setSearchStep] = useState(0); // số node cây đã hiện (đồng bộ board)
  const [busy, setBusy] = useState(false);
  const [paused, setPaused] = useState(false);
  const [stepState, setStepState] = useState(EMPTY_STEP_STATE);

  // Cờ điều khiển animation (ref để không gây re-render).
  const stopRef = useRef(false);
  const pausedRef = useRef(false);
  const runningRef = useRef(false);

  // Lưu kết quả lần chạy gần nhất cho chế độ "Từng bước".
  const lastSolveRef = useRef(null);
  const lastSolveKeyRef = useRef(null);
  // Bộ đếm tổng số bước đã đi (tất định) cho step tới/lui ở chế độ tĩnh.
  const staticStepRef = useRef(0);

  const stepDelay = useCallback((speed) => {
    const sps = Math.max(1, speed || 12);
    return Math.round(1000 / sps);
  }, []);

  const shouldStop = useCallback(() => stopRef.current, []);
  const shouldPause = useCallback(() => pausedRef.current, []);

  const stopAnimation = useCallback(() => {
    stopRef.current = true;
    pausedRef.current = false;
    runningRef.current = false;
    setPaused(false);
  }, []);

  // Gắn hook hiệu ứng ăn food vào renderer (gọi 1 lần khi có renderer).
  const wireRenderer = useCallback(() => {
    const r = rendererRef.current;
    if (!r) return;
    r.onEat = (cx, cy, isPellet) => {
      effects.spawnBurst(cx, cy, isPellet ? "#FFF04D" : "#FFE600", isPellet ? 14 : 8);
      if (isPellet) audio.pellet();
      else audio.eat();
    };
  }, [rendererRef]);

  // ---- Chạy chế độ tĩnh ----
  const solveAndAnimate = useCallback(
    async (cfg) => {
      const r = rendererRef.current;
      setStatus("Running " + cfg.algorithm + "...");
      const result = await Api.solve({
        map: cfg.map,
        algorithm: cfg.algorithm,
        heuristic: cfg.heuristic,
        problem: cfg.problem,
      });
      lastSolveRef.current = result;
      lastSolveKeyRef.current = staticKey(cfg);
      setTree(result.tree || []);
      setTreeMeta({ truncated: !!result.tree_truncated, limit: result.tree_limit || 0 });

      if (!result.found) {
        setStats(result.stats);
        setStatus("No solution found");
        const lastNode = expandedTreeNodes(result).at(-1);
        r.visited = [];
        r.path = [];
        if (lastNode) r.setSearchNode(lastNode);
        r.draw();
        return;
      }

      const delay = stepDelay(cfg.speed);
      await r.animateSearch(
        result.tree,
        Math.max(4, delay / 4),
        shouldStop,
        setSearchStep,
        shouldPause
      );
      if (shouldStop()) return;
      r.reset();
      await r.animatePath(result.path, delay, shouldStop, shouldPause);

      setStats(result.stats);
      setStatus("Complete");
      audio.win();
    },
    [rendererRef, shouldStop, shouldPause, stepDelay]
  );

  // ---- Các hành động công khai ----
  const runStatic = useCallback(
    async (cfg) => {
      if (runningRef.current) return;
      const r = rendererRef.current;
      if (!r) return;
      wireRenderer();
      r.reset();
      effects.clear();
      stopRef.current = false;
      runningRef.current = true;
      staticStepRef.current = 0;
      setStepState(EMPTY_STEP_STATE);
      setSearchStep(0);
      setBusy(true);
      setCompareRows([]);
      audio.start();
      try {
        await solveAndAnimate(cfg);
      } catch (e) {
        setStatus("Error: " + e.message);
        console.error(e);
      } finally {
        runningRef.current = false;
        setBusy(false);
      }
    },
    [rendererRef, wireRenderer, solveAndAnimate]
  );

  const pause = useCallback(() => {
    if (!runningRef.current) return;
    pausedRef.current = !pausedRef.current;
    setPaused(pausedRef.current);
    setStatus(pausedRef.current ? "Paused" : "Running...");
  }, []);

  const reset = useCallback(() => {
    stopAnimation();
    const r = rendererRef.current;
    if (r) r.reset();
    effects.clear();
    lastSolveRef.current = null;
    lastSolveKeyRef.current = null;
    staticStepRef.current = 0;
    setStepState(EMPTY_STEP_STATE);
    setSearchStep(0);
    setStats(null);
    setCompareRows([]);
    setTree([]);
    setTreeMeta(EMPTY_TREE_META);
    setStatus("Reset");
  }, [rendererRef, stopAnimation]);

  // Vẽ lại trạng thái tĩnh TẤT ĐỊNH tại một bước cụ thể (dùng cho tới/lui).
  // step trong [0, treeNodes.length + path.length]:
  //   0..treeNodes.length   -> pha Pac-man đứng trên node đang chọn trong cây
  //   >treeNodes.length      -> pha đi dọc path
  const renderStaticAt = useCallback(
    (step) => {
      const r = rendererRef.current;
      const solve = lastSolveRef.current;
      if (!r || !solve) return;
      const treeNodes = expandedTreeNodes(solve);
      const path = solve.path || [];
      const total = treeNodes.length + path.length;
      const s = Math.max(0, Math.min(step, total));
      staticStepRef.current = s;
      setStepState({ current: s, total, complete: s === total });
      setSearchStep(Math.min(s, treeNodes.length)); // cây chỉ mọc trong pha reveal

      // Dựng lại từ đầu để lùi được (food/pellet reset về ban đầu).
      r.reset();

      if (s <= treeNodes.length) {
        // Pha 1: Pac-man đứng trên node đang được chọn trong cây.
        const node = treeNodes[s - 1];
        r.visited = [];
        r.path = [];
        if (node) {
          r.setSearchTimeline(treeNodes.slice(0, s));
        }
        r.draw();
        setStatus(s === 0 ? "Start" : `Node ${s}/${treeNodes.length}`);
        return;
      }

      // Pha 2: đã expand hết, đi dọc path tới ô thứ (walk).
      const walk = s - treeNodes.length; // số ô path đã đi (1..path.length)
      r.visited = [];
      r.path = [];
      const idx = walk - 1;
      const cur = path[idx];
      // Ăn food/pellet dọc các ô đã đi qua.
      for (let i = 1; i <= idx; i++) {
        r.food.delete(r._key(path[i]));
        r.pellets.delete(r._key(path[i]));
      }
      const dir = idx > 0 ? r._dirOf(path[idx - 1], cur) : "RIGHT";
      r.setPacman(cur, dir);
      r._mouthPhase += 0.9;
      r.draw();
      setStatus(`Step ${walk}/${path.length}`);
    },
    [rendererRef]
  );

  const stepStatic = useCallback(
    async (cfg, dir = 1) => {
      if (runningRef.current) return; // đang chạy auto -> không cho step chồng
      const r = rendererRef.current;
      const key = staticKey(cfg);
      if (lastSolveKeyRef.current && lastSolveKeyRef.current !== key) {
        lastSolveRef.current = null;
        lastSolveKeyRef.current = null;
        staticStepRef.current = 0;
        setStepState(EMPTY_STEP_STATE);
        setSearchStep(0);
        setTree([]);
        setTreeMeta(EMPTY_TREE_META);
      }
      // Lần đầu (chưa solve): gọi API, dựng cây, đứng ở bước 0.
      if (!lastSolveRef.current) {
        if (dir < 0) return; // chưa có gì để lùi
        setBusy(true);
        try {
          const result = await Api.solve({
            map: cfg.map,
            algorithm: cfg.algorithm,
            heuristic: cfg.heuristic,
            problem: cfg.problem,
          });
          lastSolveRef.current = result;
          lastSolveKeyRef.current = key;
          staticStepRef.current = 0;
          const total = expandedTreeNodes(result).length + (result.path || []).length;
          setStepState({ current: 0, total, complete: !result.found });
          setSearchStep(0);
          setTree(result.tree || []);
          setTreeMeta({ truncated: !!result.tree_truncated, limit: result.tree_limit || 0 });
          r.reset();
          if (!result.found) {
            setStats(result.stats);
            setStatus("Not found");
            return;
          }
          setStats(result.stats);
          renderStaticAt(1);
        } catch (e) {
          setStatus("Error: " + e.message);
          console.error(e);
        } finally {
          setBusy(false);
        }
        return;
      }

      const solve = lastSolveRef.current;
      const total = expandedTreeNodes(solve).length + (solve.path || []).length;
      const next = staticStepRef.current + dir;
      if (next < 0) {
        setStatus("Already at the first step");
        return;
      }
      if (next > total) {
        setStatus("End of path reached");
        return;
      }
      renderStaticAt(next);
      if (dir > 0 && next > expandedTreeNodes(solve).length) audio.eat();
    },
    [rendererRef, renderStaticAt]
  );

  const compare = useCallback(async (cfg) => {
    const algos =
      cfg.compareAlgos && cfg.compareAlgos.length
        ? cfg.compareAlgos
        : ["bfs", "dfs", "ucs", "greedy", "astar"];
    setBusy(true);
    setStatus("Comparing " + algos.length + " algorithms...");
    try {
      const result = await Api.compare({
        map: cfg.map,
        algorithms: algos,
        heuristic: cfg.heuristic,
        problem: cfg.problem,
      });
      setCompareRows(result.results);
      setStatus("Comparison complete");
    } catch (e) {
      setStatus("Comparison error: " + e.message);
      console.error(e);
    } finally {
      setBusy(false);
    }
  }, []);

  return {
    status, stats, compareRows, tree, treeMeta, searchStep, busy, paused,
    canStepBack: stepState.current > 0,
    canStepNext: !stepState.complete,
    isComplete: stepState.complete,
    runStatic, pause, stepStatic, reset, compare, stopAnimation, setStatus,
  };
}
