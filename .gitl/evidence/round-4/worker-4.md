# Round 4 Worker 4 Evidence — R4-A3-LIFECYCLE-REDTEAM

## Identity

- Round: 4
- Evidence slot: Worker 4 / test-engineer-red-team
- Executing wake: scheduled-agent-5 (wake cadence only; nominal worker mismatch is not ownership)
- Assignment: `R4-A3-LIFECYCLE-REDTEAM`
- Program: `LIFECYCLE-FROZEN-DISCARDED`
- Lease acquired: `2026-08-07T03:40:09Z`
- Isolated branch: `agent/8.8-repair-resume`
- Verdict: **BLOCKED — deterministic lifecycle contract mismatch requires bounded recovery**

## Starting state and lease

Canonical state had A2 blocked only on exact-head browser execution and A3 ready. The branch was stable after the A2 handoff and no valid lease existed. A3 was claimed in conflict-safe state commit `058ebc3f55d48d21ada871c467d99c6c1a2a6ca3` before any test or workflow write.

No product source was modified during A3.

## Red Team implementation

A3 added `tests/e2e/lifecycle-redteam.spec.js` to exercise the real userscript wake path with test-only instrumentation. The fixture attacks four safety boundaries:

1. route change around wake must pause stale work and never actuate Send;
2. foreign-lease denial must pause and must not restart stale work;
3. an in-flight `dispatching` Send discovered on wake must become `uncertain`, clear send flags, pause, and never actuate Send;
4. composer replacement before and after wake must leave detached stale nodes non-actuating.

Initial fixture commit: `8f2cd831e6e3cba7f92f9744ad054a06f80778a0`.

The first exact-head attempt exposed a Red Team fixture bug rather than a product failure: three cases referenced lexical variables created inside `eval()`, yielding `ReferenceError: events is not defined`. That harness defect was corrected without weakening any assertion in commit `7e8dfda0e22143bdea17f34cd9a37490d0ad8236` by explicitly exporting the counters through `window.__GITL_Actuation`.

## Exact-head carrier

A temporary CI carrier was created only on the isolated branch and exposed through draft PR #16 against isolated base `gitl/r4-a3-ci-base2`. It never targeted `main`, was never merged, and was closed unmerged after evidence collection.

Carrier commits included:

- `031dd08dbc0eb91f9540dcbb890b5cfb5cb73a28` — initial temporary workflow;
- `afb0de46f34151eafec381421a72a15a08d2de18` — make carrier observable through the isolated PR surface;
- `2c25878ab282411abc7b22ed95af407c09c4cb1c` — run adversarial cases before the known-failing production lifecycle fixture;
- `44fb065bfc6aa4a599d44b48eab606e8c525847e` — remove the temporary carrier after execution.

PR #16 was closed unmerged at `2026-08-07T03:50:23Z`.

## First production-fixture execution

Run `31145260932`, job `92763253458`, exact tested head `0e186924bab3221c450494bd17d670dcb198a24f`.

The guard printed the same expected and actual SHA. Focused Jest passed: 2/2 suites, 12 passed, 3 explicit TODOs, 0 failures. The production Chromium fixture ran 7 tests: 5 passed and 2 failed, with both failures repeating identically on retry.

Both failures were the same assertion:

- BFCache `pageshow.persisted` + duplicate lifecycle burst: expected cache-clear delta `1`, observed `2`.
- Chromium `freeze` then `resume`: expected cache-clear delta `1`, observed `2`.

All other production-fixture safety cases passed, including the fixture-injected discarded fresh document booting IDLE with no Send authority.

Artifact: `8981245882`  
Artifact SHA-256: `91821140c37984675410f9c5e621e49d4dcfa8673b37fc6a130f60207660ebf0`

## Adversarial exact-head execution

Final useful exact-head run: `31145488389`, job `92763921605`, tested head `7e8dfda0e22143bdea17f34cd9a37490d0ad8236`.

The exact-head guard printed:

- expected: `7e8dfda0e22143bdea17f34cd9a37490d0ad8236`
- actual: `7e8dfda0e22143bdea17f34cd9a37490d0ad8236`

Results:

### Focused lifecycle Jest

Command:

`npx jest tests/wake-recovery.test.js tests/lifecycle-recovery-contract.test.js --runInBand`

