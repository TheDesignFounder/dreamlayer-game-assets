import { WORLD, PLANTERS, CELLS } from "./mechanics.js";
import { createExpedition, stepExpedition, RULES } from "./expedition.js";
const $ = (id) => document.getElementById(id);
const embedded = new URLSearchParams(location.search).get("embed") === "1";
document.documentElement.classList.toggle("embedded", embedded);
if (embedded) {
  // The website owns this same-origin iframe. Send only its measured height.
  new ResizeObserver(() => {
    parent.postMessage(
      { type: "relay-garden:resize", height: document.body.scrollHeight },
      location.origin,
    );
  }).observe(document.body);
}
const canvas = $("game"),
  ctx = canvas.getContext("2d");
let state = createExpedition(),
  mode = "art",
  running = false,
  started = false,
  lastTime = 0,
  facing = 0,
  pulseRequested = false;
const keys = new Set(),
  pointers = new Map();
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
const assetNames = [
  "environment",
  "rover",
  "drone",
  "planter",
  "cell",
  "dock",
  "beacon",
];
const images = Object.fromEntries(
  await Promise.all(
    assetNames.map(
      (name) =>
        new Promise((resolve) => {
          const image = new Image();
          image.onload = () => resolve([name, image]);
          image.onerror = () => resolve([name, null]);
          image.src = `assets/generated/${name}.${name === "environment" ? "webp" : "png"}`;
        }),
    ),
  ),
);
const artworkReady = assetNames.every((name) => images[name]);
canvas.width = WORLD.width * 2;
canvas.height = WORLD.height * 2;
ctx.scale(2, 2);
if (!artworkReady)
  $("message").textContent =
    "Some artwork could not load. Geometry mode is still playable.";
