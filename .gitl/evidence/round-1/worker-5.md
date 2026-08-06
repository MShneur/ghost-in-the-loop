# Ghost Worker Evidence

## Identity
- Round: 1
- Worker: 5
- Role: Mobile, browser, accessibility, and performance specialist
- Assignment ID: R1-W5-RR-MOBILE-PERF
- Started at: 2026-08-06T20:48:00Z
- Finished at: 2026-08-06T20:52:00Z

## State Read
- Branch: `agent/8.8-repair-resume`
- Starting head: `ff7ca533738cb503bec0b27b6b71d50f442636f7`
- Lease state: claimed by Worker 5 at `edc1aee541362f1f90a305f0e062768a6044b4e9`
- Dependencies: Worker 3 and Worker 4 were both durably blocked, satisfying the assignment's `submitted-or-blocked` dependency rule.

## Step Performed
Added a deterministic Pixel-class Chromium context to the committed Repair & Resume Playwright harness. The scenario applies narrow portrait, reduced-height keyboard-like viewport pressure, landscape rotation, hidden/visible lifecycle events, 12 concurrent repair requests, and explicit numeric bounds for accepted repairs, service restarts, Send attempts, and duplicate accessible controls.

## Research Sources
- Repository evidence: `playwright.config.js` limits the existing `chromium-mobile` project to `send-evidence.spec.js`; therefore `repair-resume.spec.js` had no mobile-project coverage.
- Repository evidence: Worker 3's harness modeled repair single-flight and fail-closed behavior but lacked mobile viewport/lifecycle pressure and did not record total repair request count.
- GitHub Actions evidence: rerun `31126606451` remained queued against Worker 3's implementation head `5ebb44eb980ef35f997bcb543e4b0b8b84dbca73` during this invocation.
- Inference: a self-contained mobile browser context is the smallest allowed-file change that can exercise the assigned mobile path without modifying the global Playwright configuration.

## Changes
- Files changed: `tests/e2e/repair-resume.spec.js`
- Implementation commit: `450903a199424cf1eda96edd6061c20f1bc89640`
- Added `repairRequests` instrumentation.
- Added Pixel 7-class viewport, touch, DPR, Android user-agent, lifecycle churn, three viewport transitions, 12 concurrent repair requests, and accessibility duplicate-count assertions.
- Generated artifacts: none.
- Temporary files created and removed: none.

## Tests
- Focused tests: NOT EXECUTED. Required command: `npx playwright test tests/e2e/repair-resume.spec.js --project=chromium`.
- Mobile Chromium equivalent: defined inside the spec through `browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true, ... })`.
- Full unit suite: NOT EXECUTED.
- Browser matrix: NOT EXECUTED.
- Certification: NOT EXECUTED.
- CI run `31126606451`: queued during the invocation, but it targets the older Worker 3 implementation commit and cannot validate Worker 5's change.
- No new exact-head workflow run was visible after commit `450903a199424cf1eda96edd6061c20f1bc89640` during the invocation.

## Acceptance Criteria
- Run or define a mobile Chromium fault scenario: PASS — deterministic Pixel-class Chromium context committed.
- Record timer/observer/scan counts or bounded proxies: PASS — 12 requests, exactly 1 accepted repair, and exactly one restart per broken observer/timer/render/adapter service are asserted.
- Check viewport resize and background/foreground transitions where harness permits: PASS — hidden/visible events plus portrait, reduced-height, landscape, and restored portrait transitions are encoded.
- Confirm no accessibility-visible duplicate status/control is introduced: PASS BY ASSERTION DEFINITION, NOT EXECUTION — exactly one named status and one Send button are asserted.
- State Firefox/mobile gaps explicitly: PASS — GeckoView/Firefox Android remains untested; Playwright's mobile context uses Chromium only.

## Safety Checks
- Send authority unchanged: PASS — no production code changed; harness asserts zero Send attempts and one existing Send control.
- CHOICE behavior unchanged: PASS — no production behavior changed.
- Route and lease safety unchanged: PASS — existing route/lease fail-closed tests retained.
- No `main`, merge, tag, or publish action: PASS.

## Risks and Limits
- The new assertions are deterministic but unexecuted, so syntax and runtime compatibility remain unproven.
- The test still models browser-owned fault boundaries rather than invoking the real production `repairAndResume` path.
- Lifecycle events are synthetic; Android process death, BFCache, frozen/discarded tabs, and real visual viewport keyboard events remain outside this round's proof.
- Timer/observer bounds are harness counters, not production PerformanceObserver, heap, CPU, or long-task measurements.
- Firefox Android/GeckoView remains untested.

## Recommended Next Action
Worker 6 should audit commit `450903a199424cf1eda96edd6061c20f1bc89640`, require exact-head Playwright execution, and reject any claim that the production repair path or real Android performance is certified. Run `npx playwright test tests/e2e/repair-resume.spec.js --project=chromium` on the clean branch head and record the resulting CI run before acceptance.

## Assignment Status
- blocked
