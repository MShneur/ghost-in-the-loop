# Ghost Worker Evidence

## Identity
- Round: 4
- Worker evidence slot: 2
- Nominal executing wake: 6
- Intended role: Researcher / Architect
- Additional lens: Devil's Advocate / Release Auditor
- Assignment ID: `R4-A1-LIFECYCLE-CONTRACT`
- Started at: `2026-08-07T02:49:40Z`
- Finished at: `2026-08-07T02:58:30Z`

## State Read
- Branch: `agent/8.8-repair-resume`
- Starting branch head before lease claim: `b8afdd034b5e355cd3bb81aef688d66b3b84c743`
- Product head under lifecycle analysis: `5c057fe2235da50c23c800f7c345bc3814f01b3c`
- Lease state before claim: `null`.
- Lease claim commit: `e267673acf8637af94306d745fa3c41ce48975e8`.
- Lease holder: `scheduled-agent-6`, executing the Worker-2 researcher/architect assignment under succession rules.
- Dependencies: `R4-SUPERVISOR-PLAN:submitted` was satisfied.

## Step Performed

Mapped the production wake-recovery call graph, researched browser lifecycle semantics from primary sources, wrote an implementation-ready lifecycle fault matrix/contract, and added focused source-contract specification coverage without changing production code.

The repository currently has one central reactivation seam:

`visibilitychange / pageshow / focus / resume -> recoverAfterWake(source)`

`recoverAfterWake` is visible-only and single-flight, stops/rebuilds runtime services, pauses on unresolved Send / route change / foreign tab lease, and only restarts `RUNNING` state. `PAUSED` and `CHOICE` are not promoted to `RUNNING` by lifecycle activity. The userscript does not currently listen for Chromium `freeze` and does not inspect `document.wasDiscarded`. A fresh document initializes `GHOST.loop.state` to `IDLE`, so a true discarded-document reload does not automatically resurrect an in-memory `RUNNING` loop.

Durable contract: `docs/lifecycle-recovery-contract.md`.

Focused source-contract test: `tests/lifecycle-recovery-contract.test.js`.

## Research Sources

### Primary browser/platform sources

- Chrome Page Lifecycle API — https://developer.chrome.com/docs/web-platform/page-lifecycle-api
  - Implication: Chromium exposes `freeze`/`resume`; discarded state is not observable at discard time; restoration may be classified at new-document load with feature-detected `document.wasDiscarded`; freezable tasks are suspended while frozen. Do not generalize Chromium-only signals to Firefox or all Android contexts.
- web.dev BFCache — https://web.dev/articles/bfcache
  - Implication: `pageshow` is the portable BFCache observation point and `event.persisted === true` distinguishes a BFCache restoration; `freeze`/`resume` are Chromium-only Page Lifecycle events.
- WHATWG HTML navigation/history specification — https://html.spec.whatwg.org/multipage/nav-history-apis.html
  - Implication: `PageTransitionEvent.persisted` is the standards-level property for page transition persistence.
- MDN `Document.visibilityState` — https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilityState
  - Implication: hidden/visible is broad cross-browser visibility state, not proof that a page was frozen or discarded.
- MDN `pageshow` — https://developer.mozilla.org/en-US/docs/Web/API/Window/pageshow_event
  - Implication: pageshow is broadly available, can occur on initial navigation and restored/frozen history cases, and exposes `persisted`.

### Repository evidence

- `ghost-in-the-loop.user.js`: production `recoverAfterWake`, visibility/pageshow/focus/resume listeners, fail-closed Send journal logic, fresh `IDLE` loop bootstrap.
- `extension/content.js`: generated extension contains the same recovery seam.
- `tests/wake-recovery.test.js`: existing source-level wake contract for centralized recovery, Send non-actuation, one ticker rearm, runtime rebuild, and visibility/pageshow/focus routing.
- `.gitl/evidence/round-4/worker-1.md`: supervisor specifically identified frozen/discarded execution evidence as the next gap.

### Competing implementation philosophies

1. **Minimal recovery seam** — keep `recoverAfterWake` as the only reactivation path; add feature-detected discard classification and executable fixtures; do not add Chromium `freeze` teardown unless a concrete resource or lifecycle failure requires it.
   - Failure mode: disposable resources can remain open longer while hidden/frozen.
