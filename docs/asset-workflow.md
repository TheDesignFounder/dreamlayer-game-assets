# From artwork requirements to a playable result

The game uses a 960 × 540 logical world and a 16-pixel collision radius. The player art occupies an
88 × 88 display box with a ground anchor. Neither display size nor transparent padding changes physics.

| Role | Bundled implementation | Provenance |
| --- | --- | --- |
| Player | Seven transparent 128 × 128 PNG frames | Existing DreamLayer Agent API sample, unchanged |
| Background | 960 × 540 SVG | Authored vector garden, not AI output |
| Obstacles and cells | Canvas shapes | Authored code, same bounds in both modes |
| Interface | HTML/CSS controls | Authored code, keyboard and touch |

## Reuse and review

The upstream sample is identified by URL, revision, ZIP member, and digest in `assets/manifest.json`.
No new paid call was necessary. The robot's eye/body details vary across frames, so the default is the
first reviewed frame. Animation is opt-in. Left movement mirrors the drawing; it is not a generated
directional turn. The garden's pools and perimeter are decorative; only the three planters block movement.

Manual integration decisions: anchor the sprite above its logical point, preserve transparent borders,
keep the body independent of texture dimensions, and use the delivered frame-duration array. That
array sums to 2,830 ms while the ZIP labels the cycle 2,833 ms. The manifest records both.

## Optional new artwork

The shared workflow remains in the existing plugin: `integrate-game-art`, using
`generate-or-edit-image` or `sprite-sheet-from-reference` and its vendored workflow contract.
The public clients verified on 2026-10-16 were CLI `dreamlayer@0.4.0-beta.4` and
MCP `@dreamlayer/mcp@0.4.0-beta.5`; npm stable was 0.3.0 and did not cover the full sprite workflow.

```sh
npm install -g dreamlayer@0.4.0-beta.4
# Supply DREAMLAYER_API_KEY through your local secret environment, never client code.
dreamlayer capabilities --json
dreamlayer balance --json
npm run art:plan -- --live --cap 0
```

The plan script has no generation path. It shows an optional 16:9 background request and checks it
against the supplied total cap. A zero cap cannot fund it. The recorded capability snapshot reported
one credit for a standard image operation; refresh this before any new request. A cutout is a separate
operation. A new account starts without credits; do not purchase or expand the budget implicitly.

Use the canonical workflow to save a request and unique idempotency key, obtain an execution ID,
poll/resume it, and download to a new path. Reserve all unresolved requests against the total cap.
Do not submit a replacement after a timeout. The local helper only resumes an existing execution:

```sh
node scripts/resume-art.mjs EXECUTION_ID
node scripts/resume-art.mjs EXECUTION_ID ./new-background.png
```

Those placeholders must be replaced with a real existing execution and a new path. The helper calls
the supported `status` and `download` commands, never `generate`. No paid regeneration or live recovery
was exercised in this implementation. The plan and recovery argument paths were tested without spending.

## Validate before integrating

```sh
npm run validate:assets
# With the local game server running:
BROWSER_CHANNEL=chrome npm run test:browser
```

File digests, PNG dimensions and RGBA headers are checked locally. The browser decodes all seven PNGs
and checks transparent and visible pixels, then exercises controls and a complete playthrough. Visual
review is separate from successful import. Optional animation remains a visibly imperfect sample.

For another engine, follow the plugin's Godot/Unity import workflow and actually run that engine.
This example's verification is browser-only; it does not upgrade the historical Unity claims.
