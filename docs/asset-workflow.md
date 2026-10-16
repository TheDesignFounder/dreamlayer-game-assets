# From artwork requirements to a playable result

The game uses a 960 × 540 logical world and a 16-pixel collision radius. Player art fits a 48 × 54
box centered on its logical position. Transparent padding and image resolution never enter physics.

| Role | Bundled implementation | Provenance |
| --- | --- | --- |
| Environment | 1920 × 1080 WebP | Delivery copy of a DreamLayer 2560 × 1440 PNG |
| Rover, drone, planter, cell, dock, beacon | Six transparent PNG crops | One DreamLayer object-sheet edit and background removal |
| Shadows, status rings, pulse, geometry view | Canvas shapes | Authored code |
| Interface | HTML/CSS controls | Authored code, keyboard and touch |

## Three operations, one visual reference

We generated a sunlit solarpunk courtyard with cream ceramic machines, jade foliage and brass fittings.
After inspecting that result, we supplied it as the reference for a six-object sheet. A separate
DreamLayer background-removal operation produced actual RGBA pixels, including the dock's open center.
All three operations completed through `dreamlayer@0.4.0-beta.4` on October 16, 2026.

[Generation records](../assets/generation-records.json) preserve the exact prompts, execution IDs,
completed status and measured wall times: 48.79 seconds for the environment, 41.50 for the object sheet,
and 13.66 for removal. These include CLI/upload/download overhead and are single-run observations.
The three standard operations cost one credit each; the authenticated balance decreased by three.
The approved cap was ten credits. No retries or replacement generations were needed.

The three original PNGs remain unchanged in `assets/source/generated/`. The reviewed import script
splits the 1365 × 768 sheet into a three-by-two grid, trims each cell to nonzero alpha, and adds eight
transparent pixels per edge. It rejects empty cells or artwork touching a cell boundary. Six crops,
source coordinates, output sizes and the environment's delivery transform are in
[crops.json](../assets/crops.json). This processing crops and encodes existing images; it does not paint
new artwork. To reproduce it in an isolated Python environment:

```sh
python3 -m venv .local/art-tools
.local/art-tools/bin/pip install Pillow==11.3.0
.local/art-tools/bin/python scripts/import-art.py
npm run validate:assets
```

The final runtime images total about 1.06 MB. We inspected the full sheet, the cutout, and the game at
actual play size. The still rover rotates with movement; no sprite animation was generated. Reduced
motion disables decorative cell bobbing. Foliage at the scene's boundary is decorative. The three
planters use the same explicit collision rectangles in both visual modes.

## Lessons from the DreamLayer Jam

- [Underbloom, by Mo](https://motawe3.itch.io/underbloom) establishes a species reference and derives
  related assets from it. We used the courtyard as the palette and texture reference for all objects.
- [Attar, by huseyinbuyukbayram](https://huseyinbuyukbayram.itch.io/attar) puts spaced props on a shared
  sheet, performs one cutout, and crops individual files. Our six-object sheet follows that production approach.
- [The Last Lamplighter, by Nabeel Hassan](https://nabeelbaghoor.itch.io/the-last-lamplighter) connects
  artwork to game state and records practical pivot and scale fixes. Our dock beacons show collected
  energy, while explicit anchors keep visual placement independent of collision bounds.

These informed the workflow and original art brief. No jam artwork is bundled in this repository.
The earlier bootstrap used public DreamLayer robot frames; its provenance remains in revision `e628b3d`.

## Make another art pass

The shared workflow remains in the existing plugin: `integrate-game-art`, using
`generate-or-edit-image` or `sprite-sheet-from-reference` and its vendored workflow contract.
The public clients checked on 2026-10-16 were CLI `dreamlayer@0.4.0-beta.4` and
MCP `@dreamlayer/mcp@0.4.0-beta.5`; npm stable was 0.3.0 and did not cover the full sprite workflow.

```sh
npm install -g dreamlayer@0.4.0-beta.4
# Supply DREAMLAYER_API_KEY through your local secret environment, never client code.
dreamlayer capabilities --json
dreamlayer balance --json
npm run art:plan -- --live --cap 0
```

The plan script has no generation path. It displays the recorded operations from
`assets/generation-plan.json`, with prompts and destinations, and evaluates their estimate against the
supplied cap and live balance. A zero cap cannot fund a new pass. Confirm the configured key belongs
to the intended account, refresh prices and establish a total cap before generating. Cutout is a
separate operation. Never infer spending authorization from a funded balance.

Use the canonical workflow to save a request and unique idempotency key, obtain an execution ID,
poll/resume it, and download to a new path. Reserve unresolved requests against the total cap.
Do not submit a replacement after a timeout. The local helper only resumes an existing execution:

```sh
node scripts/resume-art.mjs EXECUTION_ID
node scripts/resume-art.mjs EXECUTION_ID ./new-background.png
```

Replace the placeholders with a real existing execution and a new path. The helper uses supported
`status` and `download` commands and refuses to overwrite an existing file. We recovered the completed
environment execution to a new local path and verified its SHA-256 against the original download;
no replacement generation was submitted.

## Validate before integrating

```sh
npm run validate:assets
# With the local game server running:
BROWSER_CHANNEL=chrome npm run test:browser
```

Validation checks ten file digests, source PNG dimensions, runtime formats and generation records.
The browser decodes all seven runtime images, checks six crops for visible and transparent pixels,
confirms every image is drawn, and exercises a complete playthrough. Successful import is separate
from visual review. Artwork/geometry switching preserves the exact game state.

For another engine, follow the plugin's Godot/Unity import workflow and run that engine.
This example's verification is browser-only; it does not upgrade the historical Unity claims.
