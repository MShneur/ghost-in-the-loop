# Ghost Worker Evidence

## Identity
- Round: 1
- Worker: 4
- Role: Test Engineer / Red Team
- Assignment ID: R1-W4-RR-REDTEAM
- Started at: 2026-08-06T15:51:00-04:00
- Finished at: 2026-08-06T15:58:00-04:00

## State Read
- Branch: `agent/8.8-repair-resume`
- Starting head: `f02a7ddbfb7a26d94e0022e0452c123471c2a7c6`
- Lease state: claimed by Worker 4 in commit `f3054ddee3bfde97ef6e5f8301cfa24beaa9828d`; no active workflow was present at acquisition.
- Dependencies: `R1-W3-RR-E2E-BUILD:blocked` satisfied under `submitted-or-blocked` dependency semantics.

## Step Performed

Reviewed Worker 3 evidence and `tests/e2e/repair-resume.spec.js`, located the ordinary CI run for the exact implementation commit, inspected its jobs, and requested a rerun of failed/cancelled jobs.

Red Team diagnosis:

1. CI run `31126606451` targets exact fixture commit `5ebb44eb980ef35f997bcb543e4b0b8b84dbca73` but concluded `failure`; both listed jobs were `cancelled`, so it is not passing test evidence and does not prove a fixture assertion failure.
2. The rerun request was accepted, but the connector returned no jobs yet for the new attempt during this invocation. No pass claim is possible.
3. Static review confirms one concurrent repair race and one composer replacement, but not repeated subtree replacement.
4. The fixture does not exercise rapid pause/resume sequences.
5. The fixture models route, lease, dispatch uncertainty, and service restart in `window.__RR`; it does not execute those faults through the closure-local production Repair & Resume services.
6. The static source assertions prove selected strings are present and selected dispatch calls absent in the sliced function body, but are weaker than runtime production-path evidence.

No production code was changed and no assertion was weakened.

## Research Sources
- Repository evidence: `.gitl/evidence/round-1/worker-3.md` states the fixture was unexecuted and direct production-path instrumentation remained uncovered.
- Repository evidence: `tests/e2e/repair-resume.spec.js` contains the deterministic model and four tests reviewed here.
- GitHub Actions evidence: run `31126606451`, exact head `5ebb44eb980ef35f997bcb543e4b0b8b84dbca73`, conclusion `failure`; jobs `92699516020` and `92699516021` were cancelled.
- Inference: cancellation likely reflects workflow/concurrency behavior rather than a demonstrated assertion failure; job logs or a completed rerun are required to distinguish them.

## Changes
- Files changed: `.gitl/evidence/round-1/worker-4.md`; coordination state and round plan handoff records.
- Product files changed: none.
- Test files changed: none.
- Temporary files: none.
- Workflow action: requested rerun of failed jobs for run `31126606451`.

## Tests
- Required command `npx playwright test tests/e2e/repair-resume.spec.js --project=chromium`: NOT PROVEN PASSING.
- Ordinary CI run: `31126606451` — FAILURE with both jobs CANCELLED.
- Rerun: accepted by GitHub; no jobs were returned yet during this invocation.
- Focused adversarial suite: NOT EXECUTED.
- Relevant Jest state/lease tests: NOT EXECUTED.
- Browser matrix: NOT EXECUTED.

## Acceptance Criteria
- Execute or deterministically diagnose Worker 3 fixture: PASS — exact-head CI was found and diagnosed as cancelled/non-authoritative; rerun requested.
- Exercise at least one race: PARTIAL — committed fixture contains a concurrent single-flight race, but no completed browser result exists.
- Exercise repeated DOM replacement: FAIL — fixture performs only one replacement.
- Verify exactly-once resume/send authority: NOT PROVEN — asserted in the model, not established by completed CI or real production runtime.
- Verify uncertainty stops rather than guesses: PARTIAL — model asserts send-journal, route, and lease blocks; no completed browser result.
- Verify route and lease transitions do not resurrect stale work: PARTIAL — one-shot model checks exist; transition/resurrection sequence is absent.
- File failing evidence rather than masking failures: PASS.

## Safety Checks
- Send authority unchanged: PASS BY DIFF SCOPE — no product changes.
- CHOICE behavior unchanged: PASS BY DIFF SCOPE.
- Route and lease safety unchanged: PASS BY DIFF SCOPE.
- No `main`, merge, tag, release, or publish action: PASS.

## Risks and Limits
- The exact fixture still lacks completed Chromium evidence.
- Cancellation cause remains unverified because job logs were unavailable from the cancelled jobs.
- Repeated subtree replacement, rapid pause/resume, stale-work resurrection, and runtime production-path fault injection remain uncovered.
- Rerun status must be checked by a later worker or human review; this invocation cannot claim a future result.

## Recommended Next Action

Worker 5 should continue its dependency-safe mobile/performance assignment without treating Repair & Resume as certified. It should inspect the rerun if completed, add bounded instrumentation or mobile emulation evidence, and preserve the unresolved Chromium and production-path gaps for Worker 6 audit.

## Assignment Status
- blocked
