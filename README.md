# Relay garden: REA + DreamLayer game assets

A small playable browser game with a reproducible investigation and honest artwork provenance.
Recover six cells in 90 seconds, stun patrol drones, and return to the dock with your shields intact.
Switch between geometry and artwork without changing the mechanics.

[Play the demo](https://thedesignfounder.github.io/dreamlayer-game-assets/demo/) ·
[Agent workflows](https://github.com/TheDesignFounder/dreamlayer-agent-plugin) ·
[Investigation](docs/rea-workflow.md) · [Verification](docs/verification.md) · [Gameplay recording](docs/relay-garden.webm)

![Relay garden: a ceramic rover, patrol drones and gold cells in a painted greenhouse courtyard](docs/preview.webp)

## Run locally

Node.js 22.19+ on the 22.x line (or another REA-supported version) is required for the pinned REA package. Playing the bundled demo only needs a static web server.

```sh
git clone https://github.com/TheDesignFounder/dreamlayer-game-assets.git
cd dreamlayer-game-assets
npm ci
npm start
```

Open **http://127.0.0.1:4177/demo/**. Use arrow keys, WASD, or the on-screen direction buttons.
Space sends a pulse that stuns nearby drones; it recharges in three seconds. Escape pauses.
No API key, account, credits, or runtime dependency download is required by the game.

## What happened here

1. We authored a small movement reference and minified it into a separate artifact, without a source map.
2. REA 6.5.0 analyzed that artifact and traced the function containing the `Math.hypot` read to its caller.
3. The coding agent interpreted the bounded movement formula and implemented it independently.
4. DreamLayer generated a painted courtyard, a matching six-object sheet, and a transparent cutout.
   We cropped the sheet into the rover, drone, planter, cell, dock and beacon. The interface and effects are code.
5. Automated tests compare 2,000 inputs with the artifact. Browser checks play through the game and verify
   that artwork switching preserves state.

This is a **controlled, self-authored demonstration**, not a blind reverse-engineering benchmark or a
recovered commercial game. REA reports partial static coverage. Its caller relation is evidence, not a
runtime proof. [Read the precise boundaries](docs/rea-workflow.md).

## Reproduce the checks

```sh
npm run build:reference
npm run investigate
npm test
npm run validate:assets
npm run art:plan
```

For the browser test, leave `npm start` running in another terminal:

```sh
npx playwright install chromium
npm run test:browser
# Or use an already-installed Google Chrome:
BROWSER_CHANNEL=chrome npm run test:browser
```

`investigate` runs the pinned REA CLI locally. It retains full unmodified Evidence in ignored `.local/`
and writes a sanitized excerpt in `evidence/public/`. Local paths affect Evidence IDs; compare the
target digest and findings rather than assuming IDs are portable.

## Use the agent workflow

The canonical `integrate-game-art` skill lives in the existing DreamLayer plugin repository. Install the
published workflow commit while its pull request is pending:

```sh
npx skills@1.7.2 add https://github.com/TheDesignFounder/dreamlayer-agent-plugin/tree/7bc11ad78e5238d5acec01dfd5ea584a5d371f87 --skill integrate-game-art --agent codex
```

After the workflow is merged, the same selection works with `TheDesignFounder/dreamlayer-agent-plugin`.
Installing instructions does not connect/authenticate either MCP server. Follow the plugin's
[client setup](https://github.com/TheDesignFounder/dreamlayer-agent-plugin/blob/main/docs/client-setup.md).
REA is optional for ordinary artwork tasks. This example used REA's CLI, the connected DreamLayer MCP
for a capabilities read, and DreamLayer CLI 0.4.0-beta.4 for three completed artwork operations.

## Artwork and cost

**New spend: 3 credits**, within an authorized 10-credit cap. One environment generation, one
reference-based object-sheet edit, and one background removal each used one credit. The authenticated
balance decreased by three credits. [Generation records](assets/generation-records.json) contain the
execution IDs, exact prompts and measured wall times; [the manifest](assets/manifest.json) records the
original output and imported file digests. No new generation is needed to play.

The art approach draws on [DreamLayer Jam production lessons](docs/asset-workflow.md#lessons-from-the-dreamlayer-jam):
consistent references, spaced prop sheets, and explicit anchors. All artwork was generated for this
example. No jam entry's artwork is bundled. The earlier reused robot sample remains in Git history.

`npm run art:plan` submits nothing and defaults to a zero-credit cap. `-- --live --cap NUMBER` refreshes
capabilities and balance with your installed DreamLayer CLI and evaluates an explicitly supplied cap.
It still does not submit anything. `scripts/resume-art.mjs` only checks/downloads an existing execution.
The [recorded plan](assets/generation-plan.json) describes the completed pass; a new pass requires fresh
pricing, authorization and execution IDs. [Asset workflow and reproducible crop import](docs/asset-workflow.md).

The game opens directly with one Play button. `demo/?embed=1` serves the compact game for same-origin
embedding, with no repeated standalone header or explanatory sections. Patrols, shields, pulse and
battery timing are new game design in `demo/expedition.js`; the REA investigation covers movement only.

## Layout and license

- `demo/`: static game, seven gameplay images, and the DreamLayer wordmark.
- `assets/`: original DreamLayer outputs, generation receipts, crop metadata and file manifest.
- `reference/`: controlled source, minified artifact, target digest.
- `scripts/`: local server, investigation, plan/recovery and validation.
- `evidence/public/`: sanitized findings, never private full execution records.

MIT. See [third-party notices](THIRD_PARTY_NOTICES.md). Independent example by DreamLayer; no REA affiliation.
