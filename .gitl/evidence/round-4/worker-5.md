# Ghost Worker Evidence

## Identity
- Round: 4
- Worker evidence slot: 5
- Intended role: mobile-browser-accessibility-performance
- Executing successor: `scheduled-successor-a4-recovery`
- Assignment ID: `R4-A4-LIFECYCLE-MOBILE-PERF`
- Started at: `2026-08-07T05:35:56Z`
- Finished at: `2026-08-07T05:40:33Z`
- Program: `LIFECYCLE-FROZEN-DISCARDED`

## State Read
- Branch: `agent/8.8-repair-resume`
- Recovery starting head: lease-claim commit `ad8239208557649189d8df0857be6fe272526e6a`
- Pre-claim exact branch-head SHA: **UNKNOWN through the available connector surface**; two live comparisons showed the branch remained exactly three commits ahead of prior handoff head `174e8f1a1ebc8864cd66167732cab3a87fe00639` with the same three A4 files changed.
- Prior lease holder: `manual-successor-a4`
- Prior lease expired: `2026-08-07T05:27:28Z`
- Recovery lease claimed: `2026-08-07T05:35:56Z` in `ad8239208557649189d8df0857be6fe272526e6a`
- Dependencies: A2 submitted; A3/A3X submitted with exact-head lifecycle evidence.
- Deferred-human queue: `.gitl/deferred-questions.md` absent; no human decision blocks A4.

## Stale-Lease Recovery Proof
Before reclaiming A4, the successor checked the maker and Ghost succession gates:

1. the lease had expired;
2. the branch was compared twice after the prior holder's inspected head and remained at the same three-commit delta;
3. the changed files remained exactly `.gitl/autopilot-state.json`, `playwright.config.js`, and `tests/e2e/lifecycle-mobile-perf.spec.js`;
4. `.gitl/evidence/round-4/worker-5.md` did not exist;
5. no A4 pull request existed;
6. no later durable handoff had been written.

This proved an incomplete A4 transaction rather than active continuing branch work. The successor reclaimed only after expiry and did not redo the implementation.

## Step Performed
Audited the already-committed A4 mobile/performance fixture and converted its unfinished execution gap into a bounded recovery handoff.

The prior holder had already added:

- `tests/e2e/lifecycle-mobile-perf.spec.js` — current blob `9a17327a6a8a621807edd5bd1eaa979b7459852d`;
- `playwright.config.js` Pixel 7 / `chromium-mobile` inclusion — current blob `e304ce354fdf84376be2a2e2a19e8c94642643fd`.

No product source was changed by A4 recovery.

## Evidence-Competitive Review

### Approach A — resource-accumulation / semantic-cardinality measurement
Measure active intervals, active MutationObservers, lock-record accumulation, panel duplication, runtime-service restart counts, host input/Send integrity, and latest-message accessibility over repeated wake windows.

Strength: robust against noisy CI wall-clock timing and directly tests the failure modes that would degrade long-running/mobile sessions.

Failure mode: it can miss a small but real CPU cost if resource counts remain bounded.

### Approach B — strict wall-clock performance budget
Set explicit elapsed-time/cache-clear latency thresholds and fail when a wake exceeds them.

Strength: detects user-visible slowdown directly.

Failure mode: CI timing is noisy and no calibrated Pixel/low-end baseline exists in the current evidence; choosing a threshold now would be arbitrary and could create false failures or false confidence.

### Resolution
A4's committed fixture correctly prefers Approach A for the first evidence pass while recording `elapsedMs`, cumulative `cacheClearMs`, and `cacheClearMaxMs` for later calibration. It does not claim a quantitative performance budget.

The independent dissent remains: the second bounded cache invalidation may still have measurable cost on constrained hardware even though A3X proved it is not a lifecycle safety/correctness defect. That question requires executed measurements, not inference.

## Mobile / Accessibility Fixture Review
The committed fixture:

- uses the real userscript source in the Playwright production-copy harness;
- runs under the configured Playwright `Pixel 7` device profile in project `chromium-mobile`;
- executes 12 separated wake windows;
- emits a `pageshow.persisted` + `resume` + `focus` burst per window;
- requires exactly one ticker start, heartbeat start, bus init, and route re-detect per window;
- preserves the A3X bounded `1..2` cache invalidation contract;
- instruments active intervals and active MutationObservers to detect accumulation;
- requires at most one lock record and exactly one Ghost panel;
- proves the host textarea and original Send control remain connected and unchanged;
- asserts zero submit/click/input/keydown actuation during lifecycle recovery;
- checks the latest rendered answer and composer remain visible/usable after repeated wakes.

