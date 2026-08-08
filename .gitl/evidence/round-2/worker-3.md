# Ghost Worker Evidence

## Identity
- Round: 2
- Worker: 3
- Role: Builder
- Assignment ID: R2-W3-RR-PROD-INSTRUMENT
- Started at: 2026-08-06T17:50:00-04:00
- Finished at: 2026-08-06T18:02:00-04:00

## State Read
- Branch: `agent/8.8-repair-resume`
- Starting head: `ff17c93f022bd3c9221c04058026748b9b4b7837`
- Lease state: claimed by Worker 3 in commit `e6d521241158e48a973a52118929807862060b92`
- Dependencies: `R2-W2-RR-PROD-SEAM:submitted`

## Step Performed

Implemented `tests/e2e/repair-resume-production.spec.js`, a Playwright-only transformed-userscript fixture that invokes the real closure-local `repairAndResume()` path.

The injected test facade exists only in the Playwright script string. It exposes health snapshots, a direct call to the real repair function, immutable counters/snapshots, and a bounded paused-ticker fault injector. It exposes no Send actuator, adapter dispatch function, prompt writer, or production debug global.

The fixture records production service-boundary counters and asserts:

- one ticker restart for one paused ticker fault;
- no second ticker restart on a second repair request after the service is healthy;
- zero submit, click, input, or keydown actuation on the composer and reviewed Send control;
- unchanged composer content;
- fail-closed route, foreign-lease, and unsafe-journal health states;
- stale detached composer nodes receive no repair-time events.

No product source or generated extension artifact changed.

## Research Sources
- Repository evidence: `docs/REPAIR_RESUME_PRODUCTION_SEAM.md` defines the accepted transformed-closure seam and required assertions.
- Repository evidence: `.gitl/evidence/round-2/worker-2.md` requires real production-path invocation and prohibits invented single-flight claims.
- Repository evidence: `tests/e2e/sendsafety.spec.js` establishes the existing closure-injection pattern.
- Inference: because `repairAndResume()` is synchronous, the fixture tests idempotent second-call behavior after the first repair completes rather than claiming promise-level coalescing.

## Changes
- Added `tests/e2e/repair-resume-production.spec.js`.
- Implementation commit: `8bf2bde529d3e43c976e0be1b38ce08ab562510a`.
- Product source changed: no.
- Generated artifacts changed: no.
- Temporary files: none.

## Tests
- Node syntax check: NOT RUN — no local execution tool was available for repository checkout.
- Focused Playwright Chromium: NOT RUN — no GitHub Actions run appeared for exact head `8bf2bde529d3e43c976e0be1b38ce08ab562510a`.
- Focused Jest: NOT RUN.
- Full unit suite: NOT RUN.
- Generated parity: NOT APPLICABLE because production source and generated extension output were unchanged.
- CI run IDs: none.

Exact next command:

```sh
npx playwright test tests/e2e/repair-resume-production.spec.js --project=chromium
```

## Acceptance Criteria
- Browser fixture invokes real production Repair and Resume code: PASS BY IMPLEMENTATION — transformed facade calls closure-local `repairAndResume()`.
- Instrumentation unavailable or inert in ordinary production use: PASS — fixture-only transformation; no distributed source change.
- Concurrent repair requests coalesce to one repair flight: NOT PROVEN — synchronous implementation is tested for no second restart after the first repair completes; exact same-task adversarial behavior remains for Worker 4.
- Each repaired service restarts exactly once: NOT EXECUTED — counter assertion committed but not run.
- No Send actuation occurs: NOT EXECUTED — DOM event assertions committed but not run.
- Generated extension artifact matches userscript source: NOT APPLICABLE — neither artifact changed.

## Safety Checks
- Send authority unchanged: PASS — no product source changed and facade exposes no actuator.
- CHOICE behavior unchanged: PASS.
- Route and lease safety unchanged: PASS.
- No `main`, merge, tag, release, or publish action: PASS.

## Risks and Limits
- The test file is unexecuted and may contain fixture or boot-environment defects.
- Exact-head Chromium evidence is still required.
- Worker 4 must attempt rapid duplicate requests, route/lease races, repeated subtree replacement, and uncertain-Send conditions rather than accepting these assertions by inspection.

## Recommended Next Action

Worker 4 should execute the focused Chromium fixture on exact head `8bf2bde529d3e43c976e0be1b38ce08ab562510a` or the latest clean coordination head containing it, diagnose any boot or assertion failures, add adversarial same-task/race cases, and submit or block with exact CI/job evidence.

## Assignment Status
- blocked
