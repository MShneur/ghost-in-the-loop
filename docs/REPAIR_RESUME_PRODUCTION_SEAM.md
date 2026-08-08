# Repair & Resume Production-Path Test Seam

Assignment: `R2-W2-RR-PROD-SEAM`

## Repository call graph

The real browser path is:

1. `renderRunTab()` evaluates `runtimeServiceHealth()` and conditionally renders `#g-repair-resume`.
2. `bind()` attaches `#g-repair-resume` directly to `repairAndResume`.
3. `repairAndResume()` obtains a side-effect-free `runtimeServiceHealth()` snapshot.
4. Hard blockers stop the ticker, preserve a paused/error state, record `GHOST.lastRepair`, write a timeline event, render, and return `{ok:false,...}`.
5. Non-blocked repair clears stale element caches and targets only services listed in `before.repairable`.
6. The function revalidates tab ownership before resuming.
7. It records the repaired service list, whether the prior run was safely resumed, and returns `{ok:true,resumed,repaired,blocked:[]}`.

The health model distinguishes repairable services including ticker, heartbeat, tab lease, Ghost bus, composer cache/observer, panel, and network observer. It separately blocks unsafe Send journal state, route drift, and a foreign tab lock.

## Selected seam

Use harness injection into the existing closure, following the established `tests/e2e/sendsafety.spec.js` pattern. The Playwright test reads the real userscript as text and inserts a minimal test facade immediately before the outer boot catch while closure-local names remain in scope.

Proposed injected facade:

```js
window.__GITL_Test = Object.freeze({
  runtimeHealth: overrides => runtimeServiceHealth(overrides),
  requestRepair: () => repairAndResume(),
  lastRepair: () => structuredClone(GHOST.lastRepair || null),
  loopSnapshot: () => ({
    state: GHOST.loop.state,
    phase: GHOST.loop.phase,
    detail: GHOST.loop.detail,
    timer: GHOST.loop.timer,
    route: GHOST.loop.route
  }),
  tickerMode: () => Ticker.mode
});
```

The facade is not committed into ordinary runtime code. It exists only in the transformed script string loaded by Playwright. This is narrower than adding a production debug flag, URL switch, global mutable hook, or second repair implementation.

## Why this seam is safe

- `requestRepair()` calls the existing closure-local `repairAndResume()` directly.
- It exposes no Send function, adapter actuator, prompt writer, or state override.
- Returned snapshots are copied or newly allocated, preventing tests from mutating live loop objects through the facade.
- `runtimeHealth(overrides)` uses the existing explicit override seam already designed for independent health-model testing; overrides influence the snapshot only and do not dispatch.
- The browser fixture can instrument DOM event counts and existing service boundaries externally without adding another production authority.
- Ordinary userscript and generated extension output remain unchanged when only the Playwright transformation is added.

## Rejected alternatives

1. **Production `window.__GITL_Test` flag** — rejected because page scripts could discover or invoke it and it would require generated-artifact changes.
2. **Click only `#g-repair-resume`** — insufficient alone because it does not expose deterministic return values or health snapshots and makes blocker diagnosis timing-dependent.
3. **Synthetic `window.__RR` model** — rejected as certification evidence because it duplicates intended behavior instead of invoking production control flow.
4. **Exporting `repairAndResume` from a new module** — rejected as a broad refactor for a narrow evidence gap.
5. **Monkey-patching the sole Send actuator** — unnecessary and riskier; zero Send can be proven with DOM click/submit/input event counters and unchanged composer value.

## Deterministic assertions

### Single-flight request behavior

The current `repairAndResume()` is synchronous. Two sequential calls can therefore each complete; the browser contract must define the user-visible single-flight boundary around event scheduling rather than assume a promise lock exists.

Worker 3 should first add a failing browser case that dispatches two repair clicks in the same task or invokes `requestRepair()` twice before a scheduled service repair settles. Production code should change only if this proves duplicate restart behavior.

Required assertions:

- One accepted repair timeline transition for one unhealthy snapshot.
- Each failed service restart count increases by exactly one.
- Healthy service identities/counters do not change.
- The second request either observes no remaining repairable service or is explicitly coalesced.

### Zero Send actuation

For every repair scenario:

- composer submit count remains `0`;
- reviewed Send button click count remains `0`;
- keyboard Enter dispatch count remains `0`;
- composer value is unchanged;
- no continuation prompt is inserted.

The facade intentionally provides no path to Send.

### Blockers

Using repository-owned state transitions or existing `runtimeServiceHealth(overrides)` snapshot tests, prove:

- unsafe Send journal -> blocked/error, no resume;
- route change -> blocked/paused, no resume;
- foreign lease -> blocked/paused, no service mutation requiring ownership;
- lease lost after initial snapshot -> second ownership check blocks resume.

### DOM replacement

Replace the composer subtree, retain listeners on the stale nodes, then request repair. Assert stale nodes receive no input, click, submit, or keyboard events and the new composer is rediscovered at most once.

## Instrumentation boundaries

Test counters may wrap these boundaries in the transformed harness or fixture DOM:

- `Ticker.start` and `Ticker.stop`;
- `startTabHeartbeat`;
- `GhostBus.connect` where available;
- `_clearElementCaches`;
- composer redetection/observer entry point;
- panel render/mount entry point;
- network witness start entry point;
- DOM Send click/submit/input/keydown events.

Wrappers must delegate to the original function and restore identity when the test ends. They must not replace production decisions or force a pass.

## Generated parity

- A fixture-only Playwright transformation does not change `ghost-in-the-loop.user.js` or `extension/content.js`; generated parity is therefore unaffected.
- If Worker 3 changes production source after a reproduced failure, it must regenerate `extension/content.js` with the canonical build script and run `npm run check:generated` plus extension certification.

## Required implementation files

Preferred narrow scope:

- `tests/e2e/repair-resume-production.spec.js`
- optional dedicated mock page under `tests/e2e/`

Production files are allowed only after a failing production-path browser test demonstrates a defect.

## Commands

```sh
node --check tests/e2e/repair-resume-production.spec.js
npx playwright test tests/e2e/repair-resume-production.spec.js --project=chromium
npm test
npm run check:generated
npm run certify:extension
```

The final three commands become mandatory when production source changes; otherwise record them as not applicable or not run rather than implying a pass.
