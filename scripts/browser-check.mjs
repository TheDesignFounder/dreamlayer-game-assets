import { chromium } from "playwright";
import { mkdir, writeFile, readFile } from "node:fs/promises";
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
    window.__drawnAssets = [];
    window.__cellPositions = [];
    const draw = CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage = function (image, ...args) {
      if (
        this.canvas.id === "game" &&
        image instanceof HTMLImageElement &&
        /assets\/generated\//.test(image.src)
      )
        window.__drawnAssets.push(image.src.split("/").pop());
      if (
        image instanceof HTMLImageElement &&
        image.src.endsWith("/cell.png")
      ) {
        const transform = this.getTransform();
        window.__cellPositions.push([transform.e, transform.f]);
      }
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
  assert.equal(current.artworkReady, true);
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
  const manifest = JSON.parse(await readFile("assets/manifest.json", "utf8"));
  const alpha = await page.evaluate(
    async (assets) => {
      const checks = [];
      for (const asset of assets) {
        const img = new Image();
        img.src = asset.path.replace(/^demo\//, "");
        await img.decode();
        const c = document.createElement("canvas");
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const x = c.getContext("2d");
        x.drawImage(img, 0, 0);
        const data = x.getImageData(0, 0, c.width, c.height).data;
        let transparent = 0,
          visible = 0;
        for (let j = 3; j < data.length; j += 4) {
          if (data[j] === 0) transparent++;
          if (data[j] > 0) visible++;
        }
        checks.push({
          name: asset.path,
          width: c.width,
          height: c.height,
          expectedWidth: asset.width,
          expectedHeight: asset.height,
          alpha: asset.alpha,
          transparent,
          visible,
        });
      }
      return checks;
    },
    manifest.assets.filter((asset) => asset.runtime),
  );
  alpha.forEach((a) => {
    assert.equal(a.width, a.expectedWidth);
    assert.equal(a.height, a.expectedHeight);
    assert.ok(a.visible > 0);
    if (a.alpha) assert.ok(a.transparent > 0);
  });
  results.alpha = alpha;
  const drawn = await page.evaluate(() =>
    [...new Set(window.__drawnAssets)].sort(),
  );
  assert.deepEqual(drawn, [
    "beacon.png",
    "cell.png",
    "dock.png",
    "drone.png",
    "environment.webp",
    "planter.png",
    "rover.png",
  ]);
  results.checks.push(
    "all seven newly generated runtime assets are decoded and actually drawn; six cropped props have genuine alpha",
  );
  await page.locator("#restart").click();
  await page.locator("#start").click();
  async function walkTo(target) {
    for (let i = 0; i < 600; i++) {
      const { state } = await read();
      assert.equal(
        state.lost,
        false,
        "playthrough must survive the patrols and battery limit",
      );
      if (state.pulseCooldown === 0) await page.keyboard.press("Space");
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
  results.checks.push(
    "complete six-cell playthrough with patrols and pulse, return-home win",
  );
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
  // Reduced motion must remove the decorative cell bob while keeping gameplay active.
  await page.locator("#restart").click();
  await page.locator("#start").click();
  await page.evaluate(() => {
    window.__cellPositions = [];
  });
  await page.clock.runFor(500);
  const normalPositions = await page.evaluate(
    () => new Set(window.__cellPositions.map((point) => point.join(","))).size,
  );
  assert.ok(normalPositions > 6);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.evaluate(() => {
    window.__cellPositions = [];
  });
  await page.clock.runFor(500);
  const reducedPositions = await page.evaluate(
    () => new Set(window.__cellPositions.map((point) => point.join(","))).size,
  );
  assert.equal(reducedPositions, 6);
  assert.equal((await read()).running, true);
  results.checks.push(
    "reduced motion disables decorative cell movement while gameplay continues",
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
  results.checks.push("320/390 px layouts have no horizontal overflow");
  assert.deepEqual(errors, []);
  await writeFile(
    "test-results/browser.json",
    JSON.stringify(results, null, 2) + "\n",
  );
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
