# Agent Succession Rule

Status: authoritative orchestration rule for scheduled and manually invoked autonomous agents.

## Core rule

Assignments are durable agent-executable work units. Worker numbers describe the intended role and evidence slot; they do not reserve the task to one scheduled invocation forever.

When a scheduled slot is missed, delayed, cancelled, or produces no accepted handoff, the next available agent must inspect GitHub state and execute the earliest dependency-ready assignment instead of stopping solely because its appended worker number differs.

## Eligibility

A successor agent may claim a ready assignment when all are true:

1. Project state is active and not awaiting human verification, blocked, or publish-ready.
2. No valid lease is held by another agent.
3. The assignment is ready and its dependencies are satisfied.
4. The assignment has not already been submitted, accepted, rejected, or completed.
5. No active GitHub Actions run or branch movement indicates another agent is still working on it.

## Execution identity

The successor preserves:

- the assignment ID;
- the assignment's role-specific method and safety boundaries;
- the designated evidence path;
- the assignment acceptance criteria and required tests.

The evidence must record both the assignment role/worker slot and that it was executed by a successor agent after a missed slot.

## Ordering

Always take the earliest ready assignment in dependency order. Do not skip a ready predecessor to perform a later worker's task.

## Safety

Agent succession never permits concurrent work, lease bypass, dependency bypass, main-branch changes, merge, auto-merge, tags, releases, publication, or weakened Send/CHOICE/route/lease safeguards.

## Schedule interpretation

The staggered schedule is a wake-up cadence, not a deadlock mechanism. A missed time does not invalidate the assignment and does not require waiting for the same numbered worker in a later cycle.
