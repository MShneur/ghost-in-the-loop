# Ghost Worker Evidence

## Identity
- Round: 5
- Worker evidence slot: 5
- Intended role: mobile-browser-accessibility-performance
- Executing successor nominal wake: Worker 2 / researcher-architect cadence, acting under the A4 mobile/browser/performance assignment
- Assignment ID: `R5-A4-LONGCHAT-MOBILE-PERF`
- Started at: `2026-08-07T11:16:45Z`
- Exact CI completed at: `2026-08-07T11:22:26Z`
- Temporary draft carrier closed at: `2026-08-07T11:24:07Z`
- Program: `LONG-CHAT-PERF`

## State Read
- Branch: `agent/8.8-repair-resume`
- Prior durable handoff head recorded by state: `8fd6517abcd39c022d8d6ce3503c71fcd4035b09`
- Lease claim commit: `a2f3f0a3837e6170ae1a7a9d2d2160cc83d882c0`
- Lease holder: `scheduled-successor-r5-a4-mobile-perf`
- Assignment dependency: `R5-A3-LONGCHAT-REDTEAM:submitted-or-blocked`; A3 was submitted with exact-head PASS evidence.
- Before claim, canonical state recorded `lease: null`; no open PR from `agent/8.8-repair-resume` and no PR-visible workflow run on the prior handoff head indicated conflicting work.
- Deferred human question `DQ-R4-LIFECYCLE-REVIEW` remains local to the completed Round-4 lifecycle program and does not block independent reversible Round-5 work.
- Canonical maker authority read first: `MShneur/Personal-Forge:08-agent-bridge/CHATGPT_AUTOMATION_MAKER.md`.

## Step Performed
Added one test-only long-chat mobile/cross-browser fixture at `tests/e2e/long-chat/lifecycle-mobile-perf.spec.js` and executed it on an exact guarded isolated-branch head under both configured `chromium-mobile` and `firefox` Playwright projects.

The fixture uses the real userscript runtime and deterministic ChatGPT adapter selectors at 180, 500, 1000, and 2000 assistant turns. It preserves the A1/A2/A3 adversarial answer-history shape: an older terminal marker, nested duplicate, newest visible unfinished answer, and a later hidden terminal decoy. It instruments full-document selector work, active intervals, MutationObserver registrations, panel count, host composer/Send visibility and identity, and submit/click/input/keydown actuation.

The measurement is deliberately read-only. It invokes `Adapter.getLastText()`, the existing `_beginSendAttempt()` observation path, and the existing `_sendEvidence()` observation path without granting any new Send authority or changing product behavior.

## Research Sources
### Primary / platform evidence
- Playwright's official emulation documentation states that device descriptors simulate properties including user agent, screen size, viewport, and touch capability. Implication: the configured `Pixel 7` project is useful deterministic mobile-browser emulation evidence, but it is not itself proof of physical-device behavior.
- Playwright's official Android automation documentation separately requires an Android device or AVD plus ADB. Implication: this A4 run must not be promoted into physical-Android certification.
- Repository `playwright.config.js` explicitly describes its Firefox project as desktop Gecko rather than GeckoView/Firefox-Android and warns against treating that pass as Android certification.

### Repository evidence
- A1 exact baseline: head `747031cc8160ba6febdd6fecb03d597fae36cd66`, run `31165679128`, job `92825797473`, artifact `8988876017`; answer-selection work at 2000 turns was 6003 qSA matches/sample.
- A2X accepted candidate: head `9d49e34af07015f8064ac66398004180216efb08`, run `31169354385`, job `92837396863`, artifact `8990318746`; 2000-turn answer-selection work fell to 2001 matches/sample with preserved correctness and zero actuation.
- A3 Red Team: head `73ec20832e6ae125fd38dd137f315ee695e186b6`, run `31171939489`, job `92845452541`, artifact `8991319478`; mixed selector tails, mutation churn, route/lease/uncertain-Send conditions preserved correctness and fail-closed behavior. It also confirmed the remaining 8004-match/sample Send-observation path.
- Round-4 Pixel-7 reference: A4Y run `31153444356`, job `92787723447`, artifact `8984194701`; the corrected 180-message lifecycle fixture observed CSS width 412, DPR 2.625, touch=1, bounded runtime-resource counts, and zero Send-adjacent events. That reference measures repeated wake recovery rather than long-chat answer-selection, so wall-clock numbers are not treated as directly comparable.

