# Ghost Worker Evidence

## Identity
- Round: 4
- Worker: 6
- Role: Devil's Advocate / release auditor
- Assignment ID: `R4-A5-LIFECYCLE-AUDIT`
- Started at: `2026-08-07T08:05:29Z`
- Finished at: `2026-08-07T08:12:18Z`

## State Read
- Isolated branch: `agent/8.8-repair-resume`.
- Round-4 product head at start: `5c057fe2235da50c23c800f7c345bc3814f01b3c`.
- Coordination head inspected before claim: `adf79226da2c8141ace501d3af7656a31de58553`.
- A5 lease claim commit: `343df18495e20d9fbe13efd94b79df84438a06dd`.
- Lease holder: `scheduled-agent-6-lifecycle-audit`; acquired `2026-08-07T08:05:29Z`; expires `2026-08-07T08:50:29Z`.
- Dependencies A1/A1X/A2/A3/A3X/A4/A4X/A4Y were all durably submitted before A5 claim.
- `.gitl/deferred-questions.md` is absent. No human question blocks this bounded audit.
- `publishReady` was false and remains false.

## Step Performed

Independently attempted to falsify the Round-4 lifecycle certification rather than accepting the prior worker summaries.

1. Read the canonical Personal-Forge automation maker first, then the project state, round plan, orchestration README, universal task prompt, evidence contract, succession rule, all Round-4 worker evidence, and the prior Round-3 Worker-6 audit pattern.
2. Compared the Round-4 starting product head `5c057fe...` with the live isolated branch. Across the Round-4 delta there is no change to `ghost-in-the-loop.user.js`, `extension/content.js`, or other product/generated implementation. Round 4 changed only `.gitl` coordination/evidence, lifecycle documentation, Playwright configuration, and lifecycle tests.
3. Rechecked the lifecycle contract against current authoritative platform documentation. `visibilityState=hidden` means not visible/background/minimized/screen-locked, not proof of freeze or discard. `pageshow` may occur for new loads, BFCache/history restores, background tabs, and mobile frozen-page restoration; `PageTransitionEvent.persisted` is the cache discriminator used by the deterministic BFCache fixture. Chromium's Page Lifecycle documentation distinguishes hidden, frozen, and discarded states; exposes `freeze`/`resume`; states that discard has no event at discard time; and documents `document.wasDiscarded` as a next-load signal with platform-support limitations.
4. Inspected the exact source-contract test, production lifecycle fixture, adversarial Red-Team fixture, Pixel-7 mobile/performance fixture, and Playwright project configuration. The fixtures preserve a single visible wake gate, RUNNING-only ticker restart, CHOICE non-resumption, route/lease/uncertain-Send fail-closed behavior, stale-node non-actuation, and zero submit/click/input/keydown lifecycle actuation.
5. Re-verified A3X's test-only cache-cardinality correction. Commit `531263f41ee6c416eecafcf5f8ac0f8d74a0dd27` changes only two assertions from exact cache-helper count `1` to a bounded `1..2`; exact ticker/heartbeat/bus/redetect cardinality and all Send-safety assertions remain unchanged. This matches the accepted contract, which applies exact-once semantics to the runtime-service rebuild sequence rather than every idempotent private cache-helper invocation.
6. Re-read authoritative connected-GitHub job logs for A3X exact-head execution. Job `92770260104` checked out and guarded exact head `4196712b579cb5ed388850b1717bc0a53d00f7f6`; focused lifecycle Jest passed 2/2 suites with 12 tests passed and 3 explicit TODOs, adversarial Chromium passed 4/4, and production lifecycle Chromium passed 7/7.
7. Re-verified the A4X failure rather than treating it as a hidden pass. Job `92785122646` failed the Pixel-7 fixture after collecting the mobile metrics; artifact `8983863803` is bound to head `cfa67d16000aadbd5ddaaf2ce1e1acc4c477ad75` and SHA-256 `54ce80517b04843f213cf8766de5aff63c2f6b3fc2cabbaa3f97613cbd7efcb6`. The deterministic failure was synthetic layout width `981 > 500`, while the Pixel-7 UA, DPR and touch profile were active and the lifecycle/resource/zero-Send metrics had already been collected.
8. Re-verified A4Y's root-cause repair from the commit itself. Commit `c2b2372ce961a5045810445c6184e9e2804babb4` changes only `tests/e2e/lifecycle-mobile-perf.spec.js` by adding `<meta name="viewport" content="width=device-width, initial-scale=1">` to the synthetic HTML document. It does not relax `width<=500`, alter product code, or change lifecycle/resource/Send/accessibility assertions.
9. Re-read authoritative job `92787723447`. It checked out and guarded exact head `53497095439feaff586454ca778560db287ff2aa`, ran `npx playwright test tests/e2e/lifecycle-mobile-perf.spec.js --project=chromium-mobile`, and passed 1/1. Artifact `8984194701` was uploaded with SHA-256 `19e40dac68753597703defdfe3e57b2e7c1f44f08cafbe775037b948e7aeb0ce`.
10. Independently downloaded and decoded artifact `8984194701`, rather than relying only on the prior prose summary. The reporter records the exact git commit `534970...`; Pixel-7 profile width `412`, DPR `2.625`, touch `1`; 12 separated wake windows with ticker `1`, heartbeat `1`, bus-init `1`, redetect `1`, and cache invalidation `2` each; active intervals `4 -> 5`; active MutationObservers `3 -> 3`; lock records `1`; Ghost panels `1`; zero submit/click/input/keydown events; preserved input value `unchanged`; preserved Send control; and latest message `Latest answer 179`.
11. Identified an evidence-binding nuance in that artifact: Playwright's CI metadata names pull-request merge commit `377cbecb...`, while its `gitCommit.hash` is the actual checked-out test head `534970...`. Therefore the PR merge SHA must never be used by itself as tested-head proof. The exact checkout guard, job log, and `gitCommit.hash` provide the authoritative binding.
12. Verified temporary carrier PRs used in the lifecycle chain were closed unmerged on isolated bases; A4Y PR #19 is closed, draft, unmerged, base `gitl/r4-a4y-ci-base`. No Round-4 carrier was merged to `main`.
13. Did not rerun the already exact, passing test matrix. No product or test mutation occurred after the certified test heads that would make another run discriminating; a new rerun would add little evidence and would conflict with the maker's diminishing-returns rule. Independent log/artifact/source inspection was the higher-value audit step.

