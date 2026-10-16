import test from "node:test";
import assert from "node:assert/strict";
import { move, update, createState, collides } from "../demo/mechanics.js";
import { advance } from "../reference/artifact/game.min.js";

test("equal cardinal and diagonal speed; analog magnitude retained; long and negative frames clamped", () => {
  const p = { x: 480, y: 270 };
  const length = (q) => Math.hypot(q.x - p.x, q.y - p.y);
  assert.ok(Math.abs(length(move(p, { x: 1, y: 1 }, 0.05)) - 9) < 1e-10);
  assert.equal(length(move(p, { x: 1, y: 0 }, 0.05)), 9);
  assert.equal(length(move(p, { x: 0.5, y: 0 }, 0.05)), 4.5);
  assert.equal(length(move(p, { x: 1, y: 0 }, 2)), 9);
  assert.deepEqual(move(p, { x: 1, y: 1 }, -1), p);
  assert.deepEqual(move({ x: 940, y: 520 }, { x: 1, y: 1 }, 0.05), {
    x: 944,
    y: 524,
  });
});
test("independent implementation agrees with minified artifact over 2,000 deterministic cases", () => {
  let seed = 20261016;
  const random = () =>
    (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32;
  for (let i = 0; i < 2000; i++) {
    const point = { x: random() * 960, y: random() * 540 },
      input = { x: random() * 4 - 2, y: random() * 4 - 2 },
      dt = random() * 0.2 - 0.01;
    const expected = advance(point, input, dt),
      actual = move(point, input, dt);
    assert.ok(
      Math.abs(actual.x - expected.x) < 1e-10 &&
        Math.abs(actual.y - expected.y) < 1e-10,
    );
  }
});
test("collision stops the logical body and still allows sliding; artwork is not a physics input", () => {
  let state = { ...createState(), player: { x: 208, y: 190 } };
  state = update(state, { x: 1, y: 0 }, 0.05);
  assert.equal(state.player.x, 208);
  state = update(state, { x: 1, y: 1 }, 0.05);
  assert.ok(state.player.y > 190 && !collides(state.player));
  const artwork = { ...createState(), mode: "art" },
    geometry = { ...createState(), mode: "baseline" };
  assert.deepEqual(
    update(artwork, { x: 1, y: 1 }, 0.016),
    update(geometry, { x: 1, y: 1 }, 0.016),
  );
});
test("collect once, require home for completion, freeze a finished game", () => {
  let state = { ...createState(), player: { x: 170, y: 140 } };
  state = update(state, { x: 0, y: 0 }, 0);
  state = update(state, { x: 0, y: 0 }, 0);
  assert.deepEqual(state.collected, [0]);
  state = { ...state, collected: [0, 1, 2, 3, 4, 5] };
  assert.equal(update(state, { x: 0, y: 0 }, 0).won, false);
  state = update({ ...state, player: { x: 96, y: 270 } }, { x: 0, y: 0 }, 0);
  assert.equal(state.won, true);
  assert.equal(update(state, { x: 1, y: 0 }, 0.05), state);
});
