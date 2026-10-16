import { build } from "esbuild";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
await build({
  entryPoints: ["reference/source/game.js"],
  outfile: "reference/artifact/game.min.js",
  bundle: true,
  minify: true,
  format: "esm",
  target: "es2022",
  sourcemap: false,
});
const sha256 = createHash("sha256")
  .update(await readFile("reference/artifact/game.min.js"))
  .digest("hex");
await writeFile(
  "reference/target.json",
  JSON.stringify(
    {
      name: "Controlled movement reference",
      version: "1.0.0",
      origin: "Self-authored for TheDesignFounder/dreamlayer-game-assets",
      license: "MIT",
      artifact: "reference/artifact/game.min.js",
      sha256,
      builder: "esbuild@0.25.12",
      question:
        "Does diagonal movement change speed, and how are long frame intervals handled?",
      groundTruth:
        "reference/source/game.js; inspect separately after artifact evidence",
    },
    null,
    2,
  ) + "\n",
);
console.log(`Built reference: ${sha256}`);