## Authoritative Platform Audit

The accepted lifecycle contract remains supportable, with these bounds:

- Visibility/background: MDN `Document.visibilityState` — https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilityState. Hidden is a visibility condition, not a frozen/discarded classification.
- `pageshow`: MDN — https://developer.mozilla.org/en-US/docs/Web/API/Window/pageshow_event. It can occur on initial/navigation loads, history/BFCache restoration, a background tab, prerendering, and mobile frozen-page restoration, so the event alone is not proof the page is currently user-visible.
- BFCache/cache discriminator: MDN `PageTransitionEvent.persisted` — https://developer.mozilla.org/en-US/docs/Web/API/PageTransitionEvent/persisted. The property indicates a cache-backed load and is the explicit discriminator the fixture uses.
- Freeze/resume/discard: Chrome Page Lifecycle API — https://developer.chrome.com/docs/web-platform/page-lifecycle-api. Frozen and discarded are distinct from merely hidden; `freeze`/`resume` are Chromium lifecycle signals; discard has no event at discard time; and `document.wasDiscarded` is checked on a later load where available.

No audit claim treats these browser/platform documents as proof that the synthetic Playwright event injection is a physical browser freeze or a physical-device discard.

## Exact Evidence Audit

### A1 / A1X contract
- Contract commit: `03c67625255803ae3b0b0fd662af3bf407996e0d`.
- Exact execution head: `79de931a689c731a680ae4c1e1360f0ec4ad9ce7`.
- Run/job: `31143832068` / `92759102485`.
- Result: lifecycle Jest 2/2 suites; 12 passed; 3 explicit TODOs; zero failures.
- Audit: accepted. The three TODOs remain explicit source-contract TODO markers; later Playwright fixtures supply deterministic browser-harness evidence, but they do not convert the TODO labels into physical-browser lifecycle proof.