2. **Lifecycle-aware quiesce/resume** — add a narrow Chromium-only `freeze` quiesce path for disposable resources, but always reactivate through existing recovery.
   - Failure mode: browser-specific state machines can diverge, duplicate service churn, or accidentally alter loop state.

The contract favors the minimal seam until executable evidence proves the second approach necessary.

### Aggregate end-user/community lens

Recent Chrome user reports describe tabs reloading after brief backgrounding or memory pressure, including Android. Example: https://www.reddit.com/r/chrome/comments/1rqmon8/tabs_keep_refreshing_on_android_chrome/ . This is anecdotal secondary evidence, not a browser contract. Its implication is product priority: a fresh-document/discard path must fail safely without duplicate actions or silent stale-work continuation.

## Changes
- `docs/lifecycle-recovery-contract.md`
  - Commit: `03c67625255803ae3b0b0fd662af3bf407996e0d`
  - Adds source implications, lifecycle fault matrix, competing designs, deterministic test seams, and A2 implementation acceptance criteria.
- `tests/lifecycle-recovery-contract.test.js`
  - Commit: `44464967410f7c44a8f546fc189466a39fcd16a8`
  - Adds six executable source-contract assertions and three explicit TODO execution gaps for BFCache persisted restore, discard reload, and Chromium freeze.
- Production source changed: none.
- Generated artifacts changed: none.
- Temporary files/workflows added: none.

## Tests

### Existing exact-product-head evidence

A legacy `R3 A3 Red Team Exact Head` workflow was triggered by the branch push as run `31142660712`, job `92755596910`. Inspection of the job log proved it explicitly checked out old exact product head `5c057fe2235da50c23c800f7c345bc3814f01b3c`, not branch head `44464967410f7c44a8f546fc189466a39fcd16a8`. It therefore **cannot** be used as execution evidence for the newly added lifecycle contract test.

On the pinned product head, that run completed the existing gates with:

- generated parity: exit 0
- lint: exit 0
- unit suite: exit 0
- Chromium Repair & Resume: exit 0
- mobile Chromium Repair & Resume: exit 0
- Firefox Repair & Resume: exit 0

Artifact from that legacy run: `8980336750`, SHA-256 `467d0a61836f599643dcd9ae3f92f50fbd92802b6748c9b219fd9c3b81cecaa6`.

These results corroborate that unchanged production wake/send safeguards remain green on the product head, but they do not execute this assignment's new test file.

### Required A1 test execution

- `npm test -- --runInBand tests/wake-recovery.test.js`: existing equivalent coverage is included in the pinned product-head unit suite above, but no exact branch-head focused command result was retrievable.
- `npx jest tests/lifecycle-recovery-contract.test.js --runInBand`: **NOT EXECUTED on exact branch head**. The connected GitHub surface exposed the stale exact-product-head workflow, while the current A1 assignment does not authorize adding `.github/workflows/**` to create a guarded execution carrier. Local/container network access could not clone/install the public repo.

Because the newly added required lifecycle test remains unexecuted on the branch head, this worker does not claim A1 complete.

## Acceptance Criteria
- Inventory current `recoverAfterWake` listeners and service rebuild in userscript and extension: **PASS** — source inspected in both generated surfaces.
- Define expected background/foreground, BFCache, freeze/resume, and discarded-document outcomes: **PASS** — durable fault matrix in `docs/lifecycle-recovery-contract.md`.
- Define RUNNING/PAUSED/CHOICE outcomes and uncertain-Send fail-closed behavior: **PASS**.
- Identify deterministic Playwright/Jest injection points without persistent debug API: **PASS**.
- Define exactly-once timer/observer/heartbeat/lock recovery and zero Send assertions: **PASS**.
- Add focused specification/failing fixture coverage when feasible: **PASS** — focused source-contract test committed; explicit TODOs preserve the unimplemented browser-real execution cases.
- Cite authoritative primary sources for browser/platform claims: **PASS**.
- Execute all required focused tests on the assignment head: **FAIL / NOT EXECUTED** — new lifecycle contract test has not been run on exact branch head.