## Competing Expert Lenses
### Lens A — stateless grouped-selector path is practical enough to retain
Prediction: the A2 grouped query should preserve one qSA call/sample, newest-answer correctness, and stable runtime-resource counts under Pixel-class emulation and desktop Gecko while keeping its 2000-turn read latency in a low single-digit-millisecond range on hosted CI.

Observed: supported at the tested envelope. Pixel-7 Chromium emulation returned 2001 answer matches/sample at 2000 turns with p95 1.70 ms; desktop Firefox returned the same 2001 matches/sample with p95 2 ms. Active intervals and MutationObservers did not increase during the repeated read measurements.

Failure mode still present: the grouped union remains linear in retained matching history (`181 -> 2001` matches/sample), so this is not an asymptotically bounded solution.

### Lens B — persistent observer/index may still be required on truly constrained devices
Prediction: if the stateless path shows resource accumulation or materially worse history scaling under the mobile/cross-browser matrix, the additional lifecycle/invalidation complexity of a persistent index could become justified.

Observed: the current fixture did not show resource accumulation or correctness failure, so A4 does not justify adding persistent cache/observer state. The option remains a future alternative if physical-device or larger-history evidence falsifies the stateless approach.

### Devil's Advocate / safety dissent
The safety-critical Send-observation path is still more expensive than answer selection and remains linear at exactly 8004 returned matches/sample at 2000 turns in both tested browser projects. A4 treats that as an explicit performance limit, not as authority to weaken the at-most-once journal, delivery evidence, uncertain-Send block, or other fail-closed controls.

## Changes
- Test-only fixture commit on the authoritative isolated branch: `290c5e8b1a3d16948db61875c9199cca0792ede3`.
- Product source changed: **NO**.
- Generated extension changed: **NO**.
- Playwright config changed: **NO**; the nested fixture name intentionally matches the existing `chromium-mobile` testMatch.
- Temporary isolated CI base: `gitl/r5-a4-mobile-perf-base`, created from lease-claim commit `a2f3f0a3837e6170ae1a7a9d2d2160cc83d882c0`.
- Temporary carrier workflow commit on that base: `f1b8aea1a2a8f638de004c287956d24c07010b29`.
- Temporary draft PR: #26, base `gitl/r5-a4-mobile-perf-base`, head `agent/8.8-repair-resume`; closed unmerged.
- Carrier workflow removal commit on the isolated base: `42a3ea922d9587b2d11b1498b300af7ec68e19d9`.
- The connector does not expose a safe delete-ref operation; the temporary base ref may remain inert, with the carrier workflow removed. It never targeted `main`.

## Tests
### Exact execution binding
- Tested head: `290c5e8b1a3d16948db61875c9199cca0792ede3`
- Workflow run: `31173733483`
- Job: `92851027653`
- Artifact: `8992007971` (`r5-a4-long-chat-mobile-perf`)
- Artifact SHA-256: `fd3baa72e9e4bcc18938e2a497536d7b5d28f1d92bb13be908d3151c7b810d83`
- Artifact size: 10280 bytes
- Exact-head guard: **PASS** — expected, actual checkout head, and remote `agent/8.8-repair-resume` were all `290c5e8b1a3d16948db61875c9199cca0792ede3`.

### Focused Send-safety regression
Command:
`npx jest tests/issuefixes.test.js tests/sendtransaction.test.js --runInBand`