### A2 production fixture
- Fixture commit: `10bece4cef59c13f17ad97882aafcbfe15597b84`.
- Product change: none.
- Exact execution recovered by A3X at head `4196712...`.
- Result: production lifecycle Chromium 7/7 after A3X contract adjudication.
- Audit: accepted.

### A3 Red Team
- Exact head: `7e8dfda0e22143bdea17f34cd9a37490d0ad8236`.
- Run/job: `31145488389` / `92763921605`.
- Artifact: `8981325698`, SHA-256 `acbaae68856146ac2693ff1e27290c1ab6252b331ecb46d426ca74353d4e131e`.
- Result: focused lifecycle Jest PASS; adversarial Chromium 4/4 PASS; production lifecycle test exposed only the two cache-helper `expected 1 / observed 2` mismatches.
- Audit: accepted as a falsification assignment. It preserved the deterministic mismatch and handed it to a separate contract-audit recovery instead of weakening product safety.

### A3X cache-idempotence adjudication
- Test-only commit: `531263f41ee6c416eecafcf5f8ac0f8d74a0dd27`.
- Exact test head: `4196712b579cb5ed388850b1717bc0a53d00f7f6`.
- Run/job: `31147614614` / `92770260104`.
- Result: lifecycle Jest 2/2 suites (12 passed, 3 TODO); adversarial Chromium 4/4; production lifecycle Chromium 7/7.
- Artifact: none because all Playwright cases passed and the upload step used `if-no-files-found: ignore` for failure-report directories.
- Audit: accepted. Bounded cache invalidation is not equivalent to relaxing exact runtime-service or Send-safety behavior.

### A4 / A4X mobile-performance execution
- A4 defines bounded resource and accessibility proxies; it does not claim a calibrated physical-device speed budget.
- A4X exact head: `cfa67d16000aadbd5ddaaf2ce1e1acc4c477ad75`.
- Run/job: `31152568300` / `92785122646`.
- Artifact: `8983863803`, SHA-256 `54ce80517b04843f213cf8766de5aff63c2f6b3fc2cabbaa3f97613cbd7efcb6`.
- Result: deterministic FAIL because synthetic CSS layout width was `981`; semantic/resource/zero-Send metrics were captured before that assertion.
- Audit: accepted as exact failure/recovery evidence. It must not be reported as a PASS.

### A4Y viewport-fixture repair
- Fixture-only commit: `c2b2372ce961a5045810445c6184e9e2804babb4`.
- Exact test head: `53497095439feaff586454ca778560db287ff2aa`.
- Run/job: `31153444356` / `92787723447`.
- Artifact: `8984194701`, SHA-256 `19e40dac68753597703defdfe3e57b2e7c1f44f08cafbe775037b948e7aeb0ce`.
- Result: Pixel-7 `chromium-mobile` 1/1 PASS.
- Raw metric conclusions: width `412`; DPR `2.625`; touch `1`; 12/12 windows each ticker/heartbeat/bus/redetect exactly `1`; cache invalidation exactly `2` but still inside the accepted bounded `1..2`; intervals `4 -> 5`; observers `3 -> 3`; lock record `1`; panel count `1`; zero Send-adjacent events; original composer and Send control preserved; latest message visible.
- Audit: accepted.

## Independent Safety Review

- Round-4 implementation diff from product head `5c057fe...` to the audit branch contains no userscript or generated-extension product mutation. This makes a Round-4-introduced Send/CHOICE/route/lease/uncertainty implementation regression unlikely by construction; the browser tests independently exercise the relevant behavior.
- `tests/lifecycle-recovery-contract.test.js` asserts `recoverAfterWake` contains no `engineSend(`, remains RUNNING-only for restart, and has explicit uncertain-Send, route-change, and foreign-tab-lock fail-closed branches.
- `tests/e2e/lifecycle-redteam.spec.js` executes route-change, foreign-lease, dispatching/uncertain Send, and stale-composer scenarios with zero submit/click/input/keydown events.
- `tests/e2e/repair-resume-production.spec.js` executes persisted-page, resume, and fresh discarded-document fixtures with zero lifecycle Send actuation.
- `tests/e2e/lifecycle-mobile-perf.spec.js` repeats twelve Pixel-class wake windows with zero Send-adjacent events and preserved host input/Send/latest-message usability.
- No evidence supports any weakening of CHOICE, route, lease, uncertainty, or Send fail-closed safeguards.

