// Plan only. Paid submissions remain in the canonical DreamLayer workflow.
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
const args = process.argv.slice(2),
  index = args.indexOf("--cap");
const cap = index < 0 ? 0 : Number(args[index + 1]);
if (!Number.isFinite(cap) || cap < 0)
  throw new Error("--cap must be a nonnegative total credit budget");
let capabilities = JSON.parse(
  await readFile("assets/capabilities-snapshot.json", "utf8"),
);
let source =
  "Recorded 2026-10-16 capabilities, estimate only. Refresh with --live before paid work.";
if (args.includes("--live")) {
  const result = spawnSync("dreamlayer", ["capabilities", "--json"], {
    encoding: "utf8",
  });
  if (result.status !== 0)
    throw new Error(
      "Live capabilities failed. Resolve DreamLayer connection/authentication before spending.",
    );
  capabilities = JSON.parse(result.stdout);
  source = "Live DreamLayer CLI capabilities";
}
const cost = capabilities.live_charge_credits_per_image;
if (
  !Number.isFinite(cost) ||
  cost <= 0 ||
  !capabilities.operations?.includes("text_to_image")
)
  throw new Error("Unsupported or unpriced operation");
const plan = {
  mode: "dry-run-only",
  source,
  approvedCap: cap,
  newSpend: 0,
  optionalRegeneration: [
    {
      role: "background",
      operation: "text_to_image",
      aspect: "16:9",
      estimatedCredits: cost,
      prompt:
        "A quiet top-down botanical research garden for a 2D game, sage green planting beds, warm ivory stone paths, small blue water pools, flat orthographic view, soft painted shapes, no text, no characters. Leave the central horizontal route open.",
    },
  ],
  estimatedTotal: cost,
  withinCap: cost <= cap,
  next: "Use the canonical integrate-game-art workflow to submit only after live capabilities and balance checks. Save idempotency_key and execution_id before continuing; use scripts/resume-art.mjs after uncertainty. This script submits nothing.",
};
console.log(JSON.stringify(plan, null, 2));
