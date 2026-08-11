# Ghost Worker Evidence

## Identity
- Round: 2
- Worker: 4
- Role: Test Engineer / Red Team
- Assignment ID: R2-W4-RR-EXACTHEAD-REDTEAM
- Started at: 2026-08-06T17:53:00-04:00
- Finished at: 2026-08-06T18:02:00-04:00

## State Read
- Branch: `agent/8.8-repair-resume`
- Starting head: `f6dde7798593dc692af223e2380a5a4df65f72e4`
- Lease state: claimed by Worker 4 in commit `ae44f8918e98e8bd9eb169e1b97083559b2196b4`
- Dependencies: `R2-W3-RR-PROD-INSTRUMENT:blocked` satisfied under submitted-or-blocked dependency rule.

## Step Performed

Reviewed Worker 3's production-path Playwright fixture and added two bounded adversarial cases to `tests/e2e/repair-resume-production.spec.js`:

1. Twelve rapid same-task calls to the real closure-local `repairAndResume()` facade after one paused-ticker fault, asserting exactly one ticker restart and zero composer/Send events.
2. Eight consecutive composer subtree replacements before repair, asserting every stale node remains detached and untouched, the live replacement stays connected, exactly one ticker restart occurs, and no submit/click/input/keydown event fires.

No production code changed.

## Research Sources
- Repository evidence: `.gitl/evidence/round-2/worker-3.md` records that the fixture invokes the real closure-local repair function but lacked exact-head execution and adversarial same-task coverage.
- Repository evidence: `tests/e2e/repair-resume-production.spec.js` exposed a fixture-only immutable facade with no Send actuator.
- Repository evidence: round plan assignment `R2-W4-RR-EXACTHEAD-REDTEAM` requires repeated replacement, rapid repair, route/lease, uncertain-Send, and exact-head CI evidence.
- Inference: because `repairAndResume()` is synchronous, rapid same-task sequential calls test idempotent restart authority, not promise-level in-flight coalescing.

## Changes
- Changed: `tests/e2e/repair-resume-production.spec.js`
- Test commit: `348a5f40dd43cd298bdceac824e56deec296a84a`
- Production files changed: none
- Generated artifacts: none required
- Temporary files: none

## Tests
- Focused Playwright Chromium: NOT EXECUTED. Required command: `npx playwright test tests/e2e/repair-resume-production.spec.js --project=chromium`.
- Exact-head GitHub Actions: no workflow run was returned for head `348a5f40dd43cd298bdceac824e56deec296a84a` during this invocation.
- Existing latest visible branch CI was run `31128246552` on stale head `e689019351123250871b75ad34764d28b9c41a3b`, conclusion `failure`; it is not evidence for this assignment.
- Syntax/unit checks: NOT EXECUTED.
- Browser matrix: NOT EXECUTED.

## Acceptance Criteria
- Run exact-head Chromium coverage: FAIL — no exact-head run appeared.
- Repeatedly replace composer and relevant service DOM: PARTIAL — eight deterministic composer replacements added; service DOM replacement remains uncovered.
- Exercise rapid pause/resume and stale-work resurrection: PARTIAL — rapid repeated repair added; stale-work resurrection across asynchronous transition remains unproven.
- Exercise route and lease changes during repair: NOT TESTED — current facade exposes health overrides but no safe mid-call mutation seam.
- Inject uncertain-Send conditions and prove zero Send actuation: PARTIAL — fail-closed journal health and zero composer events are asserted but unexecuted.
- Record every failure and authoritative CI run ID: PASS — no authoritative exact-head run existed; stale run explicitly rejected.

## Safety Checks
- Send authority unchanged: PASS BY DIFF SCOPE — test-only changes, no actuator added.
- CHOICE behavior unchanged: PASS BY DIFF SCOPE.
- Route and lease safety unchanged: PASS BY DIFF SCOPE.
- No `main`, merge, tag, release, or publish action: PASS.

## Risks and Limits
- The new test code is unexecuted and may contain fixture or environment defects.
- Same-task sequential calls do not prove asynchronous single-flight behavior.
- Route/lease mutation during the synchronous repair call remains untested.
- No exact-head Chromium, Firefox, or mobile evidence exists.

## Recommended Next Action

Worker 5 should claim its ready assignment, first check whether an exact-head workflow appears for `348a5f40dd43cd298bdceac824e56deec296a84a`, then run the production-path fixture under mobile Chromium or add only real-seam bounded instrumentation. Worker 6 must reject certification if exact-head execution remains absent.

## Assignment Status
- blocked
