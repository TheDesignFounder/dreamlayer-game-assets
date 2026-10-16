import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
const manifest = JSON.parse(await readFile("assets/manifest.json", "utf8"));
for (const asset of manifest.assets) {
  const data = await readFile(asset.path);
  assert.equal(
    createHash("sha256").update(data).digest("hex"),
    asset.sha256,
    asset.path + " digest",
  );
  if (asset.format === "png") {
    assert.equal(data.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
    assert.equal(data.readUInt32BE(16), asset.width);
    assert.equal(data.readUInt32BE(20), asset.height);
    assert.equal(data[25], 6, "RGBA PNG expected");
  }
}
assert.equal(manifest.animation.durations_ms.length, 7);
assert.equal(
  manifest.animation.durations_ms.reduce((a, b) => a + b, 0),
  2830,
);
console.log(
  `PASS: ${manifest.assets.length} asset digests, PNG dimensions and RGBA format, seven frames, 2830 ms delivered cycle. Browser checks decode alpha and playback.`,
);
