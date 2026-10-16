import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { access } from "node:fs/promises";
const [executionId, out] = process.argv.slice(2);
if (!executionId || executionId.startsWith("-"))
  throw new Error(
    "Usage: node scripts/resume-art.mjs EXECUTION_ID [NEW_OUTPUT_PATH]",
  );
function cli(args) {
  const r = spawnSync("dreamlayer", args, { stdio: "inherit" });
  if (r.error) throw r.error;
  if (r.status !== 0) process.exit(r.status || 1);
}
cli(["status", executionId, "--json"]);
if (out) {
  const path = resolve(out);
  let exists = false;
  try {
    await access(path);
    exists = true;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  if (exists)
    throw new Error("Choose a new output path; existing artwork is preserved.");
  cli(["download", executionId, "--out", path, "--json"]);
}
// Never generate, purchase credits, or replace an execution here.
