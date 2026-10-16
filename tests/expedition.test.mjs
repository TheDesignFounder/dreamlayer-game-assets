import test from "node:test";
import assert from "node:assert/strict";
import { createExpedition, stepExpedition, RULES } from "../demo/expedition.js";
import { move } from "../demo/mechanics.js";

test("expedition keeps artifact-derived movement and caps the battery clock after a stalled frame", () => {
  const state = createExpedition();
  const next = stepExpedition(state, { x: 1, y: 1 }, 2);
  assert.deepEqual(next.player, move(state.player, { x: 1, y: 1 }, 2));
  assert.equal(next.remaining, RULES.seconds - 0.05);
  assert.equal(state.remaining, RULES.seconds);
});
test("a drone contact removes one shield and grants temporary immunity", () => {
  const state = createExpedition();
  state.player = { x: state.drones[0].x, y: state.drones[0].y };
  const hit = stepExpedition(state, { x: 0, y: 0 }, 0);
  assert.equal(hit.shields, 2);
  assert.equal(stepExpedition(hit, { x: 0, y: 0 }, 0.016).shields, 2);
  assert.equal(state.shields, 3);
});
test("pulse stuns a nearby drone before contact and cannot bypass cooldown", () => {
  const state = createExpedition();
  state.player = { x: state.drones[0].x, y: state.drones[0].y };
  const pulse = stepExpedition(state, { x: 0, y: 0 }, 0, true);
  assert.equal(pulse.shields, 3);
  assert.equal(pulse.drones[0].stunned, RULES.stunSeconds);
  const again = stepExpedition(pulse, { x: 0, y: 0 }, 0.05, true);
  assert.ok(again.pulseCooldown < RULES.pulseCooldown);
  assert.ok(again.drones[0].stunned < RULES.stunSeconds);
  assert.deepEqual(
    [again.drones[0].x, again.drones[0].y],
    [pulse.drones[0].x, pulse.drones[0].y],
  );
});
test("battery and shield failures freeze the run; returning all cells completes it", () => {
  const dead = stepExpedition(
    { ...createExpedition(), remaining: 0.01 },
    { x: 0, y: 0 },
    0.05,
  );
  assert.equal(dead.lost, true);
  assert.equal(stepExpedition(dead, { x: 1, y: 0 }, 0.05), dead);
  const state = createExpedition();
  state.player = { x: state.drones[0].x, y: state.drones[0].y };
  state.shields = 1;
  assert.equal(stepExpedition(state, { x: 0, y: 0 }, 0).lost, true);
  const won = stepExpedition(
    { ...createExpedition(), collected: [0, 1, 2, 3, 4, 5] },
    { x: 0, y: 0 },
    0,
  );
  assert.equal(won.won, true);
  assert.equal(won.lost, false);
  assert.equal(stepExpedition(won, { x: 1, y: 0 }, 0.05), won);
});
