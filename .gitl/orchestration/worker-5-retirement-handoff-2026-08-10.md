# Worker 5 Retirement and Four-Worker Handoff

Date: 2026-08-10

Status: complete coordination handoff. This file is intended to make the former Worker 5 chat disposable without losing operational context.

## User directive

The user explicitly scaled Ghost/GITL down to four scheduled workers, requested extra time for two testing stages, requested Worker 5 remove itself from the schedule, and requested a complete handoff before deleting the Worker 5 chat.

## Current product/release state

Canonical state before this migration was `complete-awaiting-publication-authority`, Round 9 complete, with all authorized Ghost 8.8 deterministic/non-published release-candidate work finished. Publication remains a separate explicit user gate.

This migration did **not** reopen development or change candidate payload bytes.

The five immutable payload paths remain:

- `ghost-in-the-loop.user.js`
- `extension/manifest.json`
- `extension/content.js`
- `extension/icon-48.png`
- `extension/icon-96.png`

Their canonical hashes and package/checksum provenance remain in `.gitl/autopilot-state.json`, Round 7 identity evidence, and Round 9 final package evidence.

## Four-worker schedule

Future Ghost cadence:

- Worker 1 — `:00` — Supervisor / Integrator
- Worker 2 — `:10` — Researcher / Builder
- Worker 3 — `:30` — Test Engineer / Red Team
- Worker 4 — `:50` — Independent Verification / Mobile / Accessibility / Performance / Release Audit

Intentional gaps:

- Worker 2 -> Worker 3: 20 minutes
- Worker 3 -> Worker 4: 20 minutes

These gaps are test runway. Workers 3 and 4 should inspect/wait on relevant in-flight CI rather than launch overlapping work when the existing run is the authoritative next evidence.

## Responsibility transfer

Former Worker 5 responsibilities transferred to Worker 4:

- mobile Chromium / Gecko-relevant behavior
- viewport, keyboard, orientation, visual viewport
- accessibility, focus, accessible names
- observers/timers/scans/layout shifts/memory/performance
- lower-end/constrained-device evidence

Former Worker 6 scheduled responsibilities also transferred to Worker 4:

- independent Devil's Advocate review
- release/certification audit
- accept/reject/needs-more-evidence when assignment grants audit authority
- explicit bounded-certification dissent

Historical Worker 5/6 evidence remains immutable and is not renumbered.

## Durable GitHub changes

Migration base head: `6cb0339ed28990815487c87d570e2a13e44091ee`

Migration commits:

- `5c8d04e6ee7a3464537f903e156f262a6fead6a7` — add four-worker workforce contract
- `ca89149a8e56fc21971538d904025dbd2aece618` — migrate orchestrator README
- `c5bb6461cd4e76daa0b344131b115e97b8ab0751` — rewrite universal scheduled prompt for four workers
- `bef0ba881866ca1d2954c7680bbf04b2a9f913b3` — change round-plan cadence to four workers with two verification stages
- `7c44909b999f6de97a31b2d8d381da27e5bdb376` — move independent audit evidence duties to Worker 4

Compare from migration base to `7c44909b999f6de97a31b2d8d381da27e5bdb376` changed **only** `.gitl/orchestration/**` files. No candidate payload file changed.

Authoritative new/updated files:

- `.gitl/orchestration/four-worker-workforce.md`
- `.gitl/orchestration/README.md`
- `.gitl/orchestration/task-prompts.md`
- `.gitl/orchestration/round-plan.json`
- `.gitl/orchestration/evidence-contract.md`

## Scheduler handoff

The current Ghost release task definitions were rewritten to the four-worker shape but intentionally remain disabled because the candidate is frozen awaiting publication authority.

Task IDs:

- Agent 1 `:00`: `6a77610632588191bf75d0a0c68a8ae9` — title `Ghost 4W Agent 1 :00` — disabled
- Agent 2 `:10`: `6a77610f1c4c8191ab8622d00d1d7dda` — title `Ghost 4W Agent 2 :10` — disabled
- Agent 3 `:30`: `6a776116874481919016cd440e783deb` — title `Ghost 4W Agent 3 :30` — disabled
- Agent 4 `:50`: `6a77611e214c81919daa94c6edc08944` — title `Ghost 4W Agent 4 :50` — disabled
- Former Agent 5: `6a75095a8fa08191bbdc11543ed48c1a` — retitled `RETIRED Ghost Agent 5` — disabled; do not run

The automation interface available to this chat supports disabling/updating tasks, not deleting the task record. Therefore Worker 5 was removed from executable schedule by disabling it and replacing its prompt with a retirement pointer to this durable handoff.

Older legacy Ghost timer tasks are also disabled and are not part of the four-worker workforce.

## Restart rule

Do **not** simply re-enable the four tasks while state remains `complete-awaiting-publication-authority`.

If the user opens a new Ghost development/verification round, the supervisor should first update canonical state/plan for the new objective. Then the four tasks may be enabled with the `:00, :10, :30, :50` cadence.

If the user grants publication authority instead, treat that as a separate explicit public/irreversible gate; do not infer merge/tag/release/store/stable-channel authority from this workforce migration.

## Safety boundaries preserved

No migration action authorized or performed:

- `main` modification
- merge or auto-merge
- tag or GitHub Release
- publication/store upload/stable-channel change
- weakening Send, CHOICE, route, lease, uncertainty, identity, structural-demotion, package, or certification safeguards

## What this former Worker 5 chat uniquely knew

All material operational knowledge from this chat is now durable in GitHub or the scheduler:

- the reason for the four-worker scale-down;
- the test-spaced cadence;
- Worker 5 responsibility transfer to Worker 4;
- Worker 6 audit-role transfer to Worker 4;
- the requirement not to renumber historical evidence;
- the frozen 8.8 candidate/publication boundary;
- the scheduler IDs/statuses;
- the no-duplicate-test rule for the two test stages;
- the exact migration commits and integrity result.

No unresolved implementation task is held only in this chat.

## Deletion readiness

This Worker 5 chat is safe to delete once this handoff file exists on the isolated branch and the scheduler shows former Agent 5 disabled/retired. Both conditions were satisfied during the migration.
