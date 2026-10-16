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
let available = null;
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
  const balance = spawnSync("dreamlayer", ["balance", "--json"], {
    encoding: "utf8",
  });
  if (balance.status !== 0)
    throw new Error(
      "Balance check failed. Resolve authentication before spending.",
    );
  available = JSON.parse(balance.stdout).available;
  if (!Number.isFinite(available))
    throw new Error("Unrecognized balance response; do not submit paid work.");
}
const cost = capabilities.live_charge_credits_per_image;
if (
  !Number.isFinite(cost) ||
  cost <= 0 ||
  !capabilities.operations?.includes("text_to_image")
)
  throw new Error("Unsupported or unpriced operation");
const brief = JSON.parse(await readFile("assets/generation-plan.json", "utf8"));
for (const step of brief.steps)
  if (!capabilities.operations.includes(step.operation))
    throw new Error(`Unsupported operation: ${step.operation}`);
const estimate = brief.steps.length * cost;
const plan = {
  mode: "dry-run-only",
  source,
  approvedCap: cap,
  newSpend: 0,
  availableCredits: available,
  optionalRegeneration: brief.steps.map((step) => ({
    ...step,
    estimatedCredits: cost,
  })),
  estimatedTotal: estimate,
  withinCap: estimate <= cap,
  sufficientBalance: available === null ? null : estimate <= available,
  next: "Use the canonical integrate-game-art workflow to submit only after live capabilities and balance checks. Save idempotency_key and execution_id before continuing; use scripts/resume-art.mjs after uncertainty. This script submits nothing.",
};
console.log(JSON.stringify(plan, null, 2));
