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

---

# R4-A3X Lifecycle Cache Idempotence Recovery

## Identity

- Round: 4
- Evidence slot: Worker 4 continuation / test-contract-auditor-recovery
- Executing wake: `manual-successor` under wake-cadence succession
- Assignment: `R4-A3X-LIFECYCLE-CACHE-IDEMPOTENCE`
- Program: `LIFECYCLE-FROZEN-DISCARDED`
- Started: `2026-08-07T04:25:28Z`
- Finished: `2026-08-07T04:31:57Z`
- Lease claim/state commit: `425f43548de82d95cb1d519916042e7638778282`
- Isolated branch: `agent/8.8-repair-resume`
- Verdict: **SUBMITTED — A3 failure was an over-specified helper-call assertion, not a demonstrated lifecycle product defect**

## Stale-handoff recovery

The predecessor A3 lease expired at `2026-08-07T04:25:09Z`. Before reclaiming it, the successor verified all activity surfaces required by the canonical maker and Ghost succession rule:

- draft PR #16 was closed unmerged at `2026-08-07T03:50:23Z`;
- Red Team run `31145488389` / job `92763921605` was completed;
- temporary A3 carrier had already been removed in `44fb065bfc6aa4a599d44b48eab606e8c525847e`;
- a fresh compare from that cleanup commit to the live branch showed exactly one later commit, affecting only this Worker-4 evidence file;
- no later branch-changing work or active relevant workflow existed.

The expired lease was therefore reclaimed rather than waiting indefinitely. The round plan was repaired in `b1c290aaec57268f5dd440f7252d47a0c7e0a6ff` to mark A3 blocked on the preserved mismatch and activate this bounded A3X recovery.

## Accepted-contract adjudication

A3X cross-checked the failure against the accepted Round-4 lifecycle contract rather than changing the test from the failing observation alone.

The contract's exact-once requirement is stated in terms of **semantic runtime-service rebuilds**: one ticker/heartbeat/bus/observer/lock rebuild sequence per recovery window, with zero Send actuation. The A1 evidence likewise names timer/observer/heartbeat/lock recovery, not `_clearElementCaches()` helper invocation cardinality.

The source call graph is deterministic:

1. `recoverAfterWake()` calls `_clearElementCaches()` directly;
2. no DOM-cache consumer runs between that call and `reDetect()`;
3. `recoverAfterWake()` then invokes `reDetect()`;
4. `reDetect()` begins by calling `_redetectStop()` and `_clearElementCaches()` again.

Therefore the observed `cacheClear` delta of `2` is a bounded implementation detail inside one semantic recovery sequence. The Red Team evidence already showed ticker and heartbeat deltas of `1`; exact-head A3X execution additionally preserved exact `busInit` and `redetect` deltas of `1` and all Send-safety assertions.

## Competing interpretations

### Strict exactly-once invalidation

Treat each call to `_clearElementCaches()` as a service restart and require exactly one call.

Failure mode: this converts a private idempotent helper into a public lifecycle contract and can force a product rewrite without evidence that the second clear changes user-visible state, safety, or runtime-service multiplicity.

### Bounded idempotent invalidation

Treat cache invalidation as a defensive idempotent helper inside a single semantic recovery sequence, while requiring exact-once cardinality for ticker, heartbeat, bus re-init, route re-detection, and zero Send actuation.

Failure mode: if the bound is removed entirely, future recursive/repeated invalidation churn could grow unnoticed.

### Resolution

The accepted contract supports the second interpretation. A3X therefore corrected only the over-specified test detail and kept an explicit bound of **1..2** cache invalidations per tested recovery. This still fails future unbounded churn while preserving exact `1` assertions for ticker, heartbeat, bus init, and reDetect plus unchanged zero-Send assertions.

No production code changed.

## Test-contract change

File: `tests/e2e/repair-resume-production.spec.js`

Commit: `531263f41ee6c416eecafcf5f8ac0f8d74a0dd27`

Change:

- introduced `expectBoundedCacheInvalidation(delta)` with lower bound `1` and upper bound `2`;
- replaced only the two exact `cacheClear === 1` assertions in the BFCache and freeze/resume cases;
- left exact ticker, heartbeat, bus-init, redetect, loop-state, stale-node, route, lease, uncertain-Send, and actuation assertions unchanged.

This is a contract correction, not a green-by-deletion change: cache invalidation remains asserted and bounded.

## Exact-head carrier and execution

Temporary isolated base: `gitl/r4-a3x-ci-base` at test commit `531263f41ee6c416eecafcf5f8ac0f8d74a0dd27`.

Temporary carrier commit: `4196712b579cb5ed388850b1717bc0a53d00f7f6`.

Draft PR #17 targeted only `gitl/r4-a3x-ci-base`, never `main`. It was closed unmerged after evidence collection.

Authoritative run:

