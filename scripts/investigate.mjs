import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";
await mkdir(".local", { recursive: true });
await mkdir("evidence/public", { recursive: true });
const target = JSON.parse(await readFile("reference/target.json", "utf8"));
const code = await readFile(target.artifact, "utf8");
assert.equal(
  createHash("sha256").update(code).digest("hex"),
  target.sha256,
  "Reference bytes changed; rebuild target metadata explicitly.",
);
const rea = resolve("node_modules/rea-agents/scripts/rea.mjs");
function call(args, path) {
  const start = performance.now();
  const result = spawnSync(process.execPath, [rea, ...args, "--json"], {
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });
  if (result.status !== 0)
    throw new Error(result.stderr || result.stdout || "REA failed");
  const evidence = JSON.parse(result.stdout);
  if (!evidence.evidence_id) throw new Error("REA returned no Evidence record");
  return { evidence, seconds: (performance.now() - start) / 1000, path };
}
const analysis = call(
  ["analyze-javascript-application", resolve("reference/artifact")],
  ".local/analysis.json",
);
await writeFile(
  analysis.path,
  JSON.stringify(analysis.evidence, null, 2) + "\n",
);
const graph = analysis.evidence.normalized_result.semantic_graph;
// Select the math read REA located, then its containing function. Do not use the source tree.
const hypot = graph.nodes.find((n) =>
  n.properties?.property_path?.includes("hypot"),
);
assert.ok(hypot?.function_node_id, "REA did not locate the movement math");
const movement = graph.nodes.find((n) => n.node_id === hypot.function_node_id);
await writeFile(
  ".local/trace-request.json",
  JSON.stringify({
    application: analysis.evidence,
    query: {
      seed: { kind: "semantic-node", node_id: movement.node_id },
      direction: "callers",
    },
  }),
);
const trace = call(
  ["trace-javascript-semantics", resolve(".local/trace-request.json")],
  ".local/trace-callers.json",
);
await writeFile(trace.path, JSON.stringify(trace.evidence, null, 2) + "\n");
const result = trace.evidence.normalized_result;
assert.equal(result.status, "found");
const range = movement.identity.source_range;
assert.equal(range.start.line, 1);
assert.equal(range.end.line, 1);
const excerpt = {
  format: "Sanitized excerpt, not an importable REA Evidence record",
  reaVersion: "6.5.0",
  targetSha256: target.sha256,
  analysisEvidenceId: analysis.evidence.evidence_id,
  traceEvidenceId: trace.evidence.evidence_id,
  commands: [
    "rea analyze-javascript-application <absolute reference/artifact> --json",
    "rea trace-javascript-semantics <absolute trace-request.json> --json",
  ],
  observed: {
    movementFunction: movement,
    hypotRead: hypot,
    traceStatus: result.status,
    traceSummary: result.summary,
    traceNodes: result.nodes,
    traceRelations: result.relations,
    evidenceContexts: result.evidence_contexts,
    unknowns: result.unknowns,
  },
  artifactRange: {
    ...range,
    coordinateSystem: "one-based lines, zero-based columns, end exclusive",
    text: code.slice(range.start.column, range.end.column),
  },
  interpretation:
    "The agent read this artifact range: divide input by max(1,hypot(x,y)); multiply by 180 and elapsed clamped to [0,0.05]; clamp x to [16,944] and y to [16,524]. REA located syntax and a caller relation; it did not establish runtime equivalence.",
  limitations: analysis.evidence.limitations,
  traceLimitations: result.limitations,
  measured: {
    analysisSeconds: analysis.seconds,
    traceSeconds: trace.seconds,
    scope:
      "local CLI wall time including process startup; warm installed packages; not CPU/peak memory/token measurement",
  },
  fullEvidence:
    "Regenerate locally with npm run investigate. Complete unmodified records remain under .local/; private absolute workspace paths are omitted from this public excerpt.",
};
await writeFile(
  "evidence/public/movement.json",
  JSON.stringify(excerpt, null, 2) + "\n",
);
console.log(
  JSON.stringify(
    {
      analysisSeconds: analysis.seconds,
      traceSeconds: trace.seconds,
      status: result.status,
      summary: result.summary,
    },
    null,
    2,
  ),
);
