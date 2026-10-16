// Game design layered on the verified movement primitive. REA did not establish
// these patrols, shields, pulse, or time limit; they are authored for this demo.
import { createState, update, WORLD } from "./mechanics.js";

const PATROLS = [
  { x: 490, y: 174, rx: 110, ry: 58, rate: 0.62, phase: 0 },
  { x: 768, y: 348, rx: 80, ry: 72, rate: -0.48, phase: 1.6 },
  { x: 310, y: 408, rx: 88, ry: 42, rate: 0.7, phase: 3 },
];
export const RULES = Object.freeze({
  seconds: 90,
  shields: 3,
  pulseRadius: 150,
  pulseCooldown: 3,
  stunSeconds: 2.5,
});
export function createExpedition() {
  return {
    ...createState(),
    shields: RULES.shields,
    remaining: RULES.seconds,
    immunity: 0,
    pulseCooldown: 0,
    pulseAge: 1,
    pulseOrigin: null,
    lost: false,
    drones: PATROLS.map((p) => ({
      x: p.x + Math.cos(p.phase) * p.rx,
      y: p.y + Math.sin(p.phase) * p.ry,
      clock: 0,
      stunned: 0,
    })),
  };
}
export function stepExpedition(state, input, seconds, pulse = false) {
  if (state.won || state.lost) return state;
  const dt = Math.min(WORLD.maxStep, Math.max(0, seconds));
  const next = {
    ...state,
    ...update(state, input, dt),
    remaining: Math.max(0, state.remaining - dt),
    immunity: Math.max(0, state.immunity - dt),
    pulseCooldown: Math.max(0, state.pulseCooldown - dt),
    pulseAge: state.pulseAge + dt,
  };
  const fired = pulse && next.pulseCooldown === 0;
  if (fired) {
    next.pulseCooldown = RULES.pulseCooldown;
    next.pulseAge = 0;
    next.pulseOrigin = { ...next.player };
  }
  next.drones = state.drones.map((drone, i) => {
    const p = PATROLS[i];
    let stunned = Math.max(0, drone.stunned - dt);
    if (
      fired &&
      Math.hypot(drone.x - next.player.x, drone.y - next.player.y) <=
        RULES.pulseRadius
    )
      stunned = RULES.stunSeconds;
    const clock = drone.clock + (stunned ? 0 : dt);
    const point = {
      x: p.x + Math.cos(clock * p.rate + p.phase) * p.rx,
      y: p.y + Math.sin(clock * p.rate + p.phase) * p.ry,
      clock,
      stunned,
    };
    if (
      !next.won &&
      !stunned &&
      next.immunity === 0 &&
      Math.hypot(point.x - next.player.x, point.y - next.player.y) < 30
    ) {
      next.shields = Math.max(0, next.shields - 1);
      next.immunity = 1.75;
    }
    return point;
  });
  next.lost = !next.won && (next.shields === 0 || next.remaining === 0);
  return next;
}