- Workflow: `R4 A3X Lifecycle Cache Idempotence`
- Run: `31147614614`
- Job: `92770260104`
- Exact tested head: `4196712b579cb5ed388850b1717bc0a53d00f7f6`
- Guard: expected head = actual head = `4196712b579cb5ed388850b1717bc0a53d00f7f6`

### Focused lifecycle Jest

`npx jest tests/wake-recovery.test.js tests/lifecycle-recovery-contract.test.js --runInBand`

- suites: **2 / 2 passed**
- tests: **12 passed, 3 explicit TODOs, 15 total**
- failures: **0**
- runtime: **0.847 s**

### Adversarial lifecycle Playwright — Chromium

`npx playwright test tests/e2e/lifecycle-redteam.spec.js --project=chromium`

- **4 / 4 passed**
- route-change fail closed: PASS
- foreign-lease fail closed: PASS
- dispatching/uncertain Send remains non-actuating: PASS
- stale DOM replacement remains non-actuating: PASS
- runtime: **2.2 s**

### Production lifecycle Playwright — Chromium

`npx playwright test tests/e2e/repair-resume-production.spec.js --project=chromium`

- **7 / 7 passed**
- BFCache persisted + duplicate lifecycle burst: PASS
- Chromium freeze non-actuating + resume through single recovery gate: PASS
- discarded fresh-document boot remains IDLE with zero Send authority: PASS
- route/lease/uncertainty blockers: PASS
- stale DOM replacement: PASS
- runtime: **3.1 s**

Because every Playwright case passed, Playwright produced no report/test-results files for the `upload-artifact` paths. The upload step completed successfully with `if-no-files-found: ignore` and explicitly reported that no artifact was created. The authoritative evidence is therefore the exact guarded run/job log rather than a nonexistent artifact.

`npm ci` continued to report two pre-existing high-severity audit findings. A3X changed no dependencies. GitHub Actions also repeated the Node-20 action deprecation warning; this is a maintenance signal outside the lifecycle verdict.

## Carrier cleanup

Temporary workflow `.github/workflows/r4-a3x-lifecycle-cache-idempotence.yml` was removed in commit:

`d215e136a20082fc2ec320396a8ef9773bad52d9`

Draft PR #17 was closed unmerged at `2026-08-07T04:31:49Z`. Its isolated base was `gitl/r4-a3x-ci-base`; `main` was never targeted or modified.

## Acceptance criteria verdict

- Accepted-contract scope identified: **PASS** — exact-once applies to semantic runtime-service sequence, not private cache-helper invocation count.
- Source reason for two cache clears established: **PASS** — direct clear plus `reDetect()` clear, with no intervening DOM-cache consumer.
- Cache invalidation remains explicitly bounded: **PASS — 1..2**.
- Exact ticker/heartbeat/bus/redetect assertions preserved: **PASS**.
- Send/CHOICE/route/lease/uncertainty safeguards weakened: **NO**.
- Focused lifecycle Jest exact-head execution: **PASS**.
- Adversarial Chromium lifecycle exact-head execution: **PASS 4/4**.
- Production Chromium lifecycle exact-head execution: **PASS 7/7**.
- Product implementation changed: **NO**.
- Temporary carrier removed: **PASS**.
- Temporary PR merged: **NO**.
- `main` modified: **NO**.

## User/community and performance lens

No new community research was substituted for executable work because A3X was dependency-ready. A1's earlier user/community evidence already establishes that background reload/discard behavior is user-facing; it does not determine the correct internal cache-helper call count.

A3X does **not** claim that two cache invalidations are performance-optimal. It establishes only that the second invalidation is not a demonstrated lifecycle correctness or safety defect under the accepted contract. A4 remains the correct downstream assignment to measure mobile/constrained-device restart and scan cost and may reopen the duplicate clear as a performance issue if measurement shows material cost.

## Repo Nanny limitation

The orchestration requested the Repo Nanny skill, but the connected skill resource returned a reauthentication requirement during this invocation. No Repo Nanny result is claimed. Repository/state/source/workflow verification was performed directly through connected GitHub, and this limitation does not affect the exact-head test evidence above.

## Final A3/A3X disposition

- `R4-A3-LIFECYCLE-REDTEAM`: **SUBMITTED after recovery** — its adversarial findings were valid; the only failing criterion was resolved as an over-specified test contract rather than a product defect.
- `R4-A3X-LIFECYCLE-CACHE-IDEMPOTENCE`: **SUBMITTED**.
- `R4-A2-LIFECYCLE-BUILD`: its only blocker was exact-head browser execution of the deterministic fixture. A3X now supplies that exact-head execution with all 7 production lifecycle cases passing, so A2 is eligible to transition from blocked to **SUBMITTED** without a product change.

## Handoff

Activate `R4-A4-LIFECYCLE-MOBILE-PERF` as the earliest dependency-ready assignment. It should measure mobile Chromium/background-return behavior and bounded restart/scan/observer/lock cost, preserve the distinction between emulator evidence and real-device evidence, and explicitly test whether the duplicate cache invalidation has any measurable constrained-device consequence rather than assuming either harmlessness or defect.
