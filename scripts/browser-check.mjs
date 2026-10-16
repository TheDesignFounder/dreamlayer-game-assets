import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const base = process.env.DEMO_URL || "http://127.0.0.1:4177/demo/";
const browser = await chromium.launch({
  headless: true,
  ...(process.env.BROWSER_CHANNEL
    ? { channel: process.env.BROWSER_CHANNEL }
    : {}),
});
await mkdir("test-results", { recursive: true });
const results = { browser: browser.version(), base, checks: [] };
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1100 },
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    window.__drawnFrames = [];
    const draw = CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage = function (image, ...args) {
      if (
        this.canvas.id === "game" &&
        image instanceof HTMLImageElement &&
        /walk_\d+\.png$/.test(image.src)
      )
        window.__drawnFrames.push(image.src.split("/").pop());
      return draw.call(this, image, ...args);
    };
  });
  await page.clock.install();
  await page.goto(base);
  await page.locator("#start").click();
  const read = () =>
    page.evaluate(async () => (await import("./game.js")).snapshot());
  await page.keyboard.down("ArrowRight");
  await page.clock.runFor(500);
  await page.keyboard.up("ArrowRight");
  let current = await read();
  assert.ok(current.state.player.x > 170 && current.state.player.x < 200);
  await page.locator("#pause").click();
  const paused = (await read()).state;
  await page.clock.runFor(500);
  assert.deepEqual((await read()).state, paused);
  await page.locator("#baseline").click();
  assert.deepEqual((await read()).state, paused);
  await page.screenshot({
    path: "test-results/geometry-desktop.png",
    fullPage: true,
  });
  await page.locator("#art").click();
  assert.deepEqual((await read()).state, paused);
  await page.screenshot({
    path: "test-results/artwork-desktop.png",
    fullPage: true,
  });
  results.checks.push(
    "keyboard movement, pause, visual toggle preserves exact state",
  );
  const alpha = await page.evaluate(async () => {
    const checks = [];
    for (let i = 1; i <= 7; i++) {
      const img = new Image();
      img.src = `assets/walk_${String(i).padStart(2, "0")}.png`;
      await img.decode();
      const c = document.createElement("canvas");
      c.width = c.height = 128;
      const x = c.getContext("2d");
      x.drawImage(img, 0, 0);
      const data = x.getImageData(0, 0, 128, 128).data;
      let transparent = 0,
        visible = 0;
      for (let j = 3; j < data.length; j += 4) {
        if (data[j] === 0) transparent++;
        if (data[j] > 0) visible++;
      }
      checks.push({
        width: img.naturalWidth,
        height: img.naturalHeight,
        transparent,
        visible,
      });
    }
    return checks;
  });
  alpha.forEach((a) =>
    assert.ok(
      a.width === 128 && a.height === 128 && a.transparent > 0 && a.visible > 0,
    ),
  );
  results.alpha = alpha;
  await page.locator("#restart").click();
  await page.locator("#start").click();
  async function walkTo(target) {
    for (let i = 0; i < 600; i++) {
      const { state } = await read();
      const dx = target.x - state.player.x,
        dy = target.y - state.player.y;
      if (Math.hypot(dx, dy) < 4 || state.won) return;
      const keys = [];
      if (Math.abs(dx) > 2) keys.push(dx > 0 ? "ArrowRight" : "ArrowLeft");
      if (Math.abs(dy) > 2) keys.push(dy > 0 ? "ArrowDown" : "ArrowUp");
      for (const key of keys) await page.keyboard.down(key);
      await page.clock.runFor(16);
      for (const key of keys) await page.keyboard.up(key);
    }
    throw new Error(
      `Could not reach ${JSON.stringify(target)}: ${JSON.stringify(await read())}`,
    );
  }
  for (const [x, y] of [
    [170, 140],
    [170, 115],
    [390, 115],
    [390, 128],
    [570, 260],
    [570, 100],
    [812, 100],
    [812, 126],
    [812, 450],
    [796, 450],
    [796, 412],
    [796, 450],
    [288, 450],
    [288, 420],
    [160, 420],
    [96, 270],
  ])
    await walkTo({ x, y });
  assert.equal((await read()).state.won, true);
  assert.equal(await page.locator("#score").innerText(), "6 / 6 cells");
  results.checks.push("complete six-cell playthrough and return-home win");
  await page.locator("#start").click();
  assert.equal((await read()).state.collected.length, 0);
  // Actual on-screen control: release outside the button must clear movement.
  const button = page.getByRole("button", { name: "Move right", exact: true });
  await button.scrollIntoViewIfNeeded();
  const box = await button.boundingBox();
  const beforeTouch = (await read()).state.player.x;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.clock.runFor(200);
  await page.mouse.move(2, 2);
  await page.mouse.up();
  const afterTouch = (await read()).state.player.x;
  assert.ok(afterTouch > beforeTouch);
  await page.clock.runFor(200);
  assert.equal((await read()).state.player.x, afterTouch);
  results.checks.push(
    "replay resets state; pointer movement and release outside control stop correctly",
  );
  await page.locator("#animate").check();
  await page.locator("#game").focus();
  await page.evaluate(() => {
    window.__drawnFrames = [];
  });
  await page.keyboard.down("ArrowUp");
  await page.clock.runFor(3000);
  await page.keyboard.up("ArrowUp");
  const frames = await page.evaluate(() =>
    [...new Set(window.__drawnFrames)].sort(),
  );
  assert.equal(frames.length, 7);
  results.checks.push(
    "all seven animation frames drawn during a real 3-second movement interval",
  );
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    await page.screenshot({
      path: `test-results/mobile-${width}.png`,
      fullPage: true,
    });
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.locator("#animate").check();
  assert.equal(
    await page.evaluate(
      () => matchMedia("(prefers-reduced-motion: reduce)").matches,
    ),
    true,
  );
  await page.evaluate(() => {
    window.__drawnFrames = [];
  });
  await page.locator("#game").focus();
  await page.keyboard.down("ArrowDown");
  await page.clock.runFor(1000);
  await page.keyboard.up("ArrowDown");
  assert.deepEqual(
    await page.evaluate(() => [...new Set(window.__drawnFrames)]),
    ["walk_01.png"],
  );
  results.checks.push(
    "320/390 px layout; reduced motion media; all seven PNGs decode with real transparency",
  );
  assert.deepEqual(errors, []);
  await writeFile(
    "test-results/browser.json",
    JSON.stringify(results, null, 2) + "\n",
  );
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
