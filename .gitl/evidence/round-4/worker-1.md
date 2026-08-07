# Ghost Worker Evidence

## Identity
- Round: 4
- Worker: 1
- Role: Supervisor / Integrator (manual successor after human review)
- Assignment ID: `R4-SUPERVISOR-PLAN`
- Started at: `2026-08-07T02:45:29Z`
- Finished at: `2026-08-07T02:46:50Z`

## State Read
- Branch: `agent/8.8-repair-resume`
- Starting head before lease claim: `7a38174bed6e58db1883484a5cc6d161d093d9d0`
- Lease state: no lease was active; no in-progress GitHub Actions run was present on the branch. The supervisor lease was claimed in commit `157384feca6373853185b0a26e83090022259bbb`.
- Dependencies: Round 3 was `awaiting-human-verification`; the user explicitly said `Proceed with tasks`, satisfying the review-after-round human gate.

## Step Performed

Accepted the independently audited Round 3 Repair & Resume certification and opened Round 4 on the next required program, `LIFECYCLE-FROZEN-DISCARDED`.

The new plan preserves every remaining release-critical program and creates a dependency-safe chain:

1. `R4-A1-LIFECYCLE-CONTRACT` — repository/primary-source lifecycle contract and deterministic fault matrix.
2. `R4-A2-LIFECYCLE-BUILD` — smallest implementation or production-path coverage required by the contract.
3. `R4-A3-LIFECYCLE-REDTEAM` — adversarial repeated wake, stale DOM, route/lease, and uncertain-Send falsification.
4. `R4-A4-LIFECYCLE-MOBILE-PERF` — mobile/background-foreground measurements and bounded runtime-activity checks.
5. `R4-A5-LIFECYCLE-AUDIT` — independent certification or recovery routing.

Only A1 is ready. Later assignments remain waiting on explicit dependency states.

## Research Sources
- Repository evidence: `.gitl/evidence/round-3/worker-6.md` — independently certifies `RR-E2E-FAULTS` on exact product head `5c057fe2235da50c23c800f7c345bc3814f01b3c`, pinned original job `92743714584`, and artifact `8978979561`; it recommends advancing to `LIFECYCLE-FROZEN-DISCARDED` after human acceptance.
- Repository evidence: `.gitl/autopilot-state.json` before this step — Round 3 was awaiting human verification and named `LIFECYCLE-FROZEN-DISCARDED` as the next required program.
- Repository evidence: `tests/wake-recovery.test.js` — current coverage asserts one centralized `recoverAfterWake` path, fail-closed Send safety, exactly one ticker rearm for RUNNING wake recovery, runtime-layer rebuilding, and routing from `visibilitychange`, `pageshow`, and `focus`.
- Repository evidence: `.gitl/orchestration/agent-succession-rule.md` — missed slots are wake-cadence failures rather than task ownership; the earliest ready assignment must be inherited when no active work exists.
- Inference: existing wake-recovery coverage is a useful base but is not by itself certification of browser freeze/discard behavior. Round 4 therefore starts with contract/research rather than speculative production changes.

## Changes
- Updated `.gitl/autopilot-state.json` to accept Round 3, open Round 4, and claim the supervisor lease.
- Replaced the current round plan with the Round 4 lifecycle chain in `.gitl/orchestration/round-plan.json`.
- Added `.gitl/evidence/round-4/worker-1.md`.
- Product source changed: none.
- Generated artifacts changed: none.
- Temporary files: none.

## Tests
- Repository state inspection: PASS — Round 3 was awaiting human verification with `RR-E2E-FAULTS` certified and `publishReady=false`.
- Branch-head inspection: PASS — starting branch head was `7a38174bed6e58db1883484a5cc6d161d093d9d0`.
- Active workflow check: PASS — zero in-progress workflow runs were reported for `agent/8.8-repair-resume` before lease claim.
- Existing lifecycle test inspection: PASS — `tests/wake-recovery.test.js` contains centralized wake recovery, fail-closed Send assertions, ticker rearm assertions, and `visibilitychange/pageshow/focus` routing assertions.
- Product/unit/browser execution: NOT RUN — this supervisor assignment changes orchestration/evidence only.

## Acceptance Criteria
- Round 3 certification remains pinned to exact job/artifact evidence: PASS — the plan/state preserve job `92743714584`, artifact `8978979561`, and exact product head `5c057fe2235da50c23c800f7c345bc3814f01b3c`.
- `LIFECYCLE-FROZEN-DISCARDED` is the next active program: PASS.
- Workers 2-6 receive a dependency-safe research/build/red-team/mobile/audit chain: PASS.
- Only the earliest assignment is ready: PASS — A1 is ready; A2-A5 are waiting.
- All remaining release-critical programs remain present: PASS — LONG-CHAT-PERF, MOBILE-SHELL-STRUCTURAL, BUILD-IDENTITY, DOCS-RECONCILIATION, and FINAL-CERT-PACKAGE remain backlog requirements.

## Safety Checks
- Send authority unchanged: PASS — no product source changed.
- CHOICE behavior unchanged: PASS — no product source changed.
- Route and lease safety unchanged: PASS — no product source changed; shared orchestration lease was used for writes.
- No `main`, merge, tag, or publish action: PASS.

## Risks and Limits
- Round 4 has not yet established which frozen/discarded lifecycle signals are reliably observable across supported browsers. Worker 2 must use authoritative primary sources and distinguish browser support from inference.
- Existing `wake-recovery.test.js` is source-contract coverage, not browser-level proof of freeze/discard behavior.
- The Round 3 nonblocking diagnostic-staleness follow-up remains outside this lifecycle scope unless a later supervisor explicitly schedules it.

## Recommended Next Action

Execute `R4-A1-LIFECYCLE-CONTRACT` immediately on the next eligible wake. Map the current recovery call graph, research supported browser lifecycle signals from primary sources, create a deterministic frozen/discarded fault matrix and focused specification/fixture coverage, then submit or block with exact evidence and activate A2 only when its dependency condition is satisfied.

## Assignment Status
- submitted