This is strong deterministic emulation coverage. It is **not** real Android-device evidence and is not Firefox Android certification.

## Research Sources
- Repository evidence: `tests/e2e/lifecycle-mobile-perf.spec.js` and `playwright.config.js` establish the actual instrumentation and Pixel-7 emulation contract.
- Repository evidence: `.github/workflows/test.yml` runs on `push` to `agent/**` and invokes `npm run test:e2e`.
- Repository evidence: `package.json` defines `test:e2e` as `playwright test`, so the configured `chromium-mobile` project includes the new lifecycle-mobile-perf fixture.
- Prior exact-head evidence: Worker-4/A3X established lifecycle Jest PASS, adversarial Chromium 4/4 PASS, production lifecycle Chromium 7/7 PASS, with cache invalidation bounded `1..2` and exact runtime-service cardinality.
- Community/user evidence was not re-researched during this recovery because executable A4 work existed; current reproducible repository evidence outranks qualitative reports for the execution question.

## Changes
- Added this durable Worker-5 evidence file.
- No product files changed.
- No test assertion changed.
- No Playwright configuration changed by the recovery successor.
- No temporary workflow was created because A4's allowed-file surface does not include `.github/workflows/**`.

## Tests

### Required exact mobile execution
Command required by A4:

`npx playwright test tests/e2e/lifecycle-mobile-perf.spec.js --project=chromium-mobile`

Status: **NOT OBSERVED / NOT CERTIFIED**.

The repository's ordinary push CI is configured to execute the full Playwright suite for `agent/**` pushes, but the connected GitHub workflow-run action available to this worker exposes pull-request-triggered runs only. No A4 PR-visible carrier existed, and A4 is not authorized to create or modify `.github/workflows/**`.

Therefore this worker does **not** infer a pass from workflow configuration or from the presence of the fixture.

### Relevant previously executed lifecycle evidence
A3X exact-head run `31147614614`, job `92770260104`:

- focused lifecycle Jest: 2/2 suites; 12 passed; 3 TODO; 0 failures;
- adversarial Chromium: 4/4 passed;
- production lifecycle Chromium: 7/7 passed.

Those results validate the underlying lifecycle contract but do not substitute for A4's new Pixel-7 mobile/performance fixture.

## Acceptance Criteria
- Run or define mobile Chromium background/foreground and viewport recovery scenarios: **PASS as deterministic fixture definition; execution still missing**.
- Record timer/observer/scan/lock/restart counts or defensible bounded proxies: **PASS in instrumentation design; runtime measurements NOT TESTED**.
- Check repeated wake signals do not accumulate duplicate runtime services or accessible UI: **NOT TESTED on the new A4 fixture**.
- State real-device and Firefox lifecycle limitations explicitly: **PASS**.
- Confirm latest message/composer remains usable after mobile wake where harness permits: **NOT TESTED on the new A4 fixture**.

Overall A4 status: **BLOCKED only on exact observable mobile execution evidence**.

## Safety Checks
- Send authority unchanged: **PASS — no product change; fixture asserts zero Send-adjacent actuation**.
- CHOICE behavior unchanged: **PASS — no product change**.
- Route and lease safety unchanged: **PASS — no product change**.
- Uncertainty handling unchanged: **PASS — no product change**.
- `main` modified: **NO**.
- Merge / auto-merge / tag / publish / release: **NONE**.

## Risks and Limits
1. The current fixture records `elapsedMs` and cache-clear timing but has no calibrated hard performance threshold. A future performance program may use these metrics after collecting repeatable baselines.
2. Playwright Pixel 7 is Chromium mobile emulation, not physical Android evidence.
3. Firefox Android/GeckoView lifecycle behavior remains outside this A4 fixture.
4. The ordinary push workflow may already have executed the fixture, but its result is not observable through the available connected-run query and therefore is not claimed.
5. The fixture's accumulation assertions are defensible proxies, not proof of battery, memory-pressure, or OS discard behavior on a low-end physical device.

## Recommended Next Action
Create and execute the smallest recovery assignment `R4-A4X-LIFECYCLE-MOBILE-PERF-EXEC` with authority for a temporary guarded `.github/workflows/**` carrier. It should:

1. guard and print expected vs actual exact head;
2. run `npx playwright test tests/e2e/lifecycle-mobile-perf.spec.js --project=chromium-mobile`;
3. preserve the JSON attachment/trace/result evidence;
4. record run/job/artifact IDs and exact metrics;
5. remove the temporary carrier and close any isolated draft PR unmerged;
6. on PASS submit A4/A4X and activate `R4-A5-LIFECYCLE-AUDIT`;
7. on FAIL preserve the exact failure and create only the smallest evidence-driven repair.

