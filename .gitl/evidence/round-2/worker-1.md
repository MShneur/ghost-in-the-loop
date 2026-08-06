# Ghost Worker Evidence

## Identity
- Round: 2
- Worker: 1
- Role: Supervisor / Integrator
- Assignment ID: R2-SUPERVISOR-REOPEN
- Started at: 2026-08-06T21:25:00Z
- Finished at: 2026-08-06T21:29:00Z

## State Read
- Branch: `agent/8.8-repair-resume`
- Starting head: `bd9e6416211e2fb090101b4a84df5c804fe38d91`
- Lease state: no prior holder; Worker 1 claimed a 45-minute lease in commit `df6002491ff3b57e2e3926976212bfb02f28091c`.
- Dependencies: Human review authorized proceeding after round 1; Worker 6 recommended reopening `RR-E2E-FAULTS` for production-path instrumentation and exact-head execution.

## Step Performed

Reviewed the round-1 Worker 6 audit, accepted its rejection of synthetic/unexecuted evidence, reopened round 2, and assigned a dependency-safe production-path chain to Workers 2 through 6.

The round is intentionally narrow: it does not start lifecycle, performance, mobile-shell, identity, documentation, or packaging programs until the earliest unfinished release-critical program has defensible evidence.

## Research Sources
- Repository evidence: `.gitl/evidence/round-1/worker-6.md` identifies the missing production-path runtime seam, exact-head Chromium/mobile execution, adversarial rerender/race proof, and constrained-device evidence.
- Repository evidence: `.gitl/orchestration/round-plan.json` records `RR-E2E-FAULTS` as still in progress and Workers 3 through 5 as needing more evidence.
- GitHub evidence: branch head at review was `bd9e6416211e2fb090101b4a84df5c804fe38d91`.
- GitHub Actions evidence: no workflow run was in progress when the round was opened.
- Inference: another broad synthetic fixture round would repeat the round-1 failure mode; the next round must invoke actual production repair control flow and attach authoritative execution evidence.

## Changes
- Files changed:
  - `.gitl/autopilot-state.json`
  - `.gitl/orchestration/round-plan.json`
  - `.gitl/evidence/round-2/worker-1.md`
- Product files changed: none.
- Generated artifacts: none.
- Temporary files created and removed: none.
- Planning commit: `57a4bc80c30e0d2556d37fb453f8106e43a4253b`.

## Tests
- Focused tests: NOT RUN; no product or test implementation changed.
- Full unit suite: NOT RUN.
- Browser matrix: NOT RUN.
- Certification: NOT RUN.
- CI: no active workflow existed at round opening; no test pass is claimed.

## Acceptance Criteria
- Human review decision incorporated: PASS — round 2 reopened under explicit user instruction.
- Worker 6 audit findings preserved: PASS — synthetic/unexecuted evidence remains unaccepted.
- One bounded assignment per specialist: PASS.
- Dependency-safe research → implementation → exact-head Red Team → mobile measurement → audit chain: PASS.
- All required programs retained: PASS.
- Product implementation avoided by supervisor: PASS.
- Schedule recorded: PASS — workers remain staggered at minute 00, 10, 20, 30, 40, and 50 of every hour.

## Safety Checks
- Send authority unchanged: PASS — coordination-only changes.
- CHOICE behavior unchanged: PASS.
- Route and lease safety unchanged: PASS.
- No `main`, merge, tag, or publish action: PASS.

## Risks and Limits
- Worker 2 must find a genuinely safe test-only seam; exposing a normal-runtime debugging API would be unacceptable.
- Worker 3 must regenerate and verify extension parity if production source changes.
- Workers 4 and 5 must not accept stale-head, cancelled, queued, or synthetic-only execution as proof.
- Real Android evidence may remain unavailable; emulation must be labeled accurately.
- The round remains subject to `review-after-round` and must stop after Worker 6.

## Recommended Next Action

Worker 2 should run at the next `:10` scheduled slot, claim the lease, read all round-1 evidence and the new assignment, map the real Repair and Resume call graph, and submit a safe production-path test seam design or failing contract test.

## Assignment Status
- submitted