Result: **PASS — 2/2 suites, 18/18 tests**.

### Mobile and cross-browser long-chat matrix
Command:
`npx playwright test tests/e2e/long-chat/lifecycle-mobile-perf.spec.js --project=chromium-mobile --project=firefox`

Result: **PASS — 2/2 tests in 5.5 s**.

### Pixel-7 Chromium emulation raw results
Profile at every size: CSS viewport `412 x 839`, DPR `2.625`, `maxTouchPoints=1`, Android 14 / Pixel 7 / Chrome 148 mobile UA.

| Turns | DOM nodes | answer p50 | answer p95 | qSA calls/sample | qSA matches/sample | qSA time/sample |
|---:|---:|---:|---:|---:|---:|---:|
| 180 | 796 | 0.20 ms | 0.40 ms | 1 | 181 | 0.044 ms |
| 500 | 2076 | 0.30 ms | 0.70 ms | 1 | 501 | 0.132 ms |
| 1000 | 4076 | 0.80 ms | 1.00 ms | 1 | 1001 | 0.336 ms |
| 2000 | 8076 | 1.40 ms | 1.70 ms | 1 | 2001 | 0.676 ms |

Resource snapshot before/after the repeated answer reads at every size was unchanged: active intervals `4 -> 4`, active MutationObservers `3 -> 3`, interval creates `5 -> 5`, observer observes `3 -> 3`. Ghost panel count remained `1`. Composer and original host Send control remained visible and connected. The newest visible unfinished response remained authoritative. submit/click/input/keydown events remained exactly `0/0/0/0`.

At 2000 turns, read-only Send observation remained linear:
- `_beginSendAttempt()` probe: p50 `3.0 ms`, p95 `4.9 ms`, 4 qSA calls/sample, **8004 matches/sample**.
- `_sendEvidence()` probe: p50 about `2.7 ms`, p95 about `4.1 ms`, 8 qSA calls/sample, **8004 matches/sample**.
- Send-adjacent events: all zero.

### Desktop Firefox raw results
Configured profile at every size: viewport `412 x 915`, DPR `1`, `maxTouchPoints=0`, Firefox/Gecko user agent overridden by project config. This is Playwright desktop Firefox, not GeckoView or Firefox Android.

| Turns | DOM nodes | answer p50 | answer p95 | qSA calls/sample | qSA matches/sample | qSA time/sample |
|---:|---:|---:|---:|---:|---:|---:|
| 180 | 796 | 0 ms | 1 ms | 1 | 181 | 0.08 ms |
| 500 | 2076 | 1 ms | 2 ms | 1 | 501 | 0.12 ms |
| 1000 | 4076 | 1 ms | 2 ms | 1 | 1001 | 0.28 ms |
| 2000 | 8076 | 1 ms | 2 ms | 1 | 2001 | 0.44 ms |

Resource snapshots remained unchanged at active intervals `4`, active MutationObservers `3`, interval creates `5`, and observer observes `3`; panel count remained `1`; newest-answer, composer, Send visibility, and zero-actuation checks passed at every history size.

At 2000 turns:
- `_beginSendAttempt()` probe: p50 `2 ms`, p95 `3 ms`, 4 qSA calls/sample, **8004 matches/sample**.
- `_sendEvidence()` probe: p50 `2 ms`, p95 `3 ms`, 8 qSA calls/sample, **8004 matches/sample**.
- Send-adjacent events: all zero.

### Round-4 reference comparison
The Round-4 A4Y 180-message Pixel-7 lifecycle fixture observed the same device-class CSS width `412`, DPR `2.625`, and touch support and kept MutationObservers at `3 -> 3`, panel count `1`, and zero Send-adjacent events while exercising 12 wake-recovery bursts. A4's 180-turn long-chat read fixture likewise starts with four active intervals and three active observers and shows no additional resources during repeated reads. These are compatible resource-shape observations, not identical workloads or calibrated hardware timing comparisons.

