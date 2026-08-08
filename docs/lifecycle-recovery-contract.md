# Ghost 8.8 lifecycle recovery contract

Status: Round 4 research/specification contract for `LIFECYCLE-FROZEN-DISCARDED`.

This document defines the browser-observable lifecycle cases Ghost may safely use. It is intentionally narrower than browser internals: unsupported lifecycle signals must not be invented, and a lifecycle event must never create Send authority.

## Repository call graph

Current production recovery on `agent/8.8-repair-resume` has one central gate:

`visibilitychange/pageshow/focus/resume -> recoverAfterWake(source)`

`recoverAfterWake` currently:

1. refuses recovery while `document.visibilityState` is non-visible;
2. deduplicates wake attempts with `_wakeRecovery.inFlight` and a 750 ms single-flight window;
3. snapshots whether the loop was `RUNNING`, whether the conversation route changed, and whether Send is pending/dispatching/uncertain;
4. clears cached DOM references;
5. stops the ticker, clears and restarts the tab heartbeat, reclaims the tab lock, closes/recreates GhostBus, and re-detects the host DOM;
6. pauses fail-closed on an uncertain Send, a changed route, or a conflicting tab lease;
7. only if the pre-wake state was `RUNNING` and no blocker exists, starts one ticker and schedules one immediate `engineTick`;
8. leaves non-running states non-running.

The source already listens for Chromium `resume`; it does not currently listen for `freeze` and does not inspect `document.wasDiscarded`.

A newly loaded userscript document initializes `GHOST.loop.state` to `IDLE`, so a genuine discard/reload starts from a fresh in-memory loop rather than resurrecting a prior `RUNNING` object.

## Authoritative platform constraints

### Visibility/backgrounding

`Document.visibilityState` and `visibilitychange` are broadly supported and indicate visible versus hidden state. They do **not** prove that the browser froze or discarded the document.

Primary reference: https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilityState

### BFCache restoration

`pageshow` is a cross-browser page-transition signal. `PageTransitionEvent.persisted === true` indicates restoration from a cached session-history entry and is the portable signal Ghost may use for BFCache-specific test cases.

Primary references:

- https://html.spec.whatwg.org/multipage/nav-history-apis.html#the-pagetransitionevent-interface
- https://developer.mozilla.org/en-US/docs/Web/API/Window/pageshow_event
- https://web.dev/articles/bfcache

### Chromium freeze/resume

Chromium exposes `freeze` and `resume` lifecycle events. Frozen pages suspend freezable task queues; Chromium recommends treating `resume` as a reactivation signal and warns that lifecycle-event reliability/order is not identical across browsers. Ghost may use `resume` when exposed but must keep `visibilitychange`/`pageshow`/`focus` as portable recovery signals.

Primary reference: https://developer.chrome.com/docs/web-platform/page-lifecycle-api

### Discarded documents

Discard has no reliable event at the moment the browser discards a document. Chromium can expose `document.wasDiscarded` on the newly loaded document after a discard. The Chrome documentation still describes this as a Chromium capability and historically notes incomplete Android support, so Ghost must feature-detect it and must not claim equivalent Firefox/mobile support without separate evidence.

Primary references:

- https://developer.chrome.com/docs/web-platform/page-lifecycle-api
- https://chromium.googlesource.com/chromium/src/+/main/content/public/browser/web_contents.h

## Lifecycle fault matrix

| Case | Observable injection | Expected Ghost outcome | Safety invariant |
| --- | --- | --- | --- |
| Background -> foreground | `visibilitychange`, hidden then visible | one recovery gate when visible | zero Send actuation |
| App/tab return | `focus` after visibility is visible | same central recovery gate | zero Send actuation |
| Chromium frozen -> resumed | `resume` where supported | same central recovery gate; duplicate nearby wakes coalesce | zero Send actuation |
| BFCache restore | `pageshow` with `persisted=true` | rebuild stale runtime/DOM services through the same gate | zero Send actuation |
| Duplicate wake burst | repeated `resume`/`pageshow`/`focus` within 750 ms | at most one rebuild/start sequence | one ticker maximum |
| Prior state `RUNNING` | any valid visible wake | rebuild services then resume `RUNNING` only if route, lease and Send journal are safe | exactly one ticker; no synthetic Send |
| Prior state `PAUSED` | any wake | rebuild services but remain non-running | no automatic resume or Send |
| Prior state `CHOICE` | any wake | rebuild services but remain `CHOICE` | human choice remains authoritative |
| Send pending/dispatching/uncertain | any wake | convert dispatching to uncertain when needed, pause/error, require reconciliation | never retry Send automatically |
| Route changed while hidden | visible wake | pause | stale conversation work must not resume |
| Another tab owns lease | visible wake from prior `RUNNING` | pause | no cross-tab double execution |
| Browser discards document | fresh document load; `document.wasDiscarded` only when exposed | fresh boot remains non-running; optional diagnostic classification may record discard | stale in-memory work cannot be resurrected |
| `freeze` notification | Chromium-only `freeze` | may quiesce disposable runtime resources, but must never be treated as a resume or Send trigger | no Send; no new autonomous work |

