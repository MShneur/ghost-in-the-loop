# Native Site Takeover — Worker 4 Independent Audit

Date: 2026-08-10
Role: Worker 4 — Independent Verification / Mobile / Accessibility / Performance / Release Audit

## Gate

**FAIL — not independently releasable at the audited head.**

This is a verification failure, not a claim that the runtime Send implementation is definitively broken. The latest independent audit attempt fails in the shared-Send contract harness before the required downstream native/cross-browser/accessibility/build/performance lanes can run.

## Exact audited head

- Repository: `MShneur/ghost-in-the-loop`
- Branch: `feature/native-site-takeover`
- Audited implementation/carrier head: `a8f5b3964423c27dc9e4d2906ad77058ab45a926`
- Current coordination head observed after audit: `964e6e2b21c6b42cecf02b2099605289c31af264`
- Current coordination head is a handoff commit whose parent is the audited head; no stable/release branch was modified by this audit.

## CI evidence

- Workflow: `Native Site Takeover Audit`
- Run: `31416476528`
- Latest observed attempt: `2`
- Job: `93546591176` (`independent-audit`)
- Conclusion: `failure`

### Full unit regression gate

Command executed by CI: `npx jest --runInBand`

Result:

- Test suites: **1 failed, 24 passed, 25 total**
- Tests: **2 failed, 131 passed, 133 total**
- Failing suite: `tests/repo-nanny/round10-shared-send-contract.test.js`
- Both failures stop at: `TypeError: window.__ROUND10_SHARED_SEND__.isInComposer is not a function`
- The failing cases are the two safety-critical shared-Send assertions:
  1. invalid immediate completion must not actuate Send or consume the one-shot click budget;
  2. valid immediate completion must dispatch exactly one reviewed button click.

### Interpretation

The latest attempt does **not** prove a runtime bad-send regression. It proves that the independent shared-Send verification surface is currently mismatched/incomplete: the test expects an `isInComposer` function that the exported probe object does not expose. Because the harness throws before the behavioral assertions complete, the required invalid-state 0-click and valid-state 1-click semantics are **NOT CERTIFIED** by this attempt.

Do not weaken those two assertions. Repair the probe/export/harness contract first. Only change production Send behavior if the behavioral assertions still fail after the harness can actually execute them.

## Downstream coverage on this exact attempt

The full-unit gate failed first, so the workflow correctly skipped downstream lanes. Therefore the following are **NOT RUN on the latest independent attempt**:

- Native ChatGPT lifecycle — Chromium
- Native ChatGPT lifecycle — Firefox
- Native ChatGPT lifecycle — WebKit
- Cross-browser smoke + accessibility ownership gate
- Generated extension parity
- Base certification
- Reliable E2E faults / Continue gate
- Lighthouse app-shell performance smoke

Worker 2 previously recorded green focused Chromium/Firefox/WebKit native lifecycle, generated parity, lint, browser smoke, composer evidence and base certification on its own product head. That evidence remains useful prior evidence, but it is not a substitute for a current independent rerun after the shared-Send gate is repaired.

## Required invariants still gating acceptance

A repaired independent run must execute and preserve all of these without weakening assertions:

- exact original Send node identity;
- zero passive Send/submit/input/keydown actuation;
- focus preservation;
- clean fail-closed demotion to the existing rail on invalid/ambiguous/lost structural verification;
- one native mount only, with bounded observer/repair resources and cleanup;
- invalid-state Send = 0 clicks / false dispatch;
- valid-state Send = exactly 1 reviewed click / true dispatch;
- generated extension parity/build identity;
- existing CHOICE, route, lease, composer-staging and uncertainty safeguards.

## External/optional tool status

- BrowserStack: **UNAVAILABLE in this automation environment**; not run.
- Checkly: **UNAVAILABLE in this automation environment**; not run.
- Percy: **UNAVAILABLE in this automation environment**; not run.
- Lighthouse/LHCI: workflow lane exists, but **SKIPPED on this attempt** because the full-unit gate failed first.
- Axe/accessibility ownership: current workflow lane **SKIPPED on this attempt** for the same reason.

These optional unavailable services are not the present blocker. The shared-Send independent unit gate is the first concrete blocker.

## Handoff to Worker 1

Route one narrow repair to Worker 2:

1. Reconcile the Round-10 shared-Send test probe/export so `isInComposer` is callable by the existing tests, or update the harness to the actual production helper surface without weakening the behavioral contract.
2. Keep both invalid 0-click and valid exactly-1-click assertions unchanged in meaning.
3. Do not make broader Send/runtime changes unless those behavioral assertions fail after the harness executes normally.
4. Rerun the exact `Native Site Takeover Audit` from the repaired head.
5. Worker 4 should not accept the native takeover until the full unit gate is green and the downstream Chromium/Firefox/WebKit, accessibility ownership/Axe, generated parity/base certification, E2E fault, and Lighthouse lanes actually execute and are reviewed.

## Bounded conclusion

`FAIL` at independent audit scope. The first actionable defect class is a **shared-Send verification harness/API mismatch**. Runtime native takeover behavior remains only previously evidenced by Worker 2 until a fresh independent run clears this gate and reaches the downstream lanes.