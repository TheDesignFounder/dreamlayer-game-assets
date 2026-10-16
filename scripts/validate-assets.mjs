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
  if (asset.format === "webp") {
    assert.equal(data.subarray(0, 4).toString(), "RIFF");
    assert.equal(data.subarray(8, 12).toString(), "WEBP");
  }
  if (asset.format === "png") {
    assert.equal(data.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
    assert.equal(data.readUInt32BE(16), asset.width);
    assert.equal(data.readUInt32BE(20), asset.height);
    if (asset.alpha) assert.equal(data[25], 6, "RGBA PNG expected");
    else assert.ok([2, 6].includes(data[25]), "RGB or RGBA PNG expected");
  }
}
assert.equal(manifest.assets.filter((asset) => asset.runtime).length, 7);
assert.equal(
  manifest.assets.filter((asset) => asset.runtime && asset.alpha).length,
  6,
);
const records = JSON.parse(await readFile(manifest.generationRecords, "utf8"));
assert.equal(records.records.length, 3);
assert.ok(records.records.every((record) => record.status === "completed"));
assert.equal(
  records.records.reduce((sum, record) => sum + record.credits, 0),
  manifest.newGenerationCredits,
);
console.log(
  `PASS: ${manifest.assets.length} digests; PNG dimensions and formats; 7 runtime assets, 6 transparent sprites, 3 completed DreamLayer operations. Browser checks decode all delivered images.`,
);
