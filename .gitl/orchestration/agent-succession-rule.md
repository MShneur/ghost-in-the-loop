# Agent Succession Rule

Status: authoritative orchestration rule for scheduled and manually invoked autonomous agents.

## Core rule

Assignments are durable agent-executable work units. Worker numbers describe the intended role and evidence slot; they do not reserve the task to one scheduled invocation forever.

When a scheduled slot is missed, delayed, cancelled, fails, or produces no accepted handoff, the next available agent must inspect GitHub state and execute the earliest dependency-ready recovery assignment instead of stopping solely because its appended worker number differs.

A failure is work, not a stop condition. The next agent must either fix the proven failure, obtain the missing evidence, or durably narrow the blocker and hand off the next executable repair.

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

## Required handoff transaction

Every worker invocation that writes must finish one atomic logical handoff:

1. Write implementation or research evidence.
2. Mark its assignment `submitted`, `blocked`, `failed`, or `accepted`.
3. Convert every failure into a specific ready recovery assignment when continuation is possible.
4. Update current step and next action.
5. Release the lease.

A worker must not leave only an evidence commit with stale assignment or lease state.

## Schedule interpretation

The staggered schedule is a wake-up cadence, not a deadlock mechanism. A missed time does not invalidate the assignment and does not require waiting for the same numbered worker in a later cycle. Each wake-up takes the earliest ready work.

## Safety

Succession never permits concurrent product edits, dependency bypass, changes to `main`, merge, auto-merge, tags, releases, publication, or weakened Send, CHOICE, route, lease, or uncertainty safeguards.