- suites: 2 passed / 2
- tests: 12 passed, 3 explicit TODOs, 15 total
- failures: 0
- runtime: 0.661 s

### New adversarial lifecycle Playwright — Chromium

Command:

`npx playwright test tests/e2e/lifecycle-redteam.spec.js --project=chromium`

- 4 passed / 4
- route-change fail-closed: PASS
- foreign-lease fail-closed: PASS
- uncertain prior Send => zero Send actuation: PASS
- stale DOM replacement before/after wake: PASS
- runtime: 2.8 s

### A2 production lifecycle Playwright — Chromium

Command:

`npx playwright test tests/e2e/repair-resume-production.spec.js --project=chromium`

- 5 passed / 7
- 2 failed, both deterministic on retry
- BFCache lifecycle failure: cache-clear delta expected `1`, observed `2`
- freeze/resume failure: cache-clear delta expected `1`, observed `2`
- ticker restart delta remained `1` before the failing assertion
- heartbeat restart delta remained `1` before the failing assertion
- discarded fresh-document case passed

Artifact: `8981325698`  
Artifact SHA-256: `acbaae68856146ac2693ff1e27290c1ab6252b331ecb46d426ca74353d4e131e`

## Root-cause evidence and competing interpretations

The production wake path calls `_clearElementCaches()` directly and then calls `reDetect()`. `reDetect()` itself clears element caches again. The deterministic observed delta of `2` is therefore consistent with the current call graph.

Two interpretations remain materially viable and must not be collapsed just to obtain green CI:

- **Strict exactly-once interpretation:** every recovery service/cache rebuild action should occur exactly once; the second cache invalidation is redundant work and may matter on long chats or constrained devices.
- **Idempotent invalidation interpretation:** cache invalidation is a cheap idempotent defensive action, while the semantically important runtime services (ticker, heartbeat, bus, route re-detection) remain bounded to one recovery; the A2 fixture may be over-constraining an implementation detail.

A3 does not have authority to rewrite production code and is explicitly prohibited from weakening assertions. Therefore it preserves the exact failure and opens the smallest evidence-driven recovery instead of choosing either interpretation post hoc.

## Acceptance criteria verdict

- Repeated wake signals prove bounded/idempotent service restarts: **PARTIAL / BLOCKED** — ticker and heartbeat are single-restart, but the cache-clear count is deterministically 2 where the fixture contract expects 1.
- Stale DOM before and after wake without stale-node actuation: **PASS**.
- Route change around wake prevents stale work resume: **PASS**.
- Lease denial around wake prevents stale work resume: **PASS**.
- Uncertain prior Send produces zero Send actuation: **PASS**.
- Persisted/BFCache case executes in the harness: **PASS as execution coverage; FAIL on cache-clear count**.
- Discarded fresh-document case executes and remains fail-closed: **PASS**.
- Exact-head CI evidence: **PASS**.
- Failure converted to bounded recovery rather than masked: **PASS**.

Overall A3 status: **blocked**, specifically on adjudicating whether duplicate cache invalidation is a product inefficiency/fault or an over-specified test contract.

## Safety and limits

- Product userscript changed: **NO**.
- Generated extension product source changed: **NO**.
- Send authority changed: **NO**.
- CHOICE behavior weakened: **NO**.
- Route safeguard weakened: **NO**.
- Lease safeguard weakened: **NO**.
- Uncertainty safeguard weakened: **NO**.
- `main` modified: **NO**.
- Merge/auto-merge/tag/release/publish: **NONE**.
- Temporary PR #16: **closed unmerged**.
- Temporary workflow: **removed**.

`npm ci` continued to report two pre-existing high-severity dependency findings; dependencies were outside this assignment and were not changed. GitHub Actions also emitted Node-action deprecation warnings; these are maintenance signals, not the lifecycle verdict.

## Required recovery handoff

Activate `R4-A3X-LIFECYCLE-CACHE-IDEMPOTENCE` as the earliest ready recovery. It must reproduce and instrument the two cache invalidations, distinguish cache invalidation from actual runtime-service restart, and decide with evidence whether the contract should permit bounded idempotent invalidation or whether production should eliminate a redundant clear. It must not weaken the assertion merely to make CI green.

A4 mobile/performance work should remain downstream until A3X either submits a justified contract correction or blocks with a demonstrated product defect and a builder repair handoff.
