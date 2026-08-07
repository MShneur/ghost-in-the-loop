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
