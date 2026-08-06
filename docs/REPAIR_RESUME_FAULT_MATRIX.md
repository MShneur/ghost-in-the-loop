# Repair & Resume Browser Fault Matrix

Status: implementation contract for `R1-W2-RR-FAULT-MATRIX`.

## Safety invariants

1. Repair may restart failed observation or rendering services, but it must not invoke the reviewed Send actuator.
2. Each failed service is restarted at most once per accepted repair attempt.
3. Route, tab-lease, composer, or dispatch uncertainty fails closed and leaves the loop paused.
4. A detached or replaced DOM node is never reused merely because it matches stale cached identity.
5. Repeated repair requests coalesce; they do not produce duplicate resume transitions, observers, timers, or sends.

## Deterministic browser matrix

| Fault | Fixture injection | Observable current contract | Required assertion |
|---|---|---|---|
| Detached composer/input | Remove the active composer subtree after pause and before repair; insert a structurally equivalent replacement with a new node identity | Cached input/send nodes must be rejected and rediscovered | Repair either binds the replacement once or remains paused; old nodes receive no events |
| Transient unavailable controls | Remove the reviewed Send control while retaining the composer; restore it after one bounded retry point | Missing actuator is uncertainty, not permission to select a heuristic substitute | No trap/control is clicked; repair remains non-dispatching and may resume only after reviewed control verification |
| Interrupted generation | Set generation/busy state during pause, then clear it after repair begins | Repair must not treat an incomplete assistant turn as a new stable latest answer | No continuation dispatch while busy; one observation restart after stable completion |
| Route replacement | Change pathname/history state and replace the conversation root between pause and repair | Route identity captured before repair is stale | Repair aborts or requires a fresh explicit resume context; stale conversation state is not resurrected |
| Foreign tab lease | Replace the stored lease with a non-expired lease owned by another tab before repair | Current tab lacks authority | Repair fails closed; no service restart that mutates shared loop state and no Send actuation |
| Stale self lease | Expire or invalidate the current tab lease during repair | Ownership must be reacquired and revalidated, not assumed | No continuation until lease validation succeeds; failed validation leaves paused state intact |
| Repeated repair requests | Trigger Repair & Resume twice before the first attempt settles | Repair is a single-flight operation | Exactly one accepted repair transition and at most one restart per failed service |
| Observer/timer failure | Disconnect the answer observer or clear the polling timer while preserving other services | Health-driven repair should target only unhealthy services | Failed service restarts once; healthy services retain identity and are not duplicated |
| Render/UI failure | Remove the Ghost UI mount while loop state remains paused | Rendering recovery is separate from dispatch authority | UI is recreated once without changing choice state or invoking Send |
| Uncertain prior dispatch | Mark the last dispatch outcome unknown before repair | At-most-once Send dominates progress | Repair is blocked with explicit uncertainty; Send count remains unchanged |

## Playwright fixture hooks

A focused `tests/e2e/repair-resume.spec.js` should expose only test instrumentation from the real userscript, following the existing `sendsafety.spec.js` pattern:

- `window.__GITL_Test.healthSnapshot()` — immutable service-health and route/lease snapshot.
- `window.__GITL_Test.requestRepair()` — invokes the real reviewed Repair & Resume path.
- `window.__GITL_Test.serviceStarts` — counters keyed by observer, timer, render, and adapter services.
- `window.__GITL_Test.sendAttempts` — incremented immediately before the sole Send actuator call.
- `window.__GITL_Test.repairState()` — idle, repairing, resumed, or blocked plus reason.

Instrumentation must be injected by the test harness and must not add a second production dispatch path.

## Minimum browser scenarios

### Scenario A: detached composer, safe recovery

1. Boot the real script against a mock reviewed adapter.
2. Pause with a verified composer and Send node.
3. Record node identities and service-start counters.
4. Replace the complete composer subtree.
5. Request repair twice without awaiting the first request.
6. Assert old nodes receive zero input/click events.
7. Assert the replacement is verified once.
8. Assert every failed service start counter increases by exactly one.
9. Assert `sendAttempts` remains zero.

### Scenario B: uncertain dispatch blocks repair

1. Establish paused state after a synthetic dispatch whose result is marked unknown.
2. Request repair.
3. Assert state is `blocked` with an uncertainty reason.
4. Assert service and Send counters do not imply continuation.
5. Restore certainty only through the normal reviewed state transition, never a test-only bypass.

### Scenario C: route or lease drift

1. Capture the original route and owned lease.
2. Change either the route or lease before repair.
3. Request repair.
4. Assert no stale state is resumed and Send remains untouched.

## Existing adjacent coverage

- `tests/e2e/sendsafety.spec.js` proves trap controls and unreviewed Send-looking controls are rejected.
- `tests/e2e/routefix.spec.js` is the adjacent route-browser surface.
- `tests/health.test.js`, route/state tests, and lease tests should remain the unit-level oracle for targeted service health and ownership transitions.

These tests do not by themselves prove browser-level Repair & Resume single-flight behavior or zero Send actuation during repair; the new fixture must connect those invariants in one real-browser path.

## Builder acceptance contract

Worker 3 should implement the smallest test harness needed to run Scenarios A–C. Production code should change only after a deterministic failing browser test proves a defect. Required negative assertions are:

- `sendAttempts === 0` for every repair-only scenario.
- Each failed service restart delta is exactly `1`.
- Each healthy service restart delta is `0`.
- Duplicate repair requests produce one accepted transition.
- Route or lease drift ends blocked/paused, never resumed.
- Unknown prior dispatch remains blocked.
- Replaced DOM nodes are rediscovered and stale identities receive no events.

Recommended focused command:

```sh
npx playwright test tests/e2e/repair-resume.spec.js --project=chromium
```

Then run relevant unit tests, generated parity when production changes, and the ordinary browser matrix required by the assignment.
