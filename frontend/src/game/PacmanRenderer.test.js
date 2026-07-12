import assert from "node:assert/strict";
import test from "node:test";

import { PacmanRenderer } from "./PacmanRenderer.js";

test("search timeline restores the current node state across branches", () => {
  const renderer = Object.assign(Object.create(PacmanRenderer.prototype), {
    map: {
      food: [[1, 1], [1, 2]],
      power_pellets: [[2, 1], [2, 2]],
    },
    pacman: [0, 0],
    food: new Set(["1,1", "1,2"]),
    pellets: new Set(["2,1", "2,2"]),
    _mouthPhase: 0,
  });
  const root = { pos: [0, 0], food: [[1, 1], [1, 2]], power_pellets: [[2, 1], [2, 2]] };
  const branchA = { pos: [0, 1], food: [[1, 2]], power_pellets: [[2, 2]] };
  const branchB = { pos: [1, 0], food: [[1, 1]], power_pellets: [[2, 1]] };

  renderer.setSearchTimeline([root, branchA]);
  assert.deepEqual(renderer.pacman, branchA.pos);
  assert.deepEqual([...renderer.food], ["1,2"]);
  assert.deepEqual([...renderer.pellets], ["2,2"]);

  renderer.setSearchTimeline([root, branchA, branchB]);
  assert.deepEqual(renderer.pacman, branchB.pos);
  assert.deepEqual([...renderer.food], ["1,1"]);
  assert.deepEqual([...renderer.pellets], ["2,1"]);

  renderer.setSearchTimeline([root, branchA]);
  assert.deepEqual(renderer.pacman, branchA.pos);
  assert.deepEqual([...renderer.food], ["1,2"]);
  assert.deepEqual([...renderer.pellets], ["2,2"]);
});
