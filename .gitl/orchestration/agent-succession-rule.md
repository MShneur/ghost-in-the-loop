# Agent Succession and Continuous Research Rule

Status: authoritative orchestration rule for scheduled and manually invoked autonomous agents.

## Core rule

Assignments are durable agent-executable work units. Worker numbers describe the intended role and evidence slot; they do not reserve the task to one scheduled invocation forever.

When a scheduled slot is missed, delayed, cancelled, fails, or produces no accepted handoff, the next available agent must inspect GitHub state and execute the earliest dependency-ready recovery assignment instead of stopping solely because its appended worker number differs.

A failure is work, not a stop condition. The next agent must either fix the proven failure, obtain the missing evidence, or durably narrow the blocker and hand off the next executable repair.

## Active-work wait gate

Succession must not create duplicate work.

Before taking over an assignment, the next agent must check:

1. The shared lease.
2. Active GitHub Actions for the recorded branch and head.
3. Branch movement after the recorded lease or assignment start.
4. New commits, evidence, or state updates indicating that another agent is still working.

When a valid lease, active workflow, or consistent branch activity proves another agent is working, the next agent must wait and report HOLD. It must not start the same assignment, edit overlapping files, or create a competing handoff.

A missed nominal time is not evidence that the assigned agent is inactive. Repository and workflow evidence decide whether work is active.

## Eligibility

A successor agent may claim a ready assignment when all are true:

1. Project state is active and not publish-ready.
2. The assignment is ready and its dependencies are satisfied.
3. The assignment has not already been accepted or completed.
4. No active GitHub Actions run or branch movement indicates another agent is still modifying the same files.
5. No valid lease is held by another agent, except incomplete-handoff recovery below.

## Incomplete-handoff recovery

A lease must not deadlock the loop after its owner has clearly finished.

The next agent may repair and release a still-recorded lease before expiry when repository evidence proves all of the following:

1. The lease holder committed its required evidence or final work.
2. That evidence records a finished time and explicitly says the lease was or should be released.
3. No active workflow or subsequent branch movement indicates the holder is still working.
4. The recovery changes only coordination state needed to complete the handoff.
5. The recovery evidence records the stale lease, the proof of completion, and the repair commit.

If these conditions are not met, the lease remains authoritative.

## Execution identity

The successor preserves the assignment ID, role-specific method, safety boundaries, evidence path, acceptance criteria, and required tests. Evidence records both the intended assignment role and the successor agent that executed it.

## Ordering

Always take the earliest ready assignment in dependency order. If its last attempt failed, retry or repair that failure before starting a later program. Do not skip a ready predecessor.

## Bounded research fallback

Research is useful fallback work, but never a substitute for an executable ready assignment.

An agent may perform a bounded research task only when:

1. No dependency-ready implementation, repair, test, certification, documentation, packaging, or audit assignment is available to it.
2. No other agent is actively working on the relevant assignment or overlapping files.
3. The research does not alter release scope or claim completion of a required program.
4. The result is written as a concise research note or proposed backlog item for supervisor review.

Research fallback topics should be directly relevant to the next project update, such as:

- New browser lifecycle, userscript, extension, accessibility, or performance behavior from authoritative primary sources.
- Better deterministic test fixtures, CI workflows, Playwright configurations, scripts, artifact checks, or failure diagnostics.
- Simpler or safer architecture patterns that preserve Send, CHOICE, route, lease, and uncertainty protections.
- New project risks, compatibility changes, or maintenance improvements.

Research fallback must not modify production code unless the round plan explicitly assigns implementation. It must state sources, implications, uncertainty, and the exact proposed next action.

## Release-ready research mode

Publish-ready is a stop condition for release mutation, not a reason to waste scheduled research capacity.

After the current release workload is complete and the isolated branch is genuinely publish-ready:

1. Do not merge, tag, publish, create a release, or modify `main`.
2. Preserve the release candidate, checksums, evidence, and final clean head unchanged.
3. Scheduled agents may perform non-mutating or separately recorded research for the next update.
4. Research must be stored outside the frozen release-candidate artifact set, clearly labeled `next-update-research`, and must not change the candidate's checksums or publish-ready verdict.
5. Findings remain proposals until a human or future supervisor opens a new development round.

Suitable next-update research includes new workflows, improved scripts, test ideas, architecture concepts, compatibility investigations, and evidence-backed feature proposals.

## Required handoff transaction

Every worker invocation that writes must finish one atomic logical handoff:

1. Write implementation or research evidence.
2. Mark its assignment `submitted`, `blocked`, `failed`, `research-only`, or `accepted`.
3. Convert every failure into a specific ready recovery assignment when continuation is possible.
4. Update current step and next action.
5. Release the lease.

A worker must not leave only an evidence commit with stale assignment or lease state.

## Schedule interpretation

The staggered schedule is a wake-up cadence, not a deadlock mechanism. A missed time does not invalidate the assignment and does not require waiting for the same numbered worker in a later cycle. Each wake-up takes the earliest ready work.

Decision order at every wake:

1. If another agent is demonstrably working, wait.
2. Otherwise execute the earliest dependency-ready assignment.
3. If none exists, perform one bounded research fallback task.
4. If the release candidate is frozen and publish-ready, perform next-update research without changing the candidate.

## Safety

Succession and research never permit concurrent product edits, dependency bypass, changes to `main`, merge, auto-merge, tags, releases, publication, altered release-candidate checksums, or weakened Send, CHOICE, route, lease, or uncertainty safeguards.
