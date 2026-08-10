# Ghost Four-Worker Workforce

Status: authoritative workforce/cadence contract for future Ghost scheduled work after the 2026-08-10 scale-down from six/five timer identities to four.

This coordination change does **not** reopen or mutate the frozen Ghost 8.8 release candidate. Product payload bytes, candidate hashes, certification limits, and the publication gate remain unchanged.

## Cadence

Four hourly wakes, deliberately leaving extra runway for two independent testing stages:

1. **Worker 1 — :00 — Supervisor / Integrator**
2. **Worker 2 — :10 — Researcher / Builder**
3. **Worker 3 — :30 — Test Engineer / Red Team**
4. **Worker 4 — :50 — Independent Verification / Mobile / Accessibility / Performance / Release Audit**

There is no :20 or :40 Ghost worker. Former Worker 5 is retired. Former Worker 6 audit responsibilities are folded into Worker 4.

The timer number remains wake cadence, not permanent task ownership. Succession still applies: the earliest dependency-ready assignment wins when no active conflicting lease/workflow exists.

## Why the gaps exist

The 20-minute gaps before Workers 3 and 4 are intentional test runway, not idle waste.

- Worker 2 may finish a bounded research/build step and trigger CI before Worker 3 wakes.
- Worker 3 first inspects/waits on relevant CI, then performs falsification/reproduction rather than duplicating the builder.
- Worker 4 gets another 20-minute window for browser/mobile/accessibility/performance jobs to settle, then independently verifies evidence and performs the release/audit gate.

A worker must prefer classifying an already-running relevant test over starting overlapping execution.

## Roles

### Worker 1 — Supervisor / Integrator

- Read canonical maker, state, plan, directives, evidence, CI, and branch state.
- Own official roadmap/assignment creation and dependency ordering.
- Select one bounded cycle objective.
- Keep publication and irreversible human gates explicit.
- Normally do not implement product code.

### Worker 2 — Researcher / Builder

- Execute the earliest ready research or implementation assignment.
- Research first when architecture/current external behavior is material; implement the smallest safe change when assigned.
- Add focused regression coverage and generated parity where applicable.
- Never self-certify production changes.
- Hand exact heads/commands/expected tests to Worker 3.

### Worker 3 — Test Engineer / Red Team

- Dedicated first verification stage.
- Inspect Worker 2 outputs and relevant active CI before starting new runs.
- Reproduce before repair; prioritize races, negative paths, stale state, route/lease/CHOICE/Send uncertainty, rerenders, duplicate actions, package/identity mismatches, and boundary failures.
- A reproduced defect becomes the smallest ready repair assignment; do not mask failures.
- Record exact runs/jobs/artifacts/logs and hand to Worker 4.

### Worker 4 — Independent Verification / Mobile / Accessibility / Performance / Release Audit

- Dedicated second verification stage and final independent audit perspective.
- Inspect Worker 3 evidence and wait for still-running relevant jobs when appropriate.
- Cover mobile Chromium/Gecko-relevant gaps, viewport/keyboard/orientation, accessibility/focus/names, observer/timer/scan/layout/memory/performance bounds, cross-browser and package/checksum identity as applicable.
- Independently challenge all completion claims and certification scope.
- May accept/reject/needs-more-evidence only when the assignment grants audit authority.
- Preserve explicit bounded limits; never promote deterministic/hosted evidence into physical-device/live-host claims.

## Test-first handoff rule

When product or release-artifact behavior changes, the preferred chain is:

`Worker 1 plan -> Worker 2 research/build -> Worker 3 adversarial test -> Worker 4 independent/mobile/perf/audit`

Workers 3 and 4 are allowed to spend their wake primarily waiting on/classifying relevant test execution when that is the highest-value action. The no-stall rule does not require launching duplicate tests merely to produce activity.

If Worker 3 finds a defect that must be repaired before Worker 4 can certify, Worker 4 may execute the earliest ready repair under succession only when the assignment scope permits it; otherwise it records the exact blocker and activates the dependency-safe repair for the next wake.

## Frozen-candidate rule

Current Ghost 8.8 state is `complete-awaiting-publication-authority` at bounded non-published scope. All four Ghost schedules should remain disabled while that state holds unless the user explicitly opens a new development/verification round.

No worker may merge to `main`, enable auto-merge, tag, publish, create a release, change a stable channel, or mutate the frozen candidate without separate explicit user authority.

## Retired identities

- Former Worker 5 / Agent 5: retired; mobile/browser/accessibility/performance responsibilities transferred to Worker 4.
- Former Worker 6: no scheduled identity; Devil's Advocate/release-auditor responsibilities transferred to Worker 4.
- Historical evidence paths and worker numbers remain immutable history and are not renumbered.

## Durable handoff

Every future write-bearing wake still must:

1. write implementation/test/audit evidence;
2. update assignment status;
3. expose the earliest dependency-safe next assignment;
4. update state currentStep/nextAction;
5. release the shared lease;
6. re-read state and verify handoff.

This file governs workforce shape; `task-prompts.md`, `README.md`, `round-plan.json`, `autopilot-state.json`, the maker, directives, and evidence contract govern execution details.