## Safety Checks
- Send authority unchanged: **PASS** — no production source changed; contract explicitly requires zero Send actuation.
- CHOICE behavior unchanged: **PASS** — no production source changed; contract forbids lifecycle promotion of CHOICE.
- Route and lease safety unchanged: **PASS** — no production source changed; current recovery pauses on route/foreign lease blockers.
- Uncertainty behavior unchanged: **PASS** — no production source changed; unresolved Send remains fail-closed.
- No `main`, merge, auto-merge, tag, release, or publish action: **PASS**.

## Risks and Limits
- The source-contract test is not a browser-real proof of BFCache, frozen, or discarded lifecycle behavior.
- `document.wasDiscarded` must remain feature-detected and cannot be used to imply Firefox or universal Android support.
- The existing push-triggered `R3 A3 Red Team Exact Head` workflow is stale orchestration machinery: it runs on branch pushes but intentionally tests old product head `5c057fe...`. It is useful for preserving RR evidence but is misleading if interpreted as CI for new coordination/test commits.
- `npm ci` in the legacy run still reports two high-severity dependency audit findings; this assignment did not change dependencies.
- Older orchestration text still contains global review-freeze language inconsistent with user-authorized Policy B. That control-plane drift is outside A1's allowed files and was not modified here.

## Recommended Next Action

Activate a minimal execution-evidence recovery assignment before A2. It should be allowed to use `tests/**` and a temporary guarded `.github/workflows/**` carrier if necessary, check out the exact branch head containing `tests/lifecycle-recovery-contract.test.js`, run:

`npx jest tests/wake-recovery.test.js tests/lifecycle-recovery-contract.test.js --runInBand`

and remove temporary workflow machinery afterward. If the focused tests pass, mark A1 submitted and immediately activate `R4-A2-LIFECYCLE-BUILD`. If they fail, preserve the exact failure and route the smallest correction.

## Assignment Status
- blocked — contract/specification work is durable, but required exact-head execution evidence for the new lifecycle test is missing.

---

# R4-A1X Lifecycle Contract Execution Recovery

## Identity
- Round: 4
- Worker evidence slot: 2
- Nominal executing wake: 2
- Intended role: Researcher / Architect — execution recovery
- Assignment ID: `R4-A1X-LIFECYCLE-CONTRACT-EXEC`
- Started at: `2026-08-07T03:11:49Z`
- Finished at: `2026-08-07T03:17:24Z`

## State Read
- Branch: `agent/8.8-repair-resume`.
- Dependency: `R4-A1-LIFECYCLE-CONTRACT:blocked` was satisfied exactly as the recovery assignment requires.
- Lease before claim: `null`.
- Lease claim commit: `b372c35e1f27f8ade422550eded787d93fc2763b`.
- Lease holder: `scheduled-agent-2`.
- No active exact-head workflow was found before the claim; the previous visible lifecycle-adjacent workflow on `b6fddcb9af98b99cf2272597664e6f9da1468d90` was already completed.

## Step Performed

Obtained connected-GitHub-visible exact-branch-head execution evidence for the focused lifecycle contract tests without changing product behavior.

The first temporary push-only carrier commit `c6601c0cd3b90b730ed896e447039b3f19ffd2fd` was not observable through the connector's PR-run surface. Rather than treating absence of visibility as success, the carrier was narrowed to an existing isolated draft PR surface and made explicitly PR-visible in commit `79de931a689c731a680ae4c1e1360f0ec4ad9ce7`.

The guarded carrier checked out **exactly** `79de931a689c731a680ae4c1e1360f0ec4ad9ce7`, verified the actual Git head equaled the expected PR head, installed dependencies, and ran only the required focused Jest command.

After success, the temporary workflow was removed in commit `20cb29497a6e8b4ca897c08f88f7ebfae4c288bd`.

## Research / Competing Lenses

No new external research was performed because an executable recovery assignment existed and the maker/succession rules prohibit replacing ready work with research.

The execution method did apply two operational philosophies:

1. **Push-only carrier:** smallest workflow surface, but connector observability was insufficient for authoritative run/job evidence.
2. **PR-visible isolated carrier:** slightly broader trigger surface, but produced connected-GitHub-visible exact-head run/job/log evidence without targeting `main` or merging.