### CI maintenance signals
- `npm ci` reported two pre-existing high-severity dependency findings.
- GitHub Actions reported Node-20 action-runtime deprecation warnings and forced affected actions onto Node 24.
These are maintenance signals, not A4 acceptance failures, and A4 changed no dependencies or release infrastructure.

## Acceptance Criteria
- Run long-chat fixture under configured Pixel-7 `chromium-mobile` on exact head: **PASS** — exact head `290c5e8...`, run `31173733483`, job `92851027653`.
- Measure scaling, active intervals/observers, panel count, host composer/latest-message usability, and zero Send-adjacent actuation: **PASS** — raw measurements above.
- Include desktop Firefox correctness where portable and distinguish it from GeckoView/Firefox-Android: **PASS** — 2/2 browser-project tests pass; limitation explicit.
- Compare against Round-4 180-message mobile reference without claiming identical hardware timing: **PASS** — comparison is limited to device/profile and resource/usability shape.
- State whether the chosen approach is practical for lower-end/mobile use based on measured trend and resource proxies: **PASS at the bounded emulation scope** — no resource accumulation or correctness failure was observed through 2000 turns, and answer p95 stayed in low single-digit milliseconds on hosted emulation; however the retained-history and Send-observation scans remain linear, so physical low-end-device efficiency is **NOT CERTIFIED**.

## Safety Checks
- Send authority unchanged: **PASS — no product change; all instrumented actuation counts zero**.
- CHOICE behavior unchanged: **PASS — no product change; stale terminal markers never override newest unfinished answer**.
- Route safety unchanged: **PASS — no product change; A3 fail-closed evidence remains authoritative**.
- Lease safety unchanged: **PASS — shared lease was claimed before writes and no product behavior changed**.
- Uncertain-Send behavior unchanged: **PASS — no product change and focused Send-journal tests passed 18/18**.
- `main` modified: **NO**.
- Merge / auto-merge / tag / publish / release: **NONE**.

## Risks and Limits
1. The grouped union remains history-linear: answer selector matches/sample rose `181 -> 2001` from 180 to 2000 turns in both browser projects. The optimization removed redundant overlapping selector streams; it did not make lookup asymptotically bounded.
2. The Send-observation path remains the dominant Ghost read-cost measured by this fixture at 2000 turns: 8004 matches/sample. It is safety-critical and was deliberately not weakened.
3. Pixel-7 Playwright is device emulation. This is not physical Android CPU, memory, battery, thermal, scheduler, or resource-pressure evidence.
4. Playwright Firefox here is desktop Gecko with a narrow viewport and mobile-looking UA, not Firefox-Android/GeckoView certification.
5. Hosted-CI wall-clock timing is descriptive, not a calibrated low-end hardware budget. The stronger cross-run evidence is stable selector cardinality, resource accumulation proxies, correctness, and zero actuation.
6. The deterministic retained-DOM fixture may differ from future ChatGPT virtualization or host DOM changes. A final audit must keep that limitation visible.
7. A persistent MutationObserver/index remains a credible future alternative if physical-device, larger-history, or future host-DOM evidence falsifies the stateless collector's practicality; current A4 evidence does not justify that added state complexity.

## Recommended Next Action
Mark `R5-A4-LONGCHAT-MOBILE-PERF` submitted and activate `R5-A5-LONGCHAT-AUDIT`. The auditor should independently verify A1/A2X/A3/A4 source and artifact bindings, compare raw cardinality/timing trends, challenge whether the benchmark discriminates the accepted stateless design, preserve the unresolved linear Send-observation cost, reject physical-device/GeckoView overclaims, and certify only the bounded deterministic long-chat objective if the evidence supports it.

## Assignment Status
- `R5-A4-LONGCHAT-MOBILE-PERF`: **submitted**
