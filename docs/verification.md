# Verification record

Tested October 16, 2026 on macOS with Node.js 22.23.3, npm 10.8.2, REA 6.5.0, esbuild 0.25.12,
Playwright 1.61.0 and Google Chrome 155.0.8059.82.

| Check | Actual result |
| --- | --- |
| REA artifact analysis and callers trace | Executed against the bundled minified game; trace found one caller relation with eight relevant unknowns |
| Independent mechanic and game rules | Eight Node tests pass, including 2,000 deterministic artifact comparisons, drone damage/immunity, pulse cooldown, battery expiry, and completion |
| Asset integrity | Ten file digests: three original outputs and seven runtime images; browser decodes all runtime dimensions and confirms six crops have transparent and visible pixels |
| Recovery | Existing environment execution downloaded again to a new path; SHA-256 matches the original output, with no generation submission |
| Browser game | Keyboard and pointer movement, release outside controls, pause, exact state preservation across skins, six-cell playthrough with pulse input, home-dock win, replay reset |
| Layout | Desktop, 320 px and 390 px viewports; no horizontal overflow; screenshots inspected |
| Motion | All seven runtime assets drawn; reduced motion removes decorative cell bobbing while gameplay continues |
| Workflow | Ten canonical plugin skills sync to all three generated hosts; existing nine Python tests pass |

Warm installed-package REA wall times for the recorded reproducible run were **5.55 seconds** for
analysis and **1.63 seconds** for the trace. They include process startup, are one local observation,
and are not a service latency promise. CPU time, peak memory, model token cost, and cold install time
were not measured. Re-running changes measured times and can change local-path-bound Evidence IDs.

**New image-generation cost: 3 credits**, reconciled with the authenticated balance decrease after
three completed standard operations through DreamLayer CLI 0.4.0-beta.4. The authorized total cap was
10 credits. Environment, reference-based object sheet, and background removal took 48.79, 41.50 and
13.66 seconds respectively, including upload/download and CLI overhead. These are individual observed
wall times, not service latency promises. Currency cost was not measured. No credit purchase or hosted
private CI was performed. Exact execution IDs and prompts are in `assets/generation-records.json`.

The exact commands are in the root README. Browser screenshots and machine-readable results are
written to ignored `test-results/`. Full unmodified REA Evidence remains in ignored `.local/`.

Limitations: a self-authored controlled target, partial static analysis, finite numeric tests, only the tested Chrome browser, and static generated props with code-driven rotation. No native engine,
Unity editor, Godot runtime, other agent host, generated sprite animation, or REA MCP registration is
claimed by this example.

The new workflow was installed in a clean temporary Codex project with skills 1.7.2 and discovered by its project skill listing. Codex used the installed instructions for the bundled-asset path and live DreamLayer MCP capabilities read. Other agent hosts were not exercised for this new skill. The separately installed MCP beta.5 package passed initialization/tools-list with its built-in schemas after a deliberately invalid probe key was rejected; that probe is not an authenticated generation test.

Public installation uses an exact workflow commit. skills 1.7.2 parses a slash-containing `tree/feat/rea-game-assets` URL as branch `feat` plus a path, so the documented command pins the tested commit instead. The failed branch-URL attempt was corrected before final delivery.