The second method won on the assignment's explicit observability requirement. The legacy R3 workflow also fired, but its job `92758568585` checked out old product head `5c057fe2235da50c23c800f7c345bc3814f01b3c`; it was explicitly rejected as proof for A1X.

## Changes
- Lease coordination commit: `b372c35e1f27f8ade422550eded787d93fc2763b`.
- Temporary workflow created: `.github/workflows/r4-a1x-lifecycle-exact-head.yml` at `c6601c0cd3b90b730ed896e447039b3f19ffd2fd`.
- Temporary workflow made PR-visible and exact-head guarded: `79de931a689c731a680ae4c1e1360f0ec4ad9ce7`.
- Temporary workflow removed after successful execution: `20cb29497a6e8b4ca897c08f88f7ebfae4c288bd`.
- Product source changed: **none**.
- Tests changed: **none**.
- Generated artifacts changed: **none**.

## Tests and CI

Authoritative exact-head execution:

- Tested commit: `79de931a689c731a680ae4c1e1360f0ec4ad9ce7`.
- Workflow: `R4 A1X Lifecycle Exact Head`.
- Run ID: `31143832068`.
- Job ID: `92759102485`.
- Required command: `npx jest tests/wake-recovery.test.js tests/lifecycle-recovery-contract.test.js --runInBand`.
- Guard: expected head = actual checked-out head = `79de931a689c731a680ae4c1e1360f0ec4ad9ce7`.
- Result: **PASS**.
- Test suites: **2 passed / 2 total**.
- Tests: **12 passed, 3 todo, 15 total**.
- Snapshots: 0.
- Jest time: 0.849 s.

The three TODOs remain intentionally explicit execution gaps for browser-real BFCache persisted restore, discarded-document classification/fresh-boot behavior, and Chromium freeze coverage. Passing A1X therefore validates the source-contract suite; it does **not** certify those later browser-real cases ahead of A2/A3/A4.

`npm ci` again reported two high-severity dependency audit findings. No dependency changes were authorized in this assignment.

## Acceptance Criteria
- Run wake-recovery and lifecycle-recovery-contract Jest on exact current branch head: **PASS** — exact tested head `79de931a...`, run `31143832068`, job `92759102485`.
- Bind evidence to exact commit/run/job IDs: **PASS**.
- Temporary carrier guarded expected head: **PASS**.
- Temporary carrier removed after execution: **PASS** — cleanup commit `20cb29497a...`.
- On PASS mark A1 and A1X submitted and activate A2: **PENDING COORDINATION HANDOFF IN FOLLOWING COMMITS**.
- No product behavior change: **PASS**.

## Safety Checks
- Send authority unchanged: **PASS** — no product source changed.
- CHOICE behavior unchanged: **PASS** — no product source changed.
- Route/lease/uncertainty safeguards unchanged: **PASS** — no product source changed; shared coordination lease was used.
- No `main`, merge, auto-merge, tag, release, or publish action: **PASS**.
- Existing draft PR remained isolated from `main` and was not merged.

## Risks and Limits
- A1/A1X prove the lifecycle **contract/source assertions**, not full browser-real frozen/discarded recovery. The explicit TODOs must remain visible and feed A2/A3/A4 rather than being silently treated as certified behavior.
- The existing R3 A3 draft PR/workflow still auto-runs its old product-head certification on branch changes. It is not valid evidence for new Round 4 branch-head tests unless a future assignment explicitly rebinds it.
- Node action deprecation warnings appeared in CI; they did not affect the focused Jest result but are a future workflow-maintenance concern.
- Two high-severity dependency audit findings remain outside this assignment.

## Recommended Next Action

Mark both `R4-A1-LIFECYCLE-CONTRACT` and `R4-A1X-LIFECYCLE-CONTRACT-EXEC` submitted, activate `R4-A2-LIFECYCLE-BUILD`, and have the next eligible wake determine whether the accepted contract requires a minimal product change or only production-path lifecycle fixture coverage. Preserve the three browser-real TODO gaps for downstream Red Team/mobile certification.

## Assignment Status
- `R4-A1X-LIFECYCLE-CONTRACT-EXEC`: submitted — exact-head execution passed and temporary carrier was removed.
- `R4-A1-LIFECYCLE-CONTRACT`: eligible to transition from blocked to submitted because its sole blocker is resolved by the exact-head PASS above.
