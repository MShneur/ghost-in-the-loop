# Worker Evidence Contract

Every scheduled worker must leave a durable, reviewable record in GitHub. Chat output is convenience only; repository evidence is authoritative.

## Evidence path

For round `N` and worker `W`, write:

`.gitl/evidence/round-N/worker-W.md`

Under the four-worker workforce, current scheduled evidence slots are Workers 1–4. Historical Worker 5/6 evidence remains immutable and must not be renamed or rewritten merely because those scheduled identities were retired.

A worker may also add machine-readable details to `round-plan.json`, but the Markdown evidence file is required for human review when an assignment writes.

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
- Mobile/accessibility/performance as applicable
- Certification
- CI run IDs/jobs/artifacts and conclusions

## Acceptance Criteria
- Criterion: PASS / FAIL / NOT TESTED — evidence

## Safety Checks
- Send authority unchanged
- CHOICE behavior unchanged
- Route and lease safety unchanged
- No unauthorized `main`, merge, tag, release, publish, or stable-channel action

## Risks and Limits

## Recommended Next Action

## Assignment Status
- submitted / blocked / rejected / accepted / needs-more-evidence
```

## Four-worker verification responsibilities

- Worker 3 is the first dedicated Test Engineer / Red Team evidence stage.
- Worker 4 is the independent verification/mobile/accessibility/performance/release-audit stage and inherits the historical Worker 6 independent-audit obligation.
- When Worker 4 is assigned audit authority, it must cite the evidence it reviewed and explain every rejection or request for more evidence.
- Workers 3 and 4 must record when they intentionally waited on/classified an already-running relevant test instead of launching a duplicate run.

## Output rules

- Do not claim a test passed without a command result, CI run/job, or recorded artifact.
- Do not claim a source supports more than it states.
- Record exact commit SHAs and CI run/job IDs when available.
- Distinguish product commits from temporary workflow/carrier commits and coordination-only commits.
- Record the final clean branch head after temporary machinery is removed.
- Record anything not tested, unavailable, stale, skipped, timing-only-red, or bounded by hosted/deterministic evidence.
- Preserve contradictory same-payload evidence when it exists; do not erase dissent to simplify a verdict.
- The supervisor must not accept work based only on a scheduled-chat summary.

## Review and revision

When the user asks ChatGPT to review or edit autonomous work, read:

1. `.gitl/autopilot-state.json`
2. `.gitl/orchestration/round-plan.json`
3. `.gitl/orchestration/four-worker-workforce.md`
4. current-round evidence files
5. recorded commits and CI runs/jobs/artifacts
6. relevant source, tests, directives, and briefs

Corrections should remain on the isolated branch unless the user explicitly authorizes another destination. Rejected work should remain traceable rather than being silently erased.