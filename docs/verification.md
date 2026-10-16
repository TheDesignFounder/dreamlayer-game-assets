# Verification record

Tested October 16, 2026 on macOS with Node.js 22.23.3, npm 10.8.2, REA 6.5.0, esbuild 0.25.12,
Playwright 1.61.0 and Google Chrome 155.0.8059.82.

| Check | Actual result |
| --- | --- |
| REA artifact analysis and callers trace | Executed against the bundled minified game; trace found one caller relation with eight relevant unknowns |
| Independent mechanic | Four Node tests pass, including 2,000 deterministic comparisons with the artifact |
| Asset integrity | Eight file digests; seven 128 × 128 RGBA frames; browser confirms nonempty transparent and visible pixels |
| Browser game | Keyboard and pointer movement, release outside controls, pause, exact state preservation across skins, six-cell playthrough, home-dock win, replay reset |
| Layout | Desktop, 320 px and 390 px viewports; no horizontal overflow; screenshots inspected |
| Motion | All seven frames drawn during movement; reduced motion verified to draw only frame one |
| Workflow | Ten canonical plugin skills sync to all three generated hosts; existing nine Python tests pass |

Warm installed-package REA wall times for the recorded reproducible run were **5.55 seconds** for
analysis and **1.63 seconds** for the trace. They include process startup, are one local observation,
and are not a service latency promise. CPU time, peak memory, model token cost, and cold install time
were not measured. Re-running changes measured times and can change local-path-bound Evidence IDs.

**New image-generation cost: 0 credits.** Reused sample history reports 6.8 credits in total. Historical
generation runtime and currency cost are unavailable. No paid generation, purchase, or hosted private CI
was run. Standard image capability pricing was checked live; this is not a live generation test.

The exact commands are in the root README. Browser screenshots and machine-readable results are
written to ignored `test-results/`. Full unmodified REA Evidence remains in ignored `.local/`.

Limitations: a self-authored controlled target, partial static analysis, finite numeric tests, optional
animation with detail drift, and only the tested Chrome browser. No native engine, Unity editor,
Godot runtime, other agent host, new paid artwork, or REA MCP registration is claimed by this example.

The new workflow was installed in a clean temporary Codex project with skills 1.7.2 and discovered by its project skill listing. Codex used the installed instructions for the bundled-asset path and live DreamLayer MCP capabilities read. Other agent hosts were not exercised for this new skill. The separately installed MCP beta.5 package passed initialization/tools-list with its built-in schemas after a deliberately invalid probe key was rejected; that probe is not an authenticated generation test.