## Unsupported Claims Rejected

The following are deliberately **not** certified:

1. A synthetic `document.dispatchEvent(new Event('freeze'))` is not evidence that Chromium actually suspended freezable task queues in that CI process. It proves only that Ghost does not actuate on that injected event and that a later synthetic `resume` routes through the tested recovery seam.
2. Fixture-injected `document.wasDiscarded=true` is not evidence that physical Android Chrome or Firefox Android exposes that property or that an actual resource-pressure discard occurred. It proves fresh-document boot remains IDLE under the discard classification seam.
3. Playwright's Pixel-7 `chromium-mobile` profile is emulation, not physical Android-device certification.
4. Playwright desktop Firefox/Gecko evidence elsewhere in the repository is not GeckoView/Firefox-Android certification; the Playwright configuration itself says so.
5. `cacheClearMs=0` in the A4Y reporter is timer-resolution/CI evidence only. It does not prove the second cache invalidation is free on a constrained phone, nor does Round 4 establish a calibrated low-end performance budget.
6. Playwright reporter `metadata.ci.commitHash=377cbecb...` is the temporary PR merge context and must not replace exact tested head `534970...`; the checkout guard and `metadata.gitCommit.hash` are the authoritative test-head binding.

## Assignment Verdicts

- `R4-SUPERVISOR-PLAN`: **accepted**.
- `R4-A1-LIFECYCLE-CONTRACT`: **accepted**.
- `R4-A1X-LIFECYCLE-CONTRACT-EXEC`: **accepted**.
- `R4-A2-LIFECYCLE-BUILD`: **accepted** — test/fixture work was sufficient; no product implementation was required.
- `R4-A3-LIFECYCLE-REDTEAM`: **accepted** — the assignment successfully falsified an over-specified helper-count expectation and preserved the failure for adjudication.
- `R4-A3X-LIFECYCLE-CACHE-IDEMPOTENCE`: **accepted**.
- `R4-A4-LIFECYCLE-MOBILE-PERF`: **accepted with explicit emulation/performance limits**.
- `R4-A4X-LIFECYCLE-MOBILE-PERF-EXEC`: **accepted as exact failure/recovery evidence**, not as a passing test result.
- `R4-A4Y-LIFECYCLE-MOBILE-VIEWPORT-FIXTURE`: **accepted**.
- `R4-A5-LIFECYCLE-AUDIT`: **accepted**.

## Tests

- New product/test execution by Worker 6: **NOT RUN**. Independent exact-head logs, artifacts, source diffs, and fixture assertions were sufficient; no product/test mutation occurred after the relevant certified heads, so another rerun would not add discriminating evidence.
- A1X exact-head lifecycle Jest: **PASS — 2/2 suites, 12 passed, 3 TODO**.
- A3 exact-head Red Team: **PASS** for focused Jest and adversarial Chromium 4/4; production fixture **FAIL** only on cache-helper cardinality and was correctly routed to A3X.
- A3X exact-head lifecycle matrix: **PASS — Jest 12 pass + 3 TODO; Red Team Chromium 4/4; production lifecycle Chromium 7/7**.
- A4X exact Pixel-7 execution: **EXPECTED PRESERVED FAIL — width 981 > 500**.
- A4Y exact Pixel-7 execution: **PASS — 1/1, width 412**.
- A4Y artifact independent decode: **PASS — exact git head and raw metrics inspected**.

## Acceptance Criteria

- Source claims verified against authoritative platform documentation: **PASS**.
- Exact-head test/run/job/artifact binding verified where claimed: **PASS**, with the PR-merge-SHA nuance explicitly recorded.
- Generated parity verified where claimed: **PASS BY NO-CHANGE SCOPE** for Round 4 — there was no product/generated artifact mutation to reconcile; this audit does not invent a new `check:generated` run.
- Send/CHOICE/route/lease/uncertainty regression found: **NO**.
- Discard/freeze claims bounded to actual harness/platform evidence: **PASS**.
- Every Round-4 assignment given an audit verdict: **PASS**.
- Bounded lifecycle objective fully audited: **PASS**.
- Physical Android discard/freeze certified: **NO / OUT OF SCOPE OF CURRENT EVIDENCE**.
- Firefox-Android/GeckoView lifecycle certified: **NO / OUT OF SCOPE OF CURRENT EVIDENCE**.
- Calibrated low-end performance budget certified: **NO / OUT OF SCOPE OF CURRENT EVIDENCE**.

