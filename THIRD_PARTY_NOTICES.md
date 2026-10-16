# Attribution and provenance

The painted environment and six game objects were generated for this example through the DreamLayer
Agent API on October 16, 2026. Three original output files are in `assets/source/generated/`;
`assets/generation-records.json` records their prompts and execution IDs. The runtime environment is
resized and encoded as WebP; the six objects are crops of the background-removed sheet with transparent
padding. `assets/crops.json` describes those transforms, and `assets/manifest.json` contains all hashes.
These outputs are distributed by DreamLayer AI under the root MIT license.

The earlier bootstrap in revision `e628b3d` reused seven frames from
[`examples/source/walk.zip`](https://github.com/TheDesignFounder/dreamlayer-agent-plugin/blob/a0244b6/examples/source/walk.zip)
in the MIT-licensed DreamLayer agent-plugin repository. Those files have been replaced in the current
runtime; their original attribution and provenance remain in Git history.

DreamLayer Jam entries informed the production workflow, as linked in `docs/asset-workflow.md`.
No artwork from those entries is bundled. Canvas effects, HTML/CSS, gameplay code and the controlled
reference are authored for this example under the root MIT license. Preview media captures this game.

REA (`rea-agents` 6.5.0, MIT), esbuild (0.25.12, MIT), and Playwright (1.61.0, Apache-2.0) are development
dependencies installed from npm. Their own license files ship with their packages. The optional crop
import uses Pillow 11.3.0 (HPND). REA is authored by its upstream contributors:
<https://github.com/morluto/rea>. No REA source or commercial game files are redistributed here.
This example is independent and does not imply a partnership or endorsement.
