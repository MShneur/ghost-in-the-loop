# Ghost Worker Evidence

## Identity
- Round: 1
- Worker: 1
- Role: Supervisor / Integrator
- Assignment ID: R1-SUPERVISOR-PLAN
- Started at: 2026-08-06T17:02:00Z
- Finished at: 2026-08-06T17:08:00Z

## State Read
- Branch: `agent/8.8-repair-resume`
- Starting head: `5dbf151648f2156ccd3ed840b983834f08a5bb03`
- Lease state: No holder at eligibility check. Worker 1 claimed a 45-minute lease in commit `99617e1661519498c27b11fc7b6b652676b02664` and confirmed the lease by re-reading state.
- Dependencies: Plan status was `awaiting-supervisor`; Worker 1 was eligible without a specialist assignment.

## Step Performed

Read the authoritative state, orchestration README, round plan, universal worker prompt, evidence contract, mobile-shell brief, branch head, recent commits, active Actions state, package scripts, and the existing unit/e2e test layout. Selected the earliest unfinished release-critical program, `RR-E2E-FAULTS`, and created one dependency-safe research → build → Red Team → mobile/performance → audit chain for Workers 2 through 6.

The required mobile structural-shell program and every other required program remain in the plan. No completion claim was accepted and no product code was modified.

## Research Sources
- Repository evidence: `.gitl/autopilot-state.json` established round 1, `review-after-round`, Worker 1 supervision, no lease holder, and `RR-E2E-FAULTS` as the earliest ready required program.
- Repository evidence: `.gitl/orchestration/task-prompts.md` requires bounded assignments with dependencies, allowed files, prohibited actions, acceptance criteria, tests, evidence, and fallback work.
- Repository evidence: `package.json` exposes syntax, generated-parity, Jest, Playwright, and extension certification commands.
- Repository evidence: `tests/e2e/` already contains browser fixtures/specs including route, Send-safety, boot, rail, and related regression surfaces suitable for bounded Repair and Resume fault injection.
- Repository evidence: one Actions run, ID `31121205970`, was still reported in progress for older head `d56c64afb165582cbc7751e00d57b09317471b7b`; current branch head at lease acquisition was `5dbf151648f2156ccd3ed840b983834f08a5bb03`. This was treated as stale/non-conflicting CI evidence, not as proof of current-head health.
- Inference: A browser-fault contract must precede implementation to avoid encoding assumptions into recovery behavior near Send, route, lease, and detached-DOM safety boundaries.

## Changes
- Files changed:
  - `.gitl/autopilot-state.json` — lease claim, followed by final handoff/release update.
  - `.gitl/orchestration/round-plan.json` — round status and five bounded assignments.
  - `.gitl/evidence/round-1/worker-1.md` — this evidence record.
- Coordination commits:
  - `99617e1661519498c27b11fc7b6b652676b02664` — claim Worker 1 lease.
  - `d1473376e6df01e4d7e16a57b6463ecfda8a3210` — publish round-1 specialist chain.
- Product commit: none.
- Generated artifacts: none.
- Temporary files created and removed: none.

## Tests
- Focused tests: NOT RUN — planning-only coordination change.
- Full unit suite: NOT RUN — no product or test behavior changed.
- Browser matrix: NOT RUN.
- Certification: NOT RUN.
- CI run IDs and conclusions: Existing run `31121205970` was in progress on stale head `d56c64a...`; no current-head passing conclusion was claimed.

## Acceptance Criteria
- Read canonical orchestration files and referenced brief: PASS — all required files were fetched from the recorded branch.
- Verify branch head, recent commits, CI, evidence, required programs, and backlog: PASS with limitation — branch/commits/CI/programs verified; current-round evidence directory did not yet exist.
- Preserve every required release-critical program: PASS — all seven programs remain present; none was marked complete.
- Assign one bounded task to Workers 2–5 and an audit task to Worker 6: PASS — five assignments created.
- Include required assignment fields: PASS — each assignment includes goal, rationale, dependencies, allowed files, prohibited actions, acceptance criteria, required tests, required evidence, and fallback work.
- Create a dependency-safe chain around the earliest unfinished program: PASS — `RR-E2E-FAULTS` research precedes build; Red Team and mobile/performance depend on build; audit waits for all specialist outcomes.
- Avoid product implementation: PASS — only `.gitl` coordination/evidence files changed.

## Safety Checks
- Send authority unchanged: PASS — no product code changed; assignments explicitly prohibit a second Send path and weakening uncertain-Send safeguards.
- CHOICE behavior unchanged: PASS — no product code changed; assignments explicitly prohibit weakening CHOICE.
- Route and lease safety unchanged: PASS — no product code changed; lease was conflict-safe using the current state SHA.
- No `main`, merge, tag, or publish action: PASS.

## Risks and Limits

The in-progress Actions run was tied to an older head and may finish after this evidence is written; it does not certify the current coordination head. The GitHub contents connector creates one commit per file write, so the final state handoff commit follows this evidence commit and is recorded in state rather than pre-known here. Specialist dependencies rely on workers updating assignment status durably and using the shared lease correctly.

## Recommended Next Action

Worker 2 should claim the lease, execute `R1-W2-RR-FAULT-MATRIX`, write deterministic browser fault-contract evidence, mark the assignment `submitted` or `blocked`, and release the lease.

## Assignment Status
- accepted