## Competing implementation philosophies

### Minimal recovery seam

Keep `recoverAfterWake` as the sole reactivation path. Add only feature-detected discard classification and executable production-path tests. Do not add `freeze` teardown unless testing proves a resource/eligibility problem. This minimizes browser-specific code and reduces accidental duplicate lifecycle handling.

Failure mode to watch: hidden/frozen resources could remain open longer than desirable on Chromium.

### Lifecycle-aware quiesce/resume

Add a narrow Chromium `freeze` handler that stops or releases disposable resources, then let `resume`/portable wake signals rebuild through `recoverAfterWake`.

Failure mode to watch: a browser-specific freeze path can diverge from the existing single recovery seam, introduce duplicate service churn, or accidentally change loop state.

### End-user lens

Users primarily care that returning to a backgrounded mobile tab does not silently reload into lost work, duplicate actions, or stall. Reports in Chrome user communities describe tabs reloading after brief backgrounding or under memory pressure, including on Android. Those reports are anecdotal rather than browser contracts, but they make discard/reload behavior a practical user-facing case rather than a theoretical edge condition.

Secondary examples:

- https://www.reddit.com/r/chrome/comments/1rqmon8/tabs_keep_refreshing_on_android_chrome/
- https://www.reddit.com/r/chrome/comments/pmt40p/chrome_android_keep_chrome_from_discarding_tabs/

## Deterministic test seams

### Jest/source contract

A focused unit/spec test may extract `recoverAfterWake` and the lifecycle listener block from `ghost-in-the-loop.user.js` and assert:

- visibility-only recovery;
- 750 ms single-flight guard;
- service teardown/rebuild calls;
- `RUNNING`-only ticker restart;
- `PAUSED`/`CHOICE` non-resumption by construction;
- uncertain-Send, route-change, and competing-lease pauses;
- absence of `engineSend(` from `recoverAfterWake`;
- portable listeners plus feature-detected `resume`.

### Playwright/production-path fixture

Without adding a persistent production debug API, a controlled fixture can:

1. inject the production userscript into a deterministic host DOM;
2. override `document.visibilityState` in the fixture only and dispatch `visibilitychange`;
3. dispatch `focus`;
4. dispatch `new PageTransitionEvent('pageshow', { persisted: true })`;
5. dispatch `resume` in Chromium;
6. emulate a discard as a new document and, where possible, define `document.wasDiscarded=true` before userscript evaluation;
7. instrument fixture-visible timer/worker/observer/lock/bus calls or source-transform only the test copy to count restarts;
8. assert zero submit/click/keydown/input Send activity throughout.

Do not use `chrome://discards` as the only CI mechanism: Chrome documents it as a useful manual test surface, but deterministic CI needs a controlled seam and an explicit statement of what is simulated versus browser-real.

## Implementation-ready acceptance criteria for A2

A2 should choose the smallest change supported by executable evidence:

1. Preserve `recoverAfterWake` as the single reactivation gate.
2. Keep `visibilitychange`, `pageshow`, `focus`, and feature-detected `resume` routed through it.
3. If discard classification is added, feature-detect `document.wasDiscarded`; on a discarded fresh boot, record diagnostics only and remain non-running unless the user explicitly starts/resumes work.
4. Do not infer that hidden means frozen or discarded.
5. Do not add a new Send path, synthetic resume prompt, or reload-based recovery.
6. `RUNNING` wake: at most one ticker/heartbeat/bus/observer/lock rebuild sequence per recovery window.
7. `PAUSED` and `CHOICE`: rebuild runtime support if necessary but never transition to `RUNNING` solely because of lifecycle activity.
8. Send pending/dispatching/uncertain, route change, or foreign lease: remain fail-closed.
9. Demonstrate BFCache with `pageshow.persisted=true` in the harness.
10. Demonstrate discard/reload semantics as a fresh document; separately label whether `document.wasDiscarded` is browser-real or fixture-injected.
11. Keep userscript/generated-extension parity for any product change.

## Open evidence gap

The repository has source-level wake tests but no dedicated executable freeze/discard production-path fixture yet. A2 should first attempt to satisfy this contract with executable coverage; production code should change only where that coverage proves a concrete gap.
