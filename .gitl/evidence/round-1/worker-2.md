# Ghost Worker Evidence

## Identity
- Round: 1
- Worker: 2
- Role: Researcher / Architect
- Assignment ID: R1-W2-RR-FAULT-MATRIX
- Started at: 2026-08-06T14:25:00-04:00
- Finished at: 2026-08-06T14:34:00-04:00

## State Read
- Branch: `agent/8.8-repair-resume`
- Starting head: `0facc155cfcfb38d805a45a8ed6fd08cb81e8c80`
- Lease state: claimed by Worker 2 in commit `2e5ce20d5f52f31b5dd41adedaa429ca2fdda169`, based on the inspected starting head; no active branch workflow was present when claimed.
- Dependencies: none.

## Step Performed

Reconstructed the existing browser and unit test surfaces, then produced an implementation-ready Repair & Resume browser fault-injection contract in `docs/REPAIR_RESUME_FAULT_MATRIX.md`.

The contract maps detached composer DOM, transiently unavailable reviewed controls, interrupted generation, route replacement, foreign/stale leases, repeated repair requests, observer/timer failure, render failure, and uncertain prior dispatch. It defines deterministic injection points, service-start and Send-attempt counters, three minimum Playwright scenarios, and fail-closed assertions.

## Research Sources
- Repository evidence: `.gitl/orchestration/round-plan.json` assigns the RR-E2E fault-matrix task and requires duplicate-resume and uncertain-Send negative assertions.
- Repository evidence: `tests/e2e/sendsafety.spec.js` runs the real userscript in Playwright and exposes closure-local adapter functions for assertions. It proves that trap controls and unreviewed Send-looking controls are rejected, providing the established pattern for test-only instrumentation.
- Repository evidence: the test tree contains adjacent route, health, state, lease, observer, and Send-safety suites, but no dedicated `repair-resume.spec.js` browser contract.
- External sources: none required. This assignment specifies repository-owned behavior and does not claim browser lifecycle semantics beyond the existing harness.
- Inference: browser-level repair safety is not proven by separate Send-safety and health unit tests; a real-browser single-flight path must assert zero Send attempts and exactly-once service restart together.

## Changes
- Files changed:
  - `docs/REPAIR_RESUME_FAULT_MATRIX.md`
  - `.gitl/evidence/round-1/worker-2.md`
  - coordination files updated separately for assignment status and lease release.
- Product source changed: no.
- Specification commit: `f17247faa44157be68721141803dc72ead946720`
- Generated artifacts: none.
- Temporary files created and removed: none.

## Tests
- Focused tests: NOT TESTED — no executable fixture or production behavior changed in this research assignment.
- Full unit suite: NOT TESTED.
- Browser matrix: NOT TESTED.
- Certification: NOT TESTED.
- CI run IDs and conclusions: none. No current-head pass is claimed.
- Repository inspection confirmed no active GitHub Actions run on the branch at lease acquisition.

## Acceptance Criteria
- Map each fault to current observable behavior and expected safe recovery: PASS — matrix records nine deterministic fault classes and required outcomes.
- Identify exact fixture hooks and deterministic injection points: PASS — test-only health, repair-state, service-start, and Send-attempt hooks plus three browser scenarios are specified.
- Define duplicate-resume and uncertain-Send negative assertions: PASS — duplicate requests must coalesce; unknown prior dispatch must remain blocked; `sendAttempts` must remain zero.
- Add a focused specification or failing fixture test when feasible: PASS AS SPECIFICATION — added the focused implementation contract; no unverified executable test was committed.
- Record primary browser/platform sources only where external behavior is claimed: PASS — no external platform behavior was claimed.

## Safety Checks
- Send authority unchanged: PASS — no production source changed; contract forbids a second dispatch path.
- CHOICE behavior unchanged: PASS — no production source changed.
- Route and lease safety unchanged: PASS — no production source changed; contract requires fail-closed route/lease drift assertions.
- No `main`, merge, tag, or publish action: PASS.

## Risks and Limits
- No browser reproduction was executed in this invocation, so the matrix is an implementation contract, not proof that current production behavior passes.
- The proposed instrumentation names are test-contract names; Worker 3 must expose the smallest safe harness surface and avoid persistent production debug APIs.
- The exact internal service names may differ from the contract. Counters should map to actual observer, timer, render, and adapter services without broad refactoring.
- Existing separate tests may cover portions of the matrix, but they do not yet provide one authoritative browser-level Repair & Resume certification.

## Recommended Next Action

Worker 3 should add `tests/e2e/repair-resume.spec.js` using the real userscript and the smallest test-only instrumentation needed for Scenarios A–C. It should first reproduce current behavior, add zero-Send and exactly-once restart assertions, and change production code only if a deterministic failing test proves a defect.

## Assignment Status
- submitted
