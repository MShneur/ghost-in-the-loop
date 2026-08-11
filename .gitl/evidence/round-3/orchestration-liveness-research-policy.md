# Ghost Orchestration Evidence

## Identity
- Round: 3
- Change: Active-work wait gate and continuous research fallback
- Trigger: Human report that the 6:10 wake was missed and that idle agents should research without duplicating active work

## State Read
- Branch: `agent/8.8-repair-resume`
- Starting head: `f544d46c814cbbede9049c00e25192587ddc4264`
- Lease at start: none
- Active branch workflows at inspection: none
- Earliest ready product assignment preserved: `R3-A1-RR-CI-RECOVERY`

## Root-Cause Analysis

The original orchestration treated numbered workers and scheduled minutes too rigidly. Worker 1 had already corrected the main deadlock by publishing automatic successor dispatch and making the earliest ready assignment claimable by any eligible agent.

A remaining ambiguity could still cause either wasted capacity or duplicate work:

1. A missed clock slot alone did not clearly distinguish an inactive agent from an agent still running beyond its nominal slot.
2. HOLD behavior did not define productive fallback work when no executable assignment existed.
3. Publish-ready stopped release mutation correctly, but did not define how scheduled agents could continue gathering next-update research without changing the frozen candidate.

## Change Performed

Updated `.gitl/orchestration/agent-succession-rule.md` with:

- An active-work wait gate based on lease, active workflows, branch movement, and new evidence.
- An explicit rule that missed time alone is not proof of inactivity.
- A bounded research fallback when no dependency-ready work exists and no agent is active.
- A release-ready research mode that freezes the candidate and stores next-update research separately.
- A deterministic wake decision order: wait for active work; otherwise execute ready work; otherwise research.

## Safety Checks

- Existing ready assignment was not displaced or modified.
- No production source, test, generated artifact, or release candidate file changed.
- No `main`, merge, tag, release, auto-merge, or publication action occurred.
- Send, CHOICE, route, lease, and uncertainty protections were not modified.

## Verification

- Confirmed Worker 1's automatic succession fix exists in current state.
- Confirmed the succession rule is a mandatory read from state.
- Confirmed no active branch workflow existed before coordination writes.
- Confirmed the new rule preserves the earliest-ready assignment and active-work exclusion.

## Result

The orchestration now distinguishes three cases:

1. Another agent is active: wait and do not duplicate work.
2. No agent is active and ready work exists: the next agent takes it regardless of nominal worker number.
3. No executable work exists: perform one bounded research task for the next update.

At publish-ready, agents may research future improvements but may not mutate the frozen candidate or its checksums.
