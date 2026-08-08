# Ghost Worker Evidence

## Identity
- Round: 4
- Worker evidence slot: 3
- Nominal executing wake: 3
- Intended role: Builder
- Assignment ID: `R4-A2-LIFECYCLE-BUILD`
- Started at: `2026-08-07T03:28:00Z`
- Finished at: `2026-08-07T03:31:23Z`

## State Read
- Branch: `agent/8.8-repair-resume`
- Starting inspected head: `9527d70cc4f3072b9e0622a00b13cf7bbccfac75`
- Starting lease state: `null`
- Lease claim commit: `1f8383a409514fbad90740dfb21ec72d1249cc89`
- Lease holder: `scheduled-agent-3`
- Dependency: `R4-A1-LIFECYCLE-CONTRACT:submitted` satisfied.
- Active workflow check before claim: visible run `31143996105` on starting head was completed successfully; no active conflicting workflow was found.
- Deferred human queue: `.gitl/deferred-questions.md` does not currently exist; no human decision is required by this assignment.

## Step Performed

Executed the A2 fallback exactly as authorized: added deterministic production-path lifecycle coverage to the existing real userscript Playwright fixture **before changing any production code**.

The accepted A1 contract presented two credible implementation philosophies:

1. **Minimal recovery seam:** keep `recoverAfterWake` as the sole reactivation gate and add executable lifecycle coverage first.
2. **Lifecycle-aware quiesce/resume:** add a Chromium-specific `freeze` teardown path before evidence proves it is needed.

The builder independently challenged the predecessor by exercising the second philosophy as a falsifiable test case rather than implementing it. The new fixture explicitly dispatches `freeze` and verifies that it is non-actuating, then dispatches `resume` through the existing central recovery seam. No product change was made because there is still no executed evidence of a concrete lifecycle defect that would justify a Chromium-specific state machine.

The same fixture adds production-copy instrumentation for runtime rebuild counts and adds three lifecycle scenarios to `tests/e2e/repair-resume-production.spec.js`:

- BFCache-style `pageshow` with `persisted=true`, immediately followed by `resume` and `focus`, expecting one coalesced runtime rebuild and zero Send actuation.
- Chromium-style `freeze` followed by `resume`, expecting no freeze-side actuation and exactly one recovery rebuild on resume.
- A fresh document with fixture-injected `document.wasDiscarded=true`, expecting fresh `IDLE` boot and zero submit/click/input/keydown Send-adjacent events.

The test copy exposes only test-scoped counters/helpers; no persistent production debug API was added.

## Research Sources

### Repository evidence
- `docs/lifecycle-recovery-contract.md` — accepted A1 contract; explicitly says A2 should attempt executable coverage first and should not add a `freeze` teardown unless a concrete resource/lifecycle failure requires it.
- `tests/lifecycle-recovery-contract.test.js` — source-contract coverage passed on exact A1X head but leaves three explicit TODO execution gaps for BFCache, discard fresh boot, and Chromium freeze.
- `tests/e2e/repair-resume-production.spec.js` — existing production-copy Playwright harness already instruments real ticker/cache/heartbeat behavior and zero-Send assertions on desktop Chromium and Pixel 7 Chromium.
- `ghost-in-the-loop.user.js` — production wake listeners route `visibilitychange`, `pageshow`, `focus`, and Chromium `resume` through `recoverAfterWake`; no `freeze` listener or `document.wasDiscarded` production branch currently exists.
- `.gitl/evidence/round-4/worker-2.md` — A1/A1X evidence favors the minimal seam and explicitly requires browser-real/production-path coverage before product changes.

### Competing expert lenses
- **Minimal cross-browser architect:** adding only fixture coverage reduces browser-specific state divergence and preserves the already-central recovery seam. Failure mode: frozen resources may remain allocated longer on Chromium.
- **Lifecycle-specialized browser engineer:** a narrow Chromium `freeze` teardown could reduce resource residency. Failure mode: a second lifecycle state machine can duplicate teardown/restart work and accidentally change loop state.
- **Aggregate user lens:** the critical observable outcome is no duplicate action, no silent stale-work resurrection, and usable recovery after mobile/background pressure. Existing A1 community evidence is anecdotal and lower-ranked than the new deterministic target-project fixture.
- **Test/certification lens:** no implementation choice should be promoted from source reasoning alone; exact-head Playwright execution must discriminate the candidates.

### Tooling limitation
- Repo Nanny was requested by the project prompt but its skill resource returned a reauthentication error in this invocation. The repository sweep was therefore performed through connected GitHub state, plan, evidence, source, test, commit-diff, branch-comparison, and workflow inspection instead.

## Changes
- `.gitl/autopilot-state.json`
  - Lease claim commit: `1f8383a409514fbad90740dfb21ec72d1249cc89`.
- `tests/e2e/repair-resume-production.spec.js`
  - Test commit: `10bece4cef59c13f17ad97882aafcbfe15597b84`.
  - Adds test-only counters for GhostBus initialization and re-detection.
  - Adds test-only `prepareWakeState` and wake snapshot helpers.
  - Adds BFCache/duplicate-wake, freeze/resume, and discarded-fresh-document production-copy scenarios.