## Assignment Status
- `R4-A4-LIFECYCLE-MOBILE-PERF`: **blocked — exact observable Pixel-7 execution evidence missing**.

---

# A4X Exact-Execution Recovery Addendum

## Identity
- Round: 4
- Worker evidence slot: 5
- Intended assignment role: `mobile-browser-accessibility-performance-execution-recovery`
- Executing successor nominal worker: 6 (`devils-advocate-release-auditor` lens applied in addition)
- Assignment ID: `R4-A4X-LIFECYCLE-MOBILE-PERF-EXEC`
- Started at: `2026-08-07T05:51:41Z`
- Observable CI execution: `2026-08-07T06:02:20Z` through `2026-08-07T06:03:03Z`
- Program: `LIFECYCLE-FROZEN-DISCARDED`

## State Read
- Branch: `agent/8.8-repair-resume`
- Inspected exact pre-claim branch head: `6ece1c011f3df5305cc9564e6e576108b7ea3277`
- Lease claim commit: `216e752a555743991edc75308042381ac29c79f0`
- Deferred-human queue: absent; no human decision blocked execution.
- No active PR-visible run or open carrier PR existed before the claim.

## Step Performed
A4X used the same evidence-preserving pattern previously proven by A3X:

1. claimed the shared lease;
2. created isolated CI base branch `gitl/r4-a4x-ci-base` from the lease-claim head, never from or into `main`;
3. added temporary carrier `.github/workflows/r4-a4x-lifecycle-mobile-perf.yml` in commit `cfa67d16000aadbd5ddaaf2ce1e1acc4c477ad75`;
4. opened draft PR #18 from `agent/8.8-repair-resume` to isolated base `gitl/r4-a4x-ci-base`;
5. ran the exact required Playwright command on the exact PR head;
6. preserved logs, traces, JSON reporter output, and artifact evidence;
7. removed the temporary workflow in cleanup commit `f1745d18f32018f23fc747b219e4727e7d9c56d2`;
8. closed PR #18 unmerged.

No product source changed.

## Exact-Head Execution Evidence
- Tested head: `cfa67d16000aadbd5ddaaf2ce1e1acc4c477ad75`
- Workflow run: `31152568300`
- Job: `92785122646`
- Command: `npx playwright test tests/e2e/lifecycle-mobile-perf.spec.js --project=chromium-mobile`
- Exact-head guard: **PASS** — expected and actual both `cfa67d16000aadbd5ddaaf2ce1e1acc4c477ad75`.
- Device profile evidence from attachment: Android 14 / Pixel 7 user agent, `devicePixelRatio=2.625`, `maxTouchPoints=1`.
- Result: **FAIL**, reproducibly on original attempt and retry.
- Exact failure: `expect(result.profile.width).toBeLessThanOrEqual(500)` received `981` at `tests/e2e/lifecycle-mobile-perf.spec.js:231`.

### Preserved artifact
- Artifact name: `r4-a4x-lifecycle-mobile-perf-evidence`
- Artifact ID: `8983863803`
- Artifact SHA-256: `54ce80517b04843f213cf8766de5aff63c2f6b3fc2cabbaa3f97613cbd7efcb6`
- Artifact size: 724424 bytes
- Contents include `e2e-results.json`, error contexts, and traces for both attempts.

The metric attachment was embedded inline in Playwright's JSON reporter rather than emitted as a standalone JSON file. It is nevertheless preserved in the artifact and was decoded from that reporter output.

## Raw Measurement Conclusions
Both the original attempt and retry produced the same semantic lifecycle/resource result before the final viewport assertion failed.

### Emulation/profile
- CSS layout viewport reported by the fixture: `981 x 1996`
- DPR: `2.625`
- touch points: `1`
- user agent: Android 14 / Pixel 7 / Chrome 148 mobile

### Repeated-wake semantic cardinality
Across all 12 separated wake windows in both attempts:
- ticker starts per window: exactly `1`
- heartbeat starts per window: exactly `1`
- GhostBus init per window: exactly `1`
- route re-detect per window: exactly `1`
- cache invalidations per window: exactly `2`, inside the accepted bounded `1..2` contract

### Resource accumulation proxies
Both attempts:
- active intervals: `4 -> 5`, satisfying the fixture's `before + 1` bound
- active MutationObservers: `3 -> 3`
- interval creates/clears: `5/1 -> 29/24`, leaving a net bounded active count
- lock records: `1`
- Ghost panel count: `1`

