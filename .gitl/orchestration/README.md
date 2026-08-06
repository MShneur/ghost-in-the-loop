# Ghost Autonomous Round Orchestrator

This directory is the durable control plane for six staggered ChatGPT scheduled workers. It is separate from product code but authoritative for autonomous planning, assignments, evidence, and stopping behavior.

## Operating model

Six hourly scheduled tasks run ten minutes apart:

1. `:00` — Supervisor / integrator
2. `:10` — Researcher / architect
3. `:20` — Builder
4. `:30` — Test engineer / Red Team
5. `:40` — Mobile, browser, accessibility, and performance specialist
6. `:50` — Devil's Advocate / release auditor

The supervisor is the only role that may create, reorder, accept, reject, reopen, or retire official roadmap tasks. Specialists may recommend work, but they act only on assignments recorded in `round-plan.json`.

## Canonical files

- `../autopilot-state.json` — authoritative round, branch, lease, and stop state.
- `round-plan.json` — required programs, backlog, assignments, dependencies, acceptance criteria, and evidence status.
- `task-prompts.md` — the universal copy-paste prompt for all six scheduled tasks.
- `evidence-contract.md` — required durable output format for every worker.
- `../briefs/` — user requirements and exploratory product briefs supplied to workers.
- `../evidence/round-N/worker-W.md` — worker evidence for later supervisor, auditor, and human review.

Chat summaries are not authoritative. GitHub state, commits, CI, and evidence files are authoritative.

## Supervisor algorithm

At the start of a round, Worker 1:

1. Reads state, branch head, recent commits, CI, required programs, backlog, briefs, and previous evidence.
2. Verifies or rejects previous claims.
3. Selects a dependency-safe slice of work.
4. Assigns one bounded task to Workers 2–5 and an audit task to Worker 6.
5. Gives every assignment an ID, goal, rationale, dependencies, allowed files, prohibited actions, acceptance criteria, required tests, and fallback work.
6. Updates `round-plan.json` and releases the lease.
7. Does not silently remove a user-required program.

The supervisor normally does not implement product code. It may repair orchestration files when necessary.

## Specialist algorithm

Workers 2–5:

1. Read their exact assignment.
2. Exit without writes when no assignment is ready.
3. Claim the shared lease before any write.
4. Perform one bounded task only.
5. Record research, commits, tests, CI run IDs, risks, and limitations.
6. Write `.gitl/evidence/round-N/worker-W.md`.
7. Mark the assignment `submitted`, not `accepted`.
8. Release the lease.

Worker 6 independently audits the round. It assumes claims are unproven until commits, diffs, tests, CI, and evidence files support them. It marks assignments `accepted`, `rejected`, or `needs-more-evidence`, then sets the round to `awaiting-human-verification`.

## No-stall handoff rule

A scheduled worker must never leave the round waiting on work that already has a durable commit or a documented blocker.

Before ending its invocation, every worker must:

1. Commit all authorized completed work and durable evidence to the isolated branch.
2. Update `round-plan.json` and `autopilot-state.json` with the exact result.
3. Mark the assignment `submitted` when its required gates pass, or `blocked` when they do not.
4. Record the blocker, affected commits, unrun or failing tests, and the exact continuation step.
5. Release the lease.
6. Make the next dependency-safe worker `ready` when that worker can test, diagnose, falsify, or continue from the blocked evidence without pretending the blocked work passed.

A blocked assignment is not completion and must not be accepted as success. It is, however, a valid durable handoff when the next worker's assignment explicitly permits `submitted-or-blocked` and requires preservation of the unresolved limitation.

No worker may end with repository changes existing only in chat, an assignment still marked `ready`, or a next worker left unable to act because bookkeeping was omitted.

## Required product programs

The supervisor must keep all release-critical programs in the plan until they are completed or the user explicitly changes scope.

The current required programs include:

- Repair & Resume browser fault injection.
- Frozen and discarded page lifecycle recovery.
- Long-chat observation and rendering performance.
- Host-affixed mobile shell research, implementation, and certification.
- Build/candidate/channel identity.
- Documentation reconciliation.
- Final certification, packaging, and checksums.

### Host-affixed mobile shell

The mobile shell is mandatory work on top of the existing 8.8 roadmap, not merely an optional note.

Workers must read `../briefs/mobile-shell-concepts.md`. The intended mounts are:

- Teal: a real child in the host header action row.
- Blue: a real final cell in the host composer action row.
- Red: a real sibling row beneath the composer that expands the host footer upward.

Blue and red must not be implemented as viewport overlays. The work must be decomposed across rounds into research, structural mount infrastructure, implementation, adversarial testing, mobile/accessibility/performance certification, cross-adapter expansion, and final audit.

The rail may remain a compatibility fallback when a site cannot pass structural mount verification.

## Lease rules

- One active lease for all repository and coordination writes.
- Default lease duration: 45 minutes.
- A fresh lease blocks every other worker.
- An expired lease may be reclaimed only after checking branch movement and active GitHub Actions.
- A worker must stop if the branch head changed unexpectedly after lease acquisition.
- Every lease update must use the latest file SHA or equivalent conflict-safe write.

## GitHub Actions

When local Git, npm, or Playwright is unavailable, workers may use a temporary guarded workflow on the isolated branch. Product changes may be committed only after required gates pass. Temporary carrier scripts and self-applying workflows must be removed before ordinary clean-head CI.

## Safety boundaries

Workers must never:

- Modify `main`.
- Merge or enable auto-merge.
- Tag, publish, or create a GitHub Release.
- Replace or clone host Send controls for the structural UI.
- Weaken Send, CHOICE, route, lease, or uncertainty safeguards to satisfy tests.
- Expand scope without supervisor approval.
- Claim tests or sources they did not verify.

## Round modes

`review-after-round` is the current mode. After Worker 6 finishes, all tasks no-op until human review in ChatGPT.

During review, ChatGPT can read the state, round plan, worker evidence, commits, and CI; explain what happened; reject unsupported work; and write corrections to the isolated branch when the user asks.

A future `continuous` mode may let the next supervisor run open another round automatically, but only after the review-after-round workflow proves reliable.
