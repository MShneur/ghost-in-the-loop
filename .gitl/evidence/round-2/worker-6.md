# Ghost Worker Evidence

## Identity
- Round: 2
- Worker: 6
- Role: Devil's Advocate / Release Auditor
- Assignment ID: R2-W6-RR-CERT-AUDIT
- Started at: 2026-08-06T21:58:00Z
- Finished at: 2026-08-06T22:05:00Z

## State Read
- Branch: `agent/8.8-repair-resume`
- Starting head: `b3950b366865ece0893892bba458feadb1a3c9b0`
- Lease state: claimed at commit `e5f4c54346d4274bb36625655842ace7a5ca1326`
- Dependencies: Workers 2-5 were submitted or blocked, satisfying the audit gate.

## Step Performed

Independently audited the Round 2 production-seam design, transformed-userscript fixture, adversarial additions, mobile-project configuration, evidence files, recorded commits, and exact-head workflow availability.

## Research Sources
- Repository evidence: Worker 2 mapped a fixture-only facade that calls closure-local `repairAndResume()` and exposes no Send actuator.
- Repository evidence: Worker 3 implemented the production-path fixture but recorded no syntax, Chromium, unit, or CI execution.
- Repository evidence: Worker 4 added twelve repeated repair calls and eight composer replacements but recorded no exact-head execution and no mid-call route/lease mutation proof.
- Repository evidence: Worker 5 enabled the fixture in the Pixel 7 project but recorded no browser execution, lifecycle measurement, accessibility result, or real-device evidence.
- GitHub Actions evidence: no workflow runs were associated with heads `8bf2bde529d3e43c976e0be1b38ce08ab562510a`, `348a5f40dd43cd298bdceac824e56deec296a84a`, `61ea682b7395225a005864b6aa82701a0e46c82d`, or audit starting head `b3950b366865ece0893892bba458feadb1a3c9b0`.
- Inference: Round 2 materially improves test realism but remains scaffolding, not certification, until exact-head execution proves the assertions.

## Changes
- Added `.gitl/evidence/round-2/worker-6.md`.
- Updated round plan verdicts and round decision.
- Updated autopilot state and released the lease.
- Product source changed: no.
- Generated artifacts changed: no.
- Temporary files: none.

## Tests
- Independent commit/evidence inspection: PASS.
- Exact-head Chromium: NOT RUN / no workflow evidence.
- Exact-head mobile Chromium: NOT RUN / no workflow evidence.
- Firefox: NOT RUN.
- Unit suite: NOT RUN.
- Generated parity: NOT APPLICABLE because product/generated source did not change in Round 2.

## Acceptance Criteria
- Real production path invocation: PASS BY IMPLEMENTATION REVIEW — the transformed fixture calls closure-local `repairAndResume()`.
- Instrumentation is test-only: PASS BY DIFF SCOPE — no distributed production debug API was added.
- Exact-head Chromium and mobile results: FAIL — no authoritative runs exist.
- Adversarial race coverage: PARTIAL — sequential rapid repair and eight replacements exist; asynchronous stale-work and mid-call route/lease mutation remain unproven.
- Zero Send actuation and exactly-once restart: NOT PROVEN — assertions exist but were never executed.
- Mark each assignment and close round: PASS.

## Safety Checks
- Send authority unchanged: PASS BY DIFF SCOPE.
- CHOICE behavior unchanged: PASS BY DIFF SCOPE.
- Route and lease safety unchanged: PASS BY DIFF SCOPE.
- No `main`, merge, tag, release, or publish action: PASS.

## Risks and Limits
- A transformed userscript can fail to boot or inject correctly; unexecuted assertions cannot certify behavior.
- Sequential calls do not prove asynchronous single-flight behavior.
- Mobile project selection is configuration, not a performance measurement.
- Frozen/discarded lifecycle, real Android, Firefox Android, focus, duplicates, CPU, memory, long tasks, and layout effects remain untested.

## Recommended Next Action

Human review should reopen `RR-E2E-FAULTS` for an execution-only round using a guarded exact-head GitHub Actions carrier. Run desktop Chromium and Pixel 7 Chromium against `tests/e2e/repair-resume-production.spec.js`, preserve traces/logs, then add only failures proven by those runs. Do not advance to the next required program until the production-path fixture has authoritative passing evidence or a documented blocker.

## Assignment Status
- accepted

## Round Verdicts
- Worker 1: accepted
- Worker 2: accepted
- Worker 3: needs-more-evidence
- Worker 4: needs-more-evidence
- Worker 5: needs-more-evidence
- Worker 6: accepted
- RR-E2E-FAULTS: needs-more-evidence; not certified
