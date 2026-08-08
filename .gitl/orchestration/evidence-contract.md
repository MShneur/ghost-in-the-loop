# Worker Evidence Contract

Every scheduled worker must leave a durable, reviewable record in GitHub. Chat output is only a convenience summary; the repository evidence is authoritative.

## Evidence path

For round `N` and worker `W`, write:

`.gitl/evidence/round-N/worker-W.md`

A worker may also add machine-readable details to `round-plan.json`, but the Markdown evidence file is required for human review.

## Required evidence fields

```markdown
# Ghost Worker Evidence

## Identity
- Round:
- Worker:
- Role:
- Assignment ID:
- Started at:
- Finished at:

## State Read
- Branch:
- Starting head:
- Lease state:
- Dependencies:

## Step Performed

## Research Sources
- Primary source and implication
- Repository evidence and implication
- Inferences clearly labeled

## Changes
- Files changed
- Commit SHA or no-change explanation
- Generated artifacts
- Temporary files created and removed

## Tests
- Focused tests
- Full unit suite
- Browser matrix
- Certification
- CI run IDs and conclusions

## Acceptance Criteria
- Criterion: PASS / FAIL / NOT TESTED — evidence

## Safety Checks
- Send authority unchanged
- CHOICE behavior unchanged
- Route and lease safety unchanged
- No `main`, merge, tag, or publish action

## Risks and Limits

## Recommended Next Action

## Assignment Status
- submitted / blocked / rejected / accepted
```

## Output rules

- Do not claim a test passed without a command result, CI run, or recorded artifact.
- Do not claim a source supports more than it actually states.
- Record exact commit SHAs and CI run IDs.
- Distinguish product commits from temporary workflow or carrier commits.
- Record the final clean branch head after temporary machinery is removed.
- Record anything not tested.
- Worker 6 must cite the evidence files it reviewed and explain every rejection or request for more evidence.
- The supervisor must not accept a task based only on the scheduled-chat response.

## Review and revision

When the user asks ChatGPT to review or edit the autonomous work, ChatGPT should read:

1. `.gitl/autopilot-state.json`
2. `.gitl/orchestration/round-plan.json`
3. Every evidence file for the current round
4. Recorded commits and CI runs
5. Relevant source, tests, and briefs

Corrections should be written only to the isolated branch unless the user explicitly authorizes another destination. Rejected work should remain traceable rather than being silently erased from the ledger.
