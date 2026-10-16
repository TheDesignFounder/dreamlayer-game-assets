// Implemented from the bounded artifact specification, independently of the renderer.
export const WORLD = Object.freeze({
  width: 960,
  height: 540,
  radius: 16,
  speed: 180,
  maxStep: 0.05,
});
export function move(position, input, seconds) {
  const scale = Math.max(1, Math.hypot(input.x, input.y));
  const distance = WORLD.speed * Math.min(WORLD.maxStep, Math.max(0, seconds));
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  return {
    x: clamp(position.x + (input.x / scale) * distance, 16, 944),
    y: clamp(position.y + (input.y / scale) * distance, 16, 524),
  };
}
export const PLANTERS = Object.freeze([
  { x: 226, y: 156, w: 100, h: 92 },
  { x: 426, y: 330, w: 110, h: 82 },
  { x: 644, y: 138, w: 110, h: 96 },
]);
export const CELLS = Object.freeze([
  { x: 170, y: 140 },
  { x: 390, y: 128 },
  { x: 570, y: 260 },
  { x: 812, y: 126 },
  { x: 796, y: 412 },
  { x: 288, y: 420 },
]);
export function collides(point) {
  return PLANTERS.some((rect) => {
    const dx = point.x - Math.max(rect.x, Math.min(point.x, rect.x + rect.w));
    const dy = point.y - Math.max(rect.y, Math.min(point.y, rect.y + rect.h));
    return dx * dx + dy * dy < WORLD.radius * WORLD.radius;
  });
}
export function createState() {
  return { player: { x: 96, y: 270 }, collected: [], elapsed: 0, won: false };
}
export function update(state, input, seconds) {
  if (state.won) return state;
  const candidate = move(state.player, input, seconds);
  let player = state.player;
  // Axis-separated collision enables sliding along planters. This is new game logic,
  // outside the investigated movement primitive.
  if (!collides({ x: candidate.x, y: player.y }))
    player = { x: candidate.x, y: player.y };
  if (!collides({ x: player.x, y: candidate.y }))
    player = { x: player.x, y: candidate.y };
  const collected = [...state.collected];
  CELLS.forEach((cell, index) => {
    if (
      !collected.includes(index) &&
      Math.hypot(cell.x - player.x, cell.y - player.y) < 29
    )
      collected.push(index);
  });
  return {
    player,
    collected,
    elapsed: state.elapsed + Math.min(0.05, Math.max(0, seconds)),
    won:
      collected.length === CELLS.length &&
      Math.hypot(player.x - 96, player.y - 270) < 34,
  };
}
