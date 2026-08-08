# Ghost Worker Evidence

## Identity
- Round: 1
- Worker: 6
- Role: Devil's Advocate / Release Auditor
- Assignment ID: R1-W6-ROUND-AUDIT
- Started at: 2026-08-06T21:02:00Z
- Finished at: 2026-08-06T21:10:00Z

## State Read
- Branch: `agent/8.8-repair-resume`
- Starting clean head before lease: `e689019351123250871b75ad34764d28b9c41a3b`
- Lease state: Worker 6 claimed the shared lease in commit `1f1bd901d161151c2f17aaa09f429e77802b128c` and re-read the state to confirm holder 6.
- Dependencies: Workers 2 through 5 were durably `submitted` or `blocked`; the Worker 6 audit assignment was `ready`.

## Step Performed

Independently audited the round-1 supervisor plan, Worker 2 research contract, Worker 3 browser fixture, Worker 4 Red Team diagnosis, Worker 5 mobile/performance instrumentation, the recorded commits, the current test file, and GitHub Actions run `31126606451`.

Verdicts:

- `R1-SUPERVISOR-PLAN`: **accepted**. The supervisor created a dependency-safe bounded chain and preserved all required programs.
- `R1-W2-RR-FAULT-MATRIX`: **accepted**. The research artifact is appropriately scoped as an implementation contract and does not overclaim execution.
- `R1-W3-RR-E2E-BUILD`: **needs-more-evidence**. The fixture commit exists and is safety-conscious, but it is primarily a synthetic `window.__RR` model with static source-string assertions. It has no completed focused Chromium result and does not inject faults through the actual production Repair & Resume services.
- `R1-W4-RR-REDTEAM`: **needs-more-evidence**. Worker 4 correctly refused to treat cancelled CI as a pass and identified material gaps, but the assigned adversarial scenarios were not executed. Repeated subtree replacement, rapid pause/resume, stale-work resurrection, and production-path runtime fault injection remain absent.
- `R1-W5-RR-MOBILE-PERF`: **needs-more-evidence**. The Pixel-class context and bounded assertions are useful fixture additions, but they are unexecuted and measure synthetic harness counters rather than production observer, timer, scan, CPU, memory, layout-shift, or real Android lifecycle behavior.

The `RR-E2E-FAULTS` program therefore remains **in progress** and must not be represented as certified.

## Research Sources
- Repository evidence: `.gitl/evidence/round-1/worker-1.md` proves the round plan was coordination-only and preserved the seven required programs.
- Repository evidence: `.gitl/evidence/round-1/worker-2.md` explicitly labels its output as a specification rather than browser proof.
- Repository evidence: `.gitl/evidence/round-1/worker-3.md` records that syntax, Playwright, unit, and CI gates were not completed and direct production instrumentation was absent.
- Repository evidence: `.gitl/evidence/round-1/worker-4.md` records exact-head CI failure/cancellation and the missing adversarial sequences.
- Repository evidence: `.gitl/evidence/round-1/worker-5.md` records that the mobile scenario was defined but not executed and that real Android/Firefox/performance evidence is absent.
- Repository evidence: `tests/e2e/repair-resume.spec.js` uses a synthetic `window.__RR` state machine for runtime assertions and static string checks against `repairAndResume`; it does not invoke closure-local production repair services.
- GitHub Actions evidence: run `31126606451` targets Worker 3 commit `5ebb44eb980ef35f997bcb543e4b0b8b84dbca73` and was still `queued` during this audit. It cannot validate Worker 5 commit `450903a199424cf1eda96edd6061c20f1bc89640` or the current branch head.
- Inference: the fixture is valuable scaffolding, but accepting it as product-path certification would confuse a model contract with evidence about the actual implementation.

## Changes
- Files changed:
  - `.gitl/evidence/round-1/worker-6.md`
  - `.gitl/orchestration/round-plan.json`
  - `.gitl/autopilot-state.json`
- Product files changed: none.
- Test files changed: none during this audit.
- Generated artifacts: none.
- Temporary files created and removed: none.

## Tests
- Focused Playwright: NOT RUN by Worker 6; no local execution environment was available through the connected GitHub interface.
- Full unit suite: NOT RUN.
- Browser matrix: NOT RUN.
- Generated parity: NOT RUN; no production/generated artifact changed in this audit.
- CI run `31126606451`: `queued` during audit, exact head `5ebb44eb980ef35f997bcb543e4b0b8b84dbca73`; not authoritative for Worker 5 or current head.
- Current clean-head CI: absent.

## Acceptance Criteria
- Verify every recorded assignment and evidence file: PASS — Workers 1 through 5 evidence and the round plan were read.
- Verify recorded implementation commits exist: PASS — Worker 3 commit `5ebb44eb980ef35f997bcb543e4b0b8b84dbca73` exists and adds the browser fixture; Worker 5 commit `450903a199424cf1eda96edd6061c20f1bc89640` is recorded in durable state/evidence and its resulting test content is present on the branch.
- Verify browser execution: FAIL — no completed focused Chromium result exists for the final fixture.
- Verify actual production Repair & Resume path: FAIL — runtime faults are modeled in `window.__RR`, not injected through closure-local production services.
- Verify repeated replacement and stale-work adversarial behavior: FAIL — not present as executed evidence.
- Verify mobile/lower-end measurements: FAIL — viewport/lifecycle assertions are unexecuted and production resource measurements are absent.
- Verify zero Send actuation: PARTIAL — asserted by the synthetic model and production-source string checks, but not established through executed production-path browser faults.
- Verify generated parity and clean-head CI: NOT APPLICABLE to audit-only files, but REQUIRED before later product acceptance.
- Close round for human verification without claiming program completion: PASS.

## Safety Checks
- Send authority unchanged: PASS — Worker 6 changed only `.gitl` audit/control files.
- CHOICE behavior unchanged: PASS.
- Route and lease safety unchanged: PASS; the audit preserves unresolved route/lease runtime gaps rather than weakening them.
- No `main`, merge, tag, or publish action: PASS.

## Risks and Limits

1. The queued rerun may later complete, but it targets the pre-mobile Worker 3 head and cannot certify the final fixture.
2. Static string assertions can pass while production control flow changes semantically; they are not a durable substitute for runtime hooks or observable production behavior.
3. The synthetic service counters prove the harness's own single-flight logic, not necessarily Ghost's actual observer, timer, render, and adapter restart behavior.
4. No real Android, GeckoView, frozen/discarded-page, BFCache, memory, CPU, long-task, or layout-shift evidence exists.
5. The branch contains useful test scaffolding, but release-critical `RR-E2E-FAULTS` remains unresolved.

## Recommended Next Action

During human review, keep Worker 2 accepted and retain the Worker 3/5 fixture as scaffolding. Reopen `RR-E2E-FAULTS` for a later round with one narrow goal: add safe test-only instrumentation that invokes the real production Repair & Resume path, then run the final fixture on exact-head Chromium and mobile Chromium. Require repeated composer replacement, rapid pause/resume, stale-work resurrection, route/lease/uncertain-Send faults, exactly-once service restart, and zero Send actuation. Record a completed clean-head CI run before acceptance.

## Assignment Status
- accepted