### Safety and host usability
Both attempts:
- submit events: `0`
- click events: `0`
- input events: `0`
- keydown events: `0`
- loop state: `RUNNING`
- original input remains connected with value `unchanged`
- original Send remains connected with label `Send message`
- latest rendered answer remains `Latest answer 179`

### Timing observations — descriptive, not a calibrated performance budget
Attempt 1, 12 wake samples:
- elapsed min/median/max: about `7.7 / 8.2 / 11.4 ms`
- mean: about `8.525 ms`
- cumulative measured cache-clear time: about `0.1 ms`

Retry, 12 wake samples:
- elapsed min/median/max: about `7.8 / 8.55 / 15.6 ms`
- mean: about `9.192 ms`
- cumulative measured cache-clear time: about `0.1 ms`

These are GitHub-hosted emulation measurements, not physical Android performance claims.

## Failure Analysis — Evidence-Competitive

### Interpretation A — Pixel 7 project configuration failed
This is contradicted by the attachment: the browser reports an Android 14 Pixel 7 mobile user agent, DPR `2.625`, and touch support. The Playwright project is therefore materially applying Pixel-class emulation.

### Interpretation B — the synthetic test page lacks mobile viewport metadata
Repository inspection shows the fixture constructs `<!doctype html><html><body>...` without a viewport `<meta>` element, while the assertion treats `window.innerWidth <= 500` as a required Pixel-class CSS layout viewport fact. The observed combination — Pixel 7 UA/touch/DPR with layout width `981` — is consistent with a synthetic page whose mobile viewport metadata does not request device-width layout.

### Resolution
The failure is preserved as a **fixture/environment-contract defect**, not reclassified as a product lifecycle defect and not masked by relaxing the width assertion. The smallest evidence-driven repair is to make the synthetic page represent a normal mobile document by adding explicit device-width viewport metadata, then rerun the same assertion and every existing resource/Send/accessibility check unchanged.

This conclusion is limited to the deterministic harness. It does not claim physical Android-device behavior.

## Acceptance Criteria — A4X
- Guard and print expected versus actual exact head: **PASS**.
- Run exact required Pixel-7 command: **PASS — command executed; test failed**.
- Preserve raw measurements plus traces/logs: **PASS**.
- Record run/job/artifact IDs and exact metric conclusions: **PASS**.
- Remove temporary carrier and close isolated draft PR unmerged: **PASS** — cleanup commit `f1745d18f32018f23fc747b219e4727e7d9c56d2`, PR #18 closed unmerged.
- On PASS submit A4/A4X and activate A5: **NOT APPLICABLE — run failed**.
- On FAIL preserve exact failure and create only smallest evidence-driven repair: **PASS — route to `R4-A4Y-LIFECYCLE-MOBILE-VIEWPORT-FIXTURE`**.

## Safety Checks — A4X
- Product implementation changed: **NO**.
- Send authority changed: **NO**.
- CHOICE behavior changed: **NO**.
- Route/lease/uncertainty safeguards changed: **NO**.
- Assertions weakened to manufacture green CI: **NO**.
- `main` modified: **NO**.
- PR merged: **NO**.
- Auto-merge/tag/publish/release: **NONE**.

## Recommended Next Action — A4Y
Create and execute `R4-A4Y-LIFECYCLE-MOBILE-VIEWPORT-FIXTURE` as the smallest recovery:

1. confirm the synthetic `PAGE` lacks device-width viewport metadata;
2. add `<meta name="viewport" content="width=device-width, initial-scale=1">` to the synthetic mobile page rather than loosening `width <= 500`;
3. rerun the exact guarded Pixel-7 `chromium-mobile` fixture;
4. preserve all semantic service, bounded cache, resource accumulation, zero-Send-actuation, host-node identity/usability, and accessibility assertions unchanged;
5. preserve raw metrics/run/job/artifact evidence;
6. remove temporary carrier and close the isolated draft PR unmerged;
7. on PASS submit A4/A4X/A4Y and activate `R4-A5-LIFECYCLE-AUDIT`; on FAIL preserve the next exact failure and create only the next smallest repair.

## Assignment Status — A4X
- `R4-A4-LIFECYCLE-MOBILE-PERF`: **blocked — execution now exists, but the synthetic mobile viewport contract failed before certification**.
- `R4-A4X-LIFECYCLE-MOBILE-PERF-EXEC`: **blocked — exact-head reproducible viewport assertion failure preserved**.
- Next recovery: `R4-A4Y-LIFECYCLE-MOBILE-VIEWPORT-FIXTURE`.
