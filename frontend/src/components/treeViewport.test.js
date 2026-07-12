import test from "node:test";
import assert from "node:assert/strict";

import { clampZoom, fitZoom, zoomedScroll } from "./treeViewport.js";

test("zoom stays safe while fit may go below 55%", () => {
  assert.equal(clampZoom(0.1), 0.2);
  assert.equal(clampZoom(2), 1.8);
  assert.equal(fitZoom(500, 400, 1000, 800), 0.48);
});

test("zoom keeps its anchor in the same viewport position", () => {
  assert.equal(zoomedScroll(500, 0, 0.5, 200), 50);
});
