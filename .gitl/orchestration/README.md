# Ghost Autonomous Round Orchestrator

This directory is the durable control plane for staggered ChatGPT scheduled workers. It is intentionally separate from product code.

## Operating model

Six hourly scheduled tasks run ten minutes apart:

1. `:00` — Supervisor / integrator
2. `:10` — Researcher / architect
3. `:20` — Builder
4. `:30` — Test engineer / Red Team
5. `:40` — Mobile, browser, and performance specialist
6. `:50` — Devil's Advocate / release auditor

The supervisor is the only role that may create, reorder, accept, reject, reopen, or retire official roadmap tasks. Specialists may recommend work, but they act only on assignments recorded in `round-plan.json`.

## Files

- `../autopilot-state.json` — authoritative round and lease state.
- `round-plan.json` — backlog, current assignments, dependencies, acceptance criteria, and evidence status.
- `task-prompts.md` — copy-paste prompts for the six scheduled tasks.
- `../briefs/` — exploratory product briefs supplied to workers. Briefs are not accepted product decisions until the supervisor and auditor approve them.

## Supervisor algorithm

At the start of a round, Worker 1:

1. Reads the state, branch head, recent commits, CI, backlog, and previous evidence.
2. Verifies or rejects previous claims.
3. Selects a dependency-safe slice of work.
4. Assigns one bounded task to Workers 2–5 and an audit task to Worker 6.
5. Gives every task explicit scope, allowed files, dependencies, acceptance criteria, and required tests.
6. Updates `round-plan.json` and releases the lease.

The supervisor normally does not implement product code. It may repair coordination files when necessary.

## Specialist algorithm

Workers 2–5:

1. Read their exact assignment.
2. Exit without writes when no assignment is ready.
3. Claim the shared lease before any write.
4. Perform one bounded task only.
5. Record research, commits, tests, CI run IDs, risks, and limitations.
6. Mark the assignment `submitted`, not `accepted`.
7. Release the lease.

Worker 6 independently audits the round. It assumes claims are unproven until commits, diffs, tests, and CI support them. It marks assignments `accepted`, `rejected`, or `needs-more-evidence`, then sets the round to `awaiting-human-verification`.

## Lease rules

- One active lease for all repository and coordination writes.
- Default lease duration: 45 minutes.
- A fresh lease blocks every other worker.
- An expired lease may be reclaimed only after checking branch movement and active GitHub Actions.
- A worker must stop if the branch head changed unexpectedly after lease acquisition.

## GitHub Actions

When local Git, npm, or Playwright is unavailable, workers may use a temporary guarded workflow on the isolated branch. Product changes may be committed only after required gates pass. Temporary carrier scripts and workflows must be removed before ordinary clean-head CI.

## Safety boundaries

Workers must never:

- Modify `main`.
- Merge or enable auto-merge.
- Tag, publish, or create a GitHub Release.
- Weaken Send, CHOICE, route, lease, or uncertainty safeguards to satisfy tests.
- Expand scope without supervisor approval.

## Round modes

`review-after-round` is the current mode. After Worker 6 finishes, all tasks no-op until human review.

A future `continuous` mode may let the next supervisor run open another round automatically, but only after the review-after-round workflow proves reliable.
