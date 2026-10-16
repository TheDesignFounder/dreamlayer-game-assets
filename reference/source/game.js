// Controlled reference, authored for this demonstration. Ground truth only:
// investigate the built artifact before comparing this source.
export function advance(position, input, seconds) {
  const magnitude = Math.hypot(input.x, input.y);
  const divisor = Math.max(1, magnitude);
  const elapsed = Math.max(0, Math.min(seconds, 0.05));
  return {
    x: Math.max(16, Math.min(944, position.x + input.x / divisor * 180 * elapsed)),
    y: Math.max(16, Math.min(524, position.y + input.y / divisor * 180 * elapsed))
  };
}
if (typeof document !== 'undefined') {
  const canvas = document.querySelector('canvas');
  const context = canvas.getContext('2d');
  const keys = new Set();
  let position = { x: 96, y: 270 }, previous = 0;
  addEventListener('keydown', event => { if (event.key.startsWith('Arrow')) event.preventDefault(); keys.add(event.key); });
  addEventListener('keyup', event => keys.delete(event.key));
  addEventListener('blur', () => keys.clear());
  function frame(time) {
    position = advance(position, {
      x: Number(keys.has('ArrowRight')) - Number(keys.has('ArrowLeft')),
      y: Number(keys.has('ArrowDown')) - Number(keys.has('ArrowUp'))
    }, previous ? (time - previous) / 1000 : 0);
    previous = time;
    context.fillStyle = '#edf4fa'; context.fillRect(0, 0, 960, 540);
    context.fillStyle = '#2867ee'; context.fillRect(position.x - 16, position.y - 16, 32, 32);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