## Safety Checks

- Send authority unchanged by Round-4 product code: **PASS — no Round-4 product code change**.
- CHOICE behavior not weakened: **PASS by source contract + no product diff**.
- Route and lease safety fail closed: **PASS by exact adversarial Chromium**.
- Uncertain-Send safety fail closed: **PASS by exact adversarial Chromium**.
- Stale composer nodes remain non-actuating: **PASS by exact adversarial Chromium**.
- `main` modified: **NO**.
- Merge or auto-merge: **NONE**.
- Tag, publish, or GitHub Release: **NONE**.
- Temporary lifecycle carrier PRs used for evidence: **closed unmerged on isolated bases**.

## Risks and Limits

- The strongest Round-4 evidence is deterministic production-copy/harness evidence plus Chromium Pixel-class emulation. It is intentionally narrower than actual OS-level resource-pressure discard and scheduler freeze.
- The second cache invalidation remains a possible constrained-device optimization target. A4Y measured it as `0 ms` at the reporter's timing resolution, which is insufficient to prove zero cost on low-end physical hardware.
- The source-contract Jest file retains three explicit TODOs. Those TODO labels are not certification defects because the later production Playwright fixture covers the deterministic semantics, but they are also not converted into browser-real freeze/discard evidence.
- `npm ci` in the execution jobs reports two pre-existing high-severity dependency audit findings and GitHub Actions emits Node-action deprecation warnings. Round 4 did not modify dependencies; these remain separate maintenance risks and do not falsify the bounded lifecycle result.
- Exact evidence citations should include job/artifact/tested-head together rather than relying only on a workflow run ID or Playwright PR-merge metadata.

## Round Recommendation

`LIFECYCLE-FROZEN-DISCARDED` is **certified for the bounded Ghost 8.8 lifecycle-recovery objective**: deterministic BFCache-style persisted restore, Chromium-style resume routing, fresh-document discard semantics, duplicate-wake single-flight behavior, route/lease/uncertain-Send fail-closed handling, stale-node safety, and repeated Pixel-class mobile resource/cardinality/accessibility behavior all withstand independent review at their stated evidence level.

The certification must retain the explicit limits above. It is not physical Android or Firefox-Android certification, not proof of actual OS/browser discard or freeze scheduling in CI, and not a calibrated low-end performance guarantee.

Round 4 should transition to **`awaiting-human-verification`** in `review-after-round` mode. `publishReady` remains false because later required programs remain open. Scheduled workers should not open `LONG-CHAT-PERF` until the human review accepts this round; if the human reopens a specific lifecycle concern, the next supervisor should create only the smallest evidence-driven recovery.

## Assignment Status
- accepted

## Round Verdicts
- `R4-SUPERVISOR-PLAN`: accepted.
- `R4-A1-LIFECYCLE-CONTRACT`: accepted.
- `R4-A1X-LIFECYCLE-CONTRACT-EXEC`: accepted.
- `R4-A2-LIFECYCLE-BUILD`: accepted.
- `R4-A3-LIFECYCLE-REDTEAM`: accepted as falsification work; its deterministic cache-count mismatch was not retroactively erased and was resolved by A3X.
- `R4-A3X-LIFECYCLE-CACHE-IDEMPOTENCE`: accepted.
- `R4-A4-LIFECYCLE-MOBILE-PERF`: accepted with emulation/performance limits.
- `R4-A4X-LIFECYCLE-MOBILE-PERF-EXEC`: accepted as exact failure evidence leading to A4Y; not represented as a passing run.
- `R4-A4Y-LIFECYCLE-MOBILE-VIEWPORT-FIXTURE`: accepted.
- `R4-A5-LIFECYCLE-AUDIT`: accepted.
- `LIFECYCLE-FROZEN-DISCARDED`: certified/completed for Round 4 at the bounded evidence level stated above.
- Round 4: awaiting human verification; `publishReady` remains false.