- Production source changed: **none**.
- Generated extension source changed: **none**.
- Temporary workflow/carrier changed: **none** — A2 does not authorize `.github/workflows/**`.

## Tests

### Executed evidence available before this assignment
- A1X exact-head Jest: run `31143832068`, job `92759102485`, tested head `79de931a689c731a680ae4c1e1360f0ec4ad9ce7`.
- Command: `npx jest tests/wake-recovery.test.js tests/lifecycle-recovery-contract.test.js --runInBand`.
- Result: 2/2 suites passed; 12 tests passed; 3 explicit TODOs; zero failures.

### This assignment's new production-path coverage
- Required exact command for the next execution-capable assignment:
  - `npx playwright test tests/e2e/repair-resume-production.spec.js --project=chromium`
- Mobile follow-on command already selected by existing project config:
  - `npx playwright test tests/e2e/repair-resume-production.spec.js --project=chromium-mobile`
- New fixture execution on exact head: **NOT EXECUTED**.
- Reason: connected GitHub exposes no direct shell execution, and A2's allowed files do not include `.github/workflows/**`; the assignment fallback explicitly requires committing deterministic fixture coverage and blocking only on execution evidence when browser execution is unavailable.
- Generated parity: NOT REQUIRED because product/generated source did not change.
- Full unit suite: NOT REQUIRED by A2 fallback because product source did not change.

A branch diff from lease claim `1f8383a409514fbad90740dfb21ec72d1249cc89` to test commit `10bece4cef59c13f17ad97882aafcbfe15597b84` contains exactly one changed file: `tests/e2e/repair-resume-production.spec.js` (145 additions, 1 deletion). No production file was touched.

## Acceptance Criteria
- Current or repaired lifecycle path follows R4-A1 contract: **NOT YET CERTIFIED** — deterministic production-copy assertions are committed but unexecuted.
- Recovery is idempotent/exactly-once for restarted runtime services: **NOT TESTED on new fixture** — the BFCache burst assertion requires one ticker/heartbeat/cache/bus/re-detect rebuild.
- No lifecycle event actuates Send: **NOT TESTED on new fixture** — every new scenario asserts zero submit/click/input/keydown activity.
- CHOICE and uncertain prior dispatch remain fail closed: **PASS by unchanged production + existing A1/A1X source contract; NOT independently re-executed here**.
- Discard/reload-like recovery does not resurrect stale in-memory work: **NOT TESTED on new fixture** — fresh document assertion expects `IDLE` with fixture-injected `document.wasDiscarded=true`.
- Generated userscript/extension parity is preserved: **PASS by no product/generated change**.
- Reproduce concrete lifecycle failure before product repair: **PASS operationally** — no product repair was attempted because no executable production-path failure has yet been reproduced.

## Safety Checks
- Send authority unchanged: **PASS** — production source unchanged; fixture observes but does not actuate Send.
- CHOICE behavior unchanged: **PASS** — production source unchanged.
- Route and lease safeguards unchanged: **PASS** — production source unchanged; shared orchestration lease used for writes.
- Uncertainty behavior unchanged: **PASS** — production source unchanged.
- No reload-based production recovery added: **PASS**.
- No `main`, merge, auto-merge, tag, release, or publish action: **PASS**.

## Risks and Limits
- The newly committed lifecycle Playwright cases are **unexecuted**, so their syntax and runtime assertions are not claimed passing.
- The `freeze` case is fixture-dispatched; it does not emulate Chromium task suspension. Its purpose is narrower: prove that Ghost does not fork recovery or gain Send authority from a freeze notification and that `resume` still uses the existing gate.
- The `document.wasDiscarded=true` case is fixture-injected on a fresh document. It proves fresh-boot behavior only if the fixture executes; it is not evidence of browser-real discard detection on Android or Firefox.
- Existing source-contract TODOs should remain explicit until exact-head Playwright evidence closes them; they were not deleted or converted into synthetic passes.
- A2 cannot decide between minimal seam and Chromium-specific quiesce based on unexecuted assertions. Product implementation remains intentionally unchanged.

## Recommended Next Action

`R4-A3-LIFECYCLE-REDTEAM` should become ready under its `R4-A2-LIFECYCLE-BUILD:submitted-or-blocked` dependency.

A3 is authorized to use `.github/workflows/**` and should obtain connected-GitHub-visible exact-head execution for:

`npx playwright test tests/e2e/repair-resume-production.spec.js --project=chromium`

and the relevant focused Jest contract. It should bind evidence to exact head/run/job IDs, preserve traces on failure, and attempt the adversarial route/lease/uncertain-Send/stale-DOM sequences already in its assignment. If the lifecycle fixture fails, A3 must preserve the exact failure and create the smallest product-repair recovery assignment rather than weakening assertions.

Mobile Chromium remains an A4 responsibility unless A3 uses it only as additional nonblocking evidence.

## Assignment Status
- **blocked** — deterministic production-path lifecycle coverage is committed, and the only remaining A2 blocker is exact-head browser execution evidence.
