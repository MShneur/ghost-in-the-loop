# Ghost Autonomous Round Orchestrator

This directory is the durable control plane for staggered ChatGPT workers continuing Ghost in the Loop. GitHub state, commits, CI, evidence, the canonical Personal-Forge maker, and explicit user directives override chat memory.

## Current workforce

Effective 2026-08-10, Ghost uses **four scheduled wakes** with extra runway for two independent testing stages:

1. `:00` — Worker 1 — Supervisor / Integrator
2. `:10` — Worker 2 — Researcher / Builder
3. `:30` — Worker 3 — Test Engineer / Red Team
4. `:50` — Worker 4 — Independent Verification / Mobile / Accessibility / Performance / Release Audit

There is no `:20` or `:40` Ghost worker. Former Worker 5 is retired. Former Worker 6's Devil's Advocate/release-audit responsibilities are folded into Worker 4. See `four-worker-workforce.md`.

The timer number is **wake cadence, not assignment ownership**. The earliest dependency-ready assignment controls scope, subject to the shared lease and active-work exclusion rules.

The 20-minute gaps before Workers 3 and 4 are intentional. Workers should classify/wait on relevant already-running CI rather than launch overlapping tests merely to stay busy.

## Current project state

Ghost 8.8 is currently frozen at bounded deterministic/non-published release-candidate scope and awaits separate publication authority. Workforce migration is coordination-only and must not alter candidate payload bytes, hashes, certification limits, `main`, tags, releases, or stable channels.

All Ghost schedules should remain disabled while `.gitl/autopilot-state.json` is `complete-awaiting-publication-authority`, unless the user explicitly opens a new development/verification round.

## Canonical files

- `../autopilot-state.json` — authoritative round, branch, lease, stop state, dispatch, workforce state, and current evidence limits.
- `round-plan.json` — required programs, assignments, dependencies, acceptance criteria, evidence status, and cadence metadata.
- `task-prompts.md` — universal four-worker execution contract.
- `four-worker-workforce.md` — workforce roles, cadence, testing runway, and retired-identity handoff.
- `evidence-contract.md` — durable evidence format.
- `agent-succession-rule.md` — active-work exclusion, stale/incomplete-handoff recovery, and successor behavior.
- `../deferred-questions.md` — local human questions and resolutions.
- `../user-directives/` — explicit user authority.
- `../briefs/` — user requirements and exploratory briefs.
- `../evidence/round-N/` — durable worker evidence.

Historical evidence remains immutable; do not renumber old worker files to match the new four-worker workforce.

## Assignment selection and succession

At every eligible wake:

1. Read the latest canonical maker, then state, plan, workforce contract, succession rule, task prompt, evidence contract, deferred questions, applicable directives, and assignment-linked evidence/briefs.
2. Check the shared lease, branch movement, and relevant GitHub Actions for active conflicting work.
3. Find the earliest dependency-ready assignment whose status is `ready`, `retry-ready`, or equivalent.
4. Execute that assignment even if its intended worker differs from the timer identity; preserve assignment scope and record succession.
5. Never skip a ready recovery to perform later work.
6. A failed/blocked step must become durable evidence and expose the smallest dependency-safe continuation.

A valid active lease or active conflicting branch-changing workflow requires `HOLD`. Missed slots, role mismatch, previous failure with a ready recovery, or historical worker retirement do not.

## Shared lease

One shared 45-minute lease governs repository and coordination writes.

Before writing:

1. re-read latest state and branch head;
2. inspect relevant workflow activity and branch movement;
3. claim the lease using the latest state SHA;
4. record holder, assignment, intended/executed role, nominal worker, acquisition/expiry, and inspected head;
5. re-read state to confirm ownership.

Do not overwrite active work. Release the lease in the durable handoff or leave an explicit incomplete-handoff record.

## Four-worker execution chain

The preferred product/release path is:

`Worker 1 plan -> Worker 2 research/build -> Worker 3 adversarial test -> Worker 4 independent/mobile/perf/audit`

### Worker 1 — Supervisor / Integrator

Owns official roadmap/assignment creation and dependency ordering. Preserves all required programs and human/publication gates. Normally does not implement product code.

### Worker 2 — Researcher / Builder

Performs the earliest ready research or implementation step. Researches when current architecture/platform evidence is material, implements the smallest safe assigned change, adds focused regression coverage, and hands exact heads/commands to Worker 3. It never self-certifies product work.

### Worker 3 — Test Engineer / Red Team

First dedicated verification stage. Inspects Worker 2 output and existing CI first, then reproduces/falsifies negative paths, races, stale state, route/lease/CHOICE/Send uncertainty, rerenders, duplicates, identity/package boundaries, and adjacent breakage. A reproduced defect becomes a bounded repair assignment rather than a hidden failure.

### Worker 4 — Independent Verification / Mobile / Accessibility / Performance / Release Audit

Second dedicated verification stage and final independent audit perspective. Inspects Worker 3 evidence and relevant running jobs, then covers mobile/cross-browser, viewport/keyboard/orientation, accessibility/focus/names, observer/timer/scan/layout/memory/performance bounds, package/checksum identity, and certification scope as applicable. It inherits former Worker 5 mobile/performance duties and former Worker 6 Devil's Advocate/release-audit duties.

Worker 4 may accept/reject/needs-more-evidence only when its assignment grants audit authority. It must preserve bounded certification limits and never convert hosted/deterministic evidence into unsupported physical-device/live-host claims.

## Local human gates

Human questions are local gates by default. Block only work that genuinely depends on the unanswered decision. Publication, merge, tag/release, stable-channel changes, and other irreversible/public actions remain explicit user gates.

## No-stall durable handoff

Before ending a write-bearing wake:

1. commit implementation/test/audit evidence;
2. update assignment status;
3. activate the earliest dependency-safe successor;
4. update state `currentStep` and `nextAction`;
5. release the lease;
6. re-read canonical state to verify the handoff.

Work must not exist only in chat.

## Evidence and test discipline

Use Repo Nanny when available. Sweep before patching, reproduce before repair, inspect adjacent damage, and distinguish repository evidence, external evidence, and inference.

Do not claim passes without exact commands, CI runs/jobs, or recorded artifacts. Stale-head, queued, cancelled, unrelated, or synthetic-only evidence cannot prove more than it actually demonstrates.

For product/release changes, run applicable syntax, generated parity, unit, browser, mobile, accessibility/performance, base certification, version, package, and checksum gates. Workers 3 and 4 should prefer existing relevant in-flight jobs over duplicate execution.

## Required release programs

Do not silently remove required programs from state/plan. Historical Ghost 8.8 programs include Repair & Resume browser fault injection, frozen/discarded lifecycle recovery, long-chat performance, host-affixed structural mobile shell, build/candidate/channel identity, documentation reconciliation, and final certification/package/checksums.

## Safety boundaries

Workers must never:

- modify `main` without separate explicit authority;
- merge or enable auto-merge without separate explicit authority;
- tag, publish, create a GitHub Release, upload to stores, or change stable/public channels without separate explicit authority;
- replace/clone host Send controls;
- weaken Send, CHOICE, route, shared-lease, uncertainty, exact-identity, structural-demotion, or other fail-closed safeguards;
- lower accepted thresholds merely to hide hosted variance;
- expand certification beyond evidence;
- claim hardware/live-site/publication facts not verified.

## Markers

`[[GITL::PROCEED]]`, `[[GITL::CHOICE]]`, `[[GITL::HOLD]]`, and `[[GITL::HALT]]` retain their task-prompt meanings. They summarize execution state; the durable GitHub handoff is authoritative.