# Ghost Worker Evidence

## Identity
- Round: 2
- Worker slot: 2
- Executing agent: successor agent after the scheduled Worker 2 slot was missed
- Role: Researcher / Architect
- Assignment ID: R2-W2-RR-PROD-SEAM
- Started at: 2026-08-06T21:37:00Z
- Finished at: 2026-08-06T21:50:00Z

## State Read
- Branch: `agent/8.8-repair-resume`
- Starting head inspected: `c40600e63bd8f439ab67fd2e4cb8a9fca5b30ed8`
- Lease state: no prior holder; claimed for worker slot 2 at commit `2b9dff75abe4c08328bc90711b0e3116c6271829`
- Dependencies: none
- Active branch Actions at claim: none

## Step Performed

Mapped the real closure-local Repair & Resume path and selected a test-harness-only injection seam that invokes `repairAndResume()` directly without exposing Send authority or changing ordinary production artifacts.

Also added the user-authorized agent succession rule: missed scheduled worker slots no longer deadlock the chain; the next available eligible agent executes the earliest dependency-ready assignment while preserving its role, evidence path, tests, and safety boundaries.

## Research Sources

### Repository evidence

- `renderRunTab()` calls `runtimeServiceHealth()` and renders `#g-repair-resume` only when repair is available.
- The binding layer attaches `#g-repair-resume` directly to `repairAndResume`.
- `runtimeServiceHealth()` is documented in source as a side-effect-free snapshot of schedulers, lease, bus, caches, observer, panel, route, network witness, and Send journal.
- Its repairable set includes ticker, heartbeat, tab lease, Ghost bus, composer cache/observer, panel, and network observer.
- Its blocking set includes unsafe Send journal, route change, and foreign tab lock.
- `repairAndResume()` first checks blockers, leaves the run paused/error on uncertainty, records `GHOST.lastRepair` and timeline evidence, repairs listed services, rechecks lease ownership, and returns a structured result.
- The UI description states that Repair & Resume repairs runtime services and rearms a paused run without injecting or sending anything immediately.
- `tests/e2e/sendsafety.spec.js` already establishes the accepted technique of injecting a test facade into the real userscript closure before the outer boot catch.

### Inference

- A Playwright-only transformed-script facade is narrower and safer than a permanent production debug global because it does not exist in distributed userscript or extension artifacts.
- Current `repairAndResume()` is synchronous; a claim of promise-level single-flight must not be invented. The browser test must first reproduce whether duplicate same-task requests actually duplicate a service restart.

No external browser behavior was claimed, so no external web source was required.

## Changes

- Added `.gitl/orchestration/agent-succession-rule.md`.
- Added `docs/REPAIR_RESUME_PRODUCTION_SEAM.md`.
- Added `.gitl/evidence/round-2/worker-2.md`.
- Coordination state and round plan are updated in the final handoff commits.
- Product source changed: no.
- Generated artifacts changed: no.
- Temporary files created: none.

Commits:

- `0b84c8bb86709b4f30d9da4154f9dad11a18acb5` — durable agent succession rule.
- `075538c6c7777430cdf6c28000e21b79cee59603` — production-path seam design.

## Tests

- Repository source inspection: PASS.
- Focused specification: PASS — `docs/REPAIR_RESUME_PRODUCTION_SEAM.md` defines the closure injection, rejected alternatives, safety analysis, service boundaries, assertions, parity requirements, files, and commands.
- Syntax check: NOT APPLICABLE — no JavaScript fixture or product source changed.
- Focused Playwright: NOT RUN — Worker 3 implements the fixture.
- Full unit suite: NOT RUN — no product source changed.
- Browser matrix: NOT RUN.
- Certification: NOT RUN.
- CI run IDs: none.

## Acceptance Criteria

- Map real closure-local repair entry points and service restart boundaries: PASS — documented call graph and repairable/blocking boundaries.
- Specify a test-only hook or observable seam disabled in normal operation: PASS — transformed Playwright script facade only.
- Prove the seam cannot actuate Send: PASS BY CONSTRUCTION — facade exposes health, repair result, snapshots, and ticker mode only; it exposes no Send function, prompt writer, adapter actuator, or mutable live loop object.
- Define exact assertions for single-flight repair and exactly-once restart: PASS — exact deltas and zero-actuation assertions documented, with synchronous behavior caveat.
- Identify generated userscript/extension parity requirements: PASS.

## Safety Checks

- Send authority unchanged: PASS — no product source changed; proposed facade exposes no actuator.
- CHOICE behavior unchanged: PASS.
- Route and lease safety unchanged: PASS.
- No `main`, merge, tag, release, or publish action: PASS.

## Risks and Limits

- The seam is an implementation-ready design, not executable proof.
- The existing repair function is synchronous. Worker 3 must reproduce duplicate-request behavior before adding locking or changing production flow.
- Exact internal restart counters may require temporary wrappers in the transformed test harness. Those wrappers must delegate and must not force decisions.
- Zero Send actuation must be proven with DOM click/submit/input/keydown counters and unchanged composer content, not by trusting the function description.

## Recommended Next Action

The next available eligible agent should execute `R2-W3-RR-PROD-INSTRUMENT`, even if the original Worker 3 schedule slot has passed. Implement `tests/e2e/repair-resume-production.spec.js` using the transformed-script facade, reproduce duplicate repair behavior, and change product code only after a deterministic production-path failure.

## Assignment Status
- submitted
