import { WORLD, PLANTERS, CELLS, createState, update } from "./mechanics.js";
const $ = (id) => document.getElementById(id);
const canvas = $("game"),
  ctx = canvas.getContext("2d");
let state = createState(),
  mode = "art",
  running = false,
  started = false,
  lastTime = 0,
  facing = 1;
const keys = new Set(),
  pointers = new Map();
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
const durations = [400, 410, 400, 410, 400, 410, 400];
const assets = await Promise.all(
  Array.from(
    { length: 7 },
    (_, i) =>
      new Promise((resolve) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => resolve(null);
        image.src = `assets/walk_${String(i + 1).padStart(2, "0")}.png`;
      }),
  ),
);
const garden = new Image();
garden.src = "assets/garden.svg";
if (assets.some((asset) => !asset))
  $("message").textContent =
    "Some artwork could not load. Geometry mode is still playable.";
const round = (x, y, w, h, r, fill) => {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
};
function setMode(next) {
  mode = next;
  $("art").setAttribute("aria-pressed", String(mode === "art"));
  $("baseline").setAttribute("aria-pressed", String(mode === "baseline"));
  draw();
}
$("art").onclick = () => setMode("art");
$("baseline").onclick = () => setMode("baseline");
function pause() {
  running = false;
  keys.clear();
  pointers.clear();
  $("pause").textContent = "Resume";
}
function start() {
  if (state.won) reset();
  started = true;
  running = true;
  lastTime = 0;
  $("overlay").hidden = true;
  $("pause").disabled = false;
  $("pause").textContent = "Pause";
  canvas.focus({ preventScroll: true });
}
function reset() {
  state = createState();
  started = false;
  pause();
  $("overlay").hidden = false;
  $("overlay").querySelector("h2").innerHTML =
    "A little robot.<br>A small mission.";
  $("overlay").querySelector("p:not(.eyebrow)").textContent =
    "Find all six cells. Return to the blue dock.";
  $("start").innerHTML = "Start exploring <span>→</span>";
  $("pause").disabled = true;
  $("score").textContent = "0 / 6 cells";
  $("message").textContent = "Arrow keys / WASD to move · Escape to pause";
  draw();
}
$("start").onclick = start;
$("restart").onclick = reset;
$("pause").onclick = () => (running ? pause() : start());
const movementKeys = [
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "w",
  "a",
  "s",
  "d",
];
canvas.addEventListener("keydown", (event) => {
  if (movementKeys.includes(event.key)) {
    event.preventDefault();
    keys.add(event.key);
  }
  if (event.key === "Escape" && started && !state.won) {
    event.preventDefault();
    running ? pause() : start();
  }
});
addEventListener("keyup", (event) => keys.delete(event.key));
addEventListener("blur", () => {
  if (running) pause();
});
canvas.addEventListener("blur", () => keys.clear());
document.addEventListener("visibilitychange", () => {
  if (document.hidden && running) pause();
});
for (const button of document.querySelectorAll("[data-x]")) {
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    if (!started) start();
    if (!running) return;
    button.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, {
      x: +button.dataset.x,
      y: +button.dataset.y,
    });
  });
  for (const type of ["pointerup", "pointercancel", "lostpointercapture"])
    button.addEventListener(type, (event) => pointers.delete(event.pointerId));
}
function draw() {
  ctx.clearRect(0, 0, WORLD.width, WORLD.height);
  ctx.fillStyle = mode === "art" ? "#e4eddf" : "#f1f5f9";
  ctx.fillRect(0, 0, 960, 540);
  if (mode === "art" && garden.complete && garden.naturalWidth)
    ctx.drawImage(garden, 0, 0, 960, 540);
  if (mode === "baseline") {
    ctx.strokeStyle = "#dce5ed";
    ctx.lineWidth = 1;
    for (let x = 0; x < 960; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 540);
      ctx.stroke();
    }
    for (let y = 0; y < 540; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(960, y);
      ctx.stroke();
    }
  }
  ctx.fillStyle = "#d1e3f9";
  ctx.beginPath();
  ctx.arc(96, 270, 36, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#2867ee";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#245bc8";
  ctx.font = "11px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("HOME", 96, 321);
  PLANTERS.forEach((rect) => {
    if (mode === "art") {
      round(rect.x + 5, rect.y + 8, rect.w, rect.h, 14, "#b5c4ad");
      round(rect.x, rect.y, rect.w, rect.h, 14, "#f1f1e4");
      round(rect.x + 7, rect.y + 7, rect.w - 14, rect.h - 14, 10, "#9eb695");
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = ["#587a62", "#719570", "#436b58"][i];
        ctx.beginPath();
        ctx.ellipse(
          rect.x + 26 + i * 25,
          rect.y + rect.h / 2,
          19,
          29,
          (i - 1) * 0.4,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
    } else round(rect.x, rect.y, rect.w, rect.h, 2, "#718496");
  });
  CELLS.forEach((cell, index) => {
    if (state.collected.includes(index)) return;
    if (mode === "art") {
      ctx.fillStyle = "#a2925528";
      ctx.beginPath();
      ctx.ellipse(cell.x, cell.y + 12, 15, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.translate(cell.x, cell.y);
      ctx.rotate(Math.PI / 4);
      round(-10, -10, 20, 20, 5, "#c39539");
      round(-8, -8, 15, 15, 4, "#f4d36f");
      ctx.restore();
      ctx.fillStyle = "#fffae9";
      ctx.fillRect(cell.x - 2, cell.y - 5, 4, 10);
    } else {
      ctx.fillStyle = "#b37b18";
      ctx.beginPath();
      ctx.arc(cell.x, cell.y, 10, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  const { x, y } = state.player;
  let frame = 0;
  if (
    $("animate").checked &&
    !reduceMotion.matches &&
    running &&
    (keys.size || pointers.size)
  ) {
    let at = (state.elapsed * 1000) % durations.reduce((a, b) => a + b, 0);
    while (at >= durations[frame]) {
      at -= durations[frame];
      frame++;
    }
  }
  if (mode === "art" && assets[frame]) {
    ctx.fillStyle = "#315b4130";
    ctx.beginPath();
    ctx.ellipse(x, y + 12, 20, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(facing, 1);
    ctx.drawImage(assets[frame], -44, -65, 88, 88);
    ctx.restore();
  } else {
    round(x - 16, y - 16, 32, 32, 5, "#2867ee");
    ctx.fillStyle = "white";
    ctx.fillRect(x + facing * 6 - 3, y - 7, 6, 6);
  }
  if (started && !running && !state.won) {
    round(405, 230, 150, 54, 10, "#ffffffed");
    ctx.fillStyle = "#263c48";
    ctx.font = "18px system-ui";
    ctx.fillText("Paused", 480, 264);
  }
}
function frame(time) {
  const dt = lastTime ? (time - lastTime) / 1000 : 0;
  lastTime = time;
  if (running) {
    const input = {
      x:
        Number(keys.has("ArrowRight") || keys.has("d")) -
        Number(keys.has("ArrowLeft") || keys.has("a")),
      y:
        Number(keys.has("ArrowDown") || keys.has("s")) -
        Number(keys.has("ArrowUp") || keys.has("w")),
    };
    for (const point of pointers.values()) {
      input.x += point.x;
      input.y += point.y;
    }
    if (input.x) facing = Math.sign(input.x);
    const before = state.collected.length;
    state = update(state, input, dt);
    if (before !== state.collected.length) {
      $("score").textContent = `${state.collected.length} / 6 cells`;
      $("message").textContent =
        state.collected.length === 6
          ? "All cells found. Return to the blue home dock."
          : `${6 - state.collected.length} cells left. Keep exploring.`;
    }
    if (state.won) {
      pause();
      $("overlay").hidden = false;
      $("overlay").querySelector("h2").innerHTML = "The garden<br>is online.";
      $("overlay").querySelector("p:not(.eyebrow)").textContent =
        "Six cells collected. Nice work.";
      $("start").textContent = "Play again";
      $("pause").disabled = true;
      $("message").textContent = "Mission complete.";
    }
  }
  draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
// Read-only diagnostic for reproducible browser checks. No state mutation API.
export function snapshot() {
  return structuredClone({ state, mode, running });
}
