# Round 10 — Worker 1 Supervisor Handoff: Shared Send Regression Before Claude

Date: 2026-08-10
Role: Worker 1 — Supervisor / Integrator
Branch: `feature/native-site-takeover`

## Decision

**Do not start the Claude production takeover slice yet.** The earliest dependency-ready work is one narrow Worker-2 repair of the shared multiline contenteditable Send evidence regression reproduced independently after the ChatGPT native takeover product slice.

This is a dependency gate, not a request for broad research or a native-mount rewrite.

## Evidence inspected

- User authority: `.gitl/user-directives/2026-08-10-native-site-takeover.md`.
- Workforce contract: `.gitl/orchestration/four-worker-workforce.md`.
- Product plan: `docs/NATIVE-SITE-TAKEOVER-PLAN.md`.
- Worker-2 ChatGPT production evidence: `.gitl/evidence/native-site-takeover/worker-2-chatgpt.md`.
- Worker-3 red-team evidence: `.gitl/evidence/round-10/worker-3.md`.
- Current takeover branch observed at `a8f5b3964423c27dc9e4d2906ad77058ab45a926` before this handoff commit.
- Worker-3 full E2E run `31407818746`, job `93529321423`: ChatGPT takeover focused tests passed; shared `tests/e2e/repo-nanny/send-evidence.spec.js` multiline contenteditable case failed (`delivered` expected `true`, received `false`).
- Worker-4 browser audit run `31416476528`, job `93546591176`: current product takeover checks passed, and the same shared multiline contenteditable Send evidence failure was reproduced again. This converts the Worker-3 observation from a one-run suspicion into an independently reproduced blocker.
- The separate Worker-2 workflow run `31414109600`, job `93538901779`, is **not** an authoritative product repair. It applied a deterministic slice in the runner workspace and failed before commit because its generated native-takeover test waited for `#gitl` to be visible even when a successful native mount intentionally suppresses that rail. Do not repeat that stale test assumption or treat that failed run as a product regression.

## Worker 2 assignment — exactly one repair

Find and repair the smallest root cause of the **shared multiline contenteditable staging/verification failure** in the current takeover branch. The repair must not weaken the exact prompt-staging guard and must not change the native structural behavior unless evidence proves the structural code is the cause.

### Required investigation boundary

1. Reproduce the single failing case from `tests/e2e/repo-nanny/send-evidence.spec.js` on the exact current branch head.
2. Inspect the current rich-editor text/staging path (including `_composerText`, `_promptStagedInComposer`, normalization, and the contenteditable input event/DOM normalization path) and identify why the visible multiline prompt is rejected.
3. Compare with the previously accepted semantic-rich-editor behavior rather than applying a blind patch. If the current `_composerText` already uses rendered text (`innerText`) with fallback, determine the actual divergence before changing code.
4. Make the smallest production change plus focused regression required to restore the valid multiline case. Do not loosen acceptance of incomplete/wrong prompts.

## Acceptance criteria

Worker 2 may hand to Worker 3 only when all of the following are true on one exact committed head:

1. `tests/e2e/repo-nanny/send-evidence.spec.js` passes the block-normalized multiline contenteditable prompt and retains the existing bad-state `0` / valid-state `1` Send evidence contract.
2. `tests/e2e/native-takeover/chatgpt-production.spec.js` remains green (current focused production takeover suite).
3. Exact native Send node identity is preserved; no wrap/clone/replace/move of native Send.
4. Passive native mount/repair causes zero Send, submit, input, or keydown actuation and does not steal focus.
5. Invalid, ambiguous, disconnected, clipped, or replaced structural targets still fail closed to the existing rail.
6. At-most-once Send, CHOICE, route, lease, composer-staging, and uncertainty safeguards are unchanged and their relevant regressions remain green.
7. `npm run build:extension` and `npm run check:generated` pass after any product-source change.
8. Run the focused shared Send suite plus focused ChatGPT takeover suite first; then run the repository E2E certification lane needed to demonstrate the reproduced shared regression is gone. Record exact commands, counts, run/job IDs, and any skips/limits.
9. Do not weaken assertions, mark the failing case skipped, or change the expected `delivered === true` result to mask the defect.

## Explicit non-assignment

- No Claude implementation in this step.
- No accessibility cleanup in this step.
- No broad adapter research.
- No merge, auto-merge, tag, publication, release, or stable-channel mutation.
- Do not modify `main`, `release/8.8.0-staging`, or `agent/8.8-repair-resume`.

## Handoff

Worker 2 owns this one repair. Worker 3 should falsify the exact repaired head before the sequence advances to Claude. Worker 4 should independently re-run the browser/mobile/shared-Send audit after Worker 3 passes.
