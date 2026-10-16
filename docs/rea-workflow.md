# A bounded movement investigation

Question: **Does diagonal input change speed, and what happens after a long frame?**

The input is `reference/artifact/`, a small self-authored JavaScript game, minified by esbuild 0.25.12
without a source map. Origin, license, version, and SHA-256 are in `reference/target.json`.
The editable reference source is intentionally outside that directory. This is a controlled demonstration;
the same implementing agent authored the target, so it is not a blind evaluation.

## Run REA

```sh
npm ci
npm run investigate
```

The script invokes the following equivalent commands with absolute local paths:

```sh
npx --no-install rea-agents analyze-javascript-application "$PWD/reference/artifact" --json
npx --no-install rea-agents trace-javascript-semantics "$PWD/.local/trace-request.json" --json
```

The second request contains the complete first Evidence record and a `callers` query seeded by the
function enclosing REA's `hypot` property-read node. The script selects that node from the result,
not from a guessed function name. Full records remain in `.local/`; the public excerpt contains the
function, read, caller relation, source range, Evidence IDs, contexts, and limitations. It is an excerpt,
not a modified record that can be imported into REA.

This was tested through the REA CLI. No REA MCP registration or native engine is required. The
[REA MCP installation guide](https://github.com/morluto/rea/blob/main/docs/installation.md) describes
the separate agent-client setup. Installing a skill alone does not register that server.

## Observation, interpretation, verification

REA located the `Math.hypot` property read inside function `i` at line 1, columns 0–188 of the minified
artifact. Its callers trace found one call-site relation, traversed two nodes, and retained eight
relevant unknowns. The analysis parses inert syntax and does not execute the target. Coverage is partial.

An initial numeric-literal query for `180` returned no seed matches with partial status. We did not
interpret that as proof the number was absent; the function's returned source range was the useful evidence.

The agent read the bytes in that range and derived this specification for finite numeric inputs:

```text
divisor = max(1, hypot(input.x, input.y))
elapsed = clamp(seconds, 0, 0.05)
x = clamp(x + input.x / divisor * 180 * elapsed, 16, 944)
y = clamp(y + input.y / divisor * 180 * elapsed, 16, 524)
```

This means a full cardinal or diagonal input moves nine logical pixels in 50 ms. An input magnitude
below one keeps its analog magnitude. A two-second stall still advances only nine pixels. The fixed
world is 960 × 540 with a 16-pixel body radius.

These arithmetic conclusions are the agent's interpretation of the artifact, not numeric assertions
automatically proved by REA. `npm test` executes both the artifact export and the independent
`demo/mechanics.js` implementation over 2,000 deterministic cases, plus explicit boundary cases.
Only then is `reference/source/game.js` used as a readable ground-truth check. Finite testing does not
prove equivalence for every JavaScript value.

## Scope

The collectible, obstacle sliding, home dock, interface, and win condition are new game design. They are
outside the recovered movement primitive. Changing skins changes the renderer, never its logical
radius, movement constants, or state. A complete browser playthrough checks the resulting game.

REA's graph coverage, unresolved call/builtin facts, and runtime uncertainty remain visible in
`evidence/public/movement.json`. No claim is made about arbitrary games, native binaries, automatic
project conversion, recovered art, or tested Unity/Godot integration for this example.