function stamp(name, x, y, width, height, rotation = 0) {
  const image = images[name];
  if (!image) return;
  const scale = Math.min(
    width / image.naturalWidth,
    height / image.naturalHeight,
  );
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.drawImage(
    image,
    (-image.naturalWidth * scale) / 2,
    (-image.naturalHeight * scale) / 2,
    image.naturalWidth * scale,
    image.naturalHeight * scale,
  );
  ctx.restore();
}
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
  pulseRequested = false;
  $("pause").textContent = "Resume";
  draw();
}
function start() {
  if (state.won || state.lost) reset();
  started = true;
  running = true;
  lastTime = 0;
  $("overlay").hidden = true;
  $("pause").disabled = false;
  $("pause").textContent = "Pause";
  canvas.focus({ preventScroll: true });
}
function reset() {
  state = createExpedition();
  started = false;
  pause();
  $("overlay").hidden = false;
  $("overlay").querySelector("h2").innerHTML = "Bring the garden online.";
  $("overlay").querySelector("p:not(.eyebrow)").textContent =
    "Six cells. Three shields. Ninety seconds. Move with WASD or arrows. Space stuns drones.";
  $("start").innerHTML = "Play <span>→</span>";
  $("pause").disabled = true;
  $("score").textContent = "0 / 6 cells";
  $("message").textContent = "Move: arrows / WASD · Pulse: Space · Pause: Esc";
  draw();
}
$("start").onclick = start;
$("restart").onclick = reset;
$("pause").onclick = () => (running ? pause() : start());
$("pulse").onclick = () => {
  if (running) pulseRequested = true;
};
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
  if (event.code === "Space") {
    event.preventDefault();
    if (running && !event.repeat) pulseRequested = true;
  }
  if (event.key === "Escape" && started && !state.won && !state.lost) {
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
  const art = mode === "art" && artworkReady;
  const motion = !reduceMotion.matches;
  ctx.fillStyle = art ? "#f3ecdd" : "#f1f5f9";
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);
  if (art) ctx.drawImage(images.environment, 0, 0, WORLD.width, WORLD.height);
  else {
    ctx.strokeStyle = "#dce5ed";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x < 960; x += 40) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 540);
    }
    for (let y = 0; y < 540; y += 40) {
      ctx.moveTo(0, y);
      ctx.lineTo(960, y);
    }
    ctx.stroke();
  }
  // Progress lights and a bright docking ring make the return objective visible.
  const returning = state.collected.length === CELLS.length;
  ctx.fillStyle = returning ? "#2867ee28" : "#2867ee12";
  ctx.beginPath();
  ctx.arc(96, 270, 42, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#2867ee";
  ctx.lineWidth = returning ? 3 : 1.5;
  ctx.stroke();
  if (art) stamp("dock", 96, 270, 82, 82);
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3 - Math.PI / 2;
    const x = 96 + Math.cos(angle) * 55,
      y = 270 + Math.sin(angle) * 55;
    ctx.save();
    ctx.globalAlpha = i < state.collected.length ? 1 : 0.3;
    if (art) stamp("beacon", x, y, 16, 16);
    else {
      ctx.fillStyle = "#2867ee";
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  ctx.textAlign = "center";
  ctx.font = "600 10px system-ui";
  ctx.fillStyle = "#244761";
  ctx.fillText(returning ? "RETURN TO DOCK" : "HOME", 96, 342);
  PLANTERS.forEach((rect) => {
    if (art)
      stamp(
        "planter",
        rect.x + rect.w / 2,
        rect.y + rect.h / 2,
        rect.w + 8,
        rect.h + 8,
      );
    else round(rect.x, rect.y, rect.w, rect.h, 2, "#718496");
  });
  CELLS.forEach((cell, index) => {
    if (state.collected.includes(index)) return;
    if (art) {
      const lift = motion ? Math.sin(state.elapsed * 2.6 + index) * 2.5 : 0;
      ctx.fillStyle = "#ad823b20";
      ctx.beginPath();
      ctx.ellipse(cell.x, cell.y + 14, 10, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      stamp("cell", cell.x, cell.y + lift, 24, 30);
    } else {
      ctx.fillStyle = "#b37b18";
      ctx.beginPath();
      ctx.arc(cell.x, cell.y, 10, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  for (const drone of state.drones) {
    ctx.save();
    ctx.fillStyle = "#58452e25";
    ctx.beginPath();
    ctx.ellipse(drone.x, drone.y + 15, 17, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    if (art) {
      if (drone.stunned) ctx.globalAlpha = 0.55;
      stamp("drone", drone.x, drone.y, 62, 42);
    } else {
      ctx.fillStyle = drone.stunned ? "#597784" : "#b34b39";
      ctx.beginPath();
      ctx.arc(drone.x, drone.y, 15, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    if (drone.stunned) {
      ctx.strokeStyle = "#2867ee";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(drone.x, drone.y, 24, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  if (state.pulseAge < 0.45 && state.pulseOrigin) {
    ctx.strokeStyle = `rgba(40, 103, 238, ${1 - state.pulseAge / 0.45})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(
      state.pulseOrigin.x,
      state.pulseOrigin.y,
      RULES.pulseRadius * (motion ? state.pulseAge / 0.45 : 1),
      0,
      Math.PI * 2,
    );
    ctx.stroke();
  }
  const { x, y } = state.player;
  if (state.immunity > 0) {
    ctx.strokeStyle = "#2867ee";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, 26, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (art) {
    ctx.fillStyle = "#58452e20";
    ctx.beginPath();
    ctx.ellipse(x, y + 16, 17, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    stamp("rover", x, y, 48, 54, facing);
  } else {
    round(x - 16, y - 16, 32, 32, 5, "#2867ee");
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(
      x - Math.sin(facing) * 8,
      y + Math.cos(facing) * 8,
      3,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  $("shields").textContent =
    "◆".repeat(state.shields) + "◇".repeat(3 - state.shields);
  $("shields").setAttribute("aria-label", `${state.shields} shields remaining`);
  const seconds = Math.ceil(state.remaining);
  $("timer").textContent =
    `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  $("pulse").textContent = state.pulseCooldown
    ? `Pulse ${Math.ceil(state.pulseCooldown)}s`
    : "Pulse";
  $("pulse").disabled = !running || state.pulseCooldown > 0;
  if (started && !running && !state.won && !state.lost) {
    round(405, 230, 150, 54, 10, "#ffffffed");
    ctx.fillStyle = "#263c48";
    ctx.font = "18px system-ui";
    ctx.fillText("Paused", 480, 264);
  }
}
function frame(time) {
  const wasRunning = running;
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
    if (input.x || input.y) facing = Math.atan2(input.y, input.x) - Math.PI / 2;
    const before = state.collected.length;
    const shields = state.shields;
    state = stepExpedition(state, input, dt, pulseRequested);
    pulseRequested = false;
    if (state.shields < shields)
      $("message").textContent =
        `${state.shields} shields left. Use Space to stun nearby drones.`;
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
        `Six cells recovered in ${Math.round(state.elapsed)} seconds. ${state.shields} shields remaining.`;
      $("start").textContent = "Play again";
      $("pause").disabled = true;
      $("message").textContent = "Mission complete.";
    }
    if (state.lost) {
      pause();
      $("overlay").hidden = false;
      $("overlay").querySelector("h2").textContent =
        state.shields === 0
          ? "Your shields are down."
          : "Your battery ran out.";
      $("overlay").querySelector("p:not(.eyebrow)").textContent =
        "Watch the patrols. Use Space to stun drones, then slip past.";
      $("start").textContent = "Try again";
      $("pause").disabled = true;
      $("message").textContent = "Expedition ended. Try a different route.";
    }
  }
  if (wasRunning) draw();
  requestAnimationFrame(frame);
}
reduceMotion.addEventListener("change", draw);
new IntersectionObserver(([entry]) => {
  if (!entry.isIntersecting && running) pause();
}).observe(canvas);
draw();
requestAnimationFrame(frame);
// Read-only diagnostic for reproducible browser checks. No state mutation API.
export function snapshot() {
  return structuredClone({ state, mode, running, artworkReady });
}
