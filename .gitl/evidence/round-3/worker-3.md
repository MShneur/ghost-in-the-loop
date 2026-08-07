# Ghost Worker Evidence

## Identity
- Round: 3
- Worker: 3 (assignment evidence slot)
- Successor agent: scheduled-agent-1 / nominal Worker 1 wake
- Role: Builder / test recovery successor
- Assignment ID: R3-A1-RR-CI-RECOVERY
- Started at: 2026-08-07T01:04:24Z
- Finished at: 2026-08-07T01:18:12Z

## State Read
- Branch: `agent/8.8-repair-resume`
- Starting inspected head: `a17099d5a17e8f7d313196635ae587a4bac6f440`
- Lease state: scheduled-agent-2 expired at `2026-08-07T00:56:27Z` without a durable Worker 3 handoff. Scheduled-agent-1 reclaimed A1 at commit `acf3696f266bdd0620321b7e5e1d62c8c6a6918f` after checking branch movement, combined commit statuses, and the connected GitHub commit-run endpoint.
- Dependencies: none.

## Step Performed

Executed the earliest ready assignment as a successor rather than waiting for the nominal Worker 3 slot. The prior carrier had again produced no durable handoff. I repaired the carrier itself so dependency setup, Playwright browser installation, and each required browser command are bounded and their exit codes/logs flow into an always-run handoff path. The hardened carrier was committed as `e7311f273fcb95c9e72f37623fa1fae83e9fa19f`.

I then repeatedly re-read the isolated branch through connected GitHub. Through `2026-08-07T01:18:12Z`, the branch remained exactly at `e7311f273fcb95c9e72f37623fa1fae83e9fa19f` and no Worker 3 result/log handoff appeared. Connected GitHub exposed no combined status for that head and its available commit-workflow lookup returned no run; that lookup is limited to pull-request-triggered runs, so a push-triggered run ID cannot be invented or treated as observed.

Because authoritative run/job IDs, logs, and browser command results are still absent, this assignment is blocked rather than falsely submitted as passing. The next assignment is made ready specifically to repair the execution/observability failure and obtain the browser evidence.

## Research Sources
- Repository evidence: `.gitl/evidence/round-2/worker-6.md` requires authoritative exact-head Firefox/Chromium/mobile execution before Repair & Resume certification.
- Repository evidence: `.gitl/evidence/round-3/worker-1.md` repaired the Firefox-only Playwright `isMobile` matrix error but explicitly left exact-head execution pending.
- Repository evidence: the prior A1 carrier could terminate during dependency setup or browser installation before reaching its evidence/state handoff step.
- Repository evidence: connected GitHub branch comparisons remained identical to `e7311f273fcb95c9e72f37623fa1fae83e9fa19f` during this invocation.
- Inference: a push-triggered run may have been queued or running, but the connected GitHub interface available to this worker did not expose such a run. No result is inferred from that uncertainty.

## Changes
- `.gitl/autopilot-state.json`: reclaimed the expired A1 lease and recorded the third stale-carrier recovery.
- `.github/workflows/r3-a1-exact-head.yml`: hardened setup/install/test execution with bounded timeouts, durable logs, explicit blocker routing, a remote-head guard, and an always-run handoff path.
- Claim commit: `acf3696f266bdd0620321b7e5e1d62c8c6a6918f`.
- Carrier commit: `e7311f273fcb95c9e72f37623fa1fae83e9fa19f`.
- Product source changed: no.
- Generated product artifacts changed: no.
- Temporary carrier is removed during the blocking handoff so any late run cannot push over the newer branch head; the carrier's own remote-head check also rejects that stale push.

## Tests
- `npx playwright test tests/e2e/repair-resume.spec.js --project=firefox`: NOT VERIFIED — no authoritative run/log handoff became visible.
- `npx playwright test tests/e2e/repair-resume-production.spec.js --project=chromium`: NOT VERIFIED — no authoritative run/log handoff became visible.
- `npx playwright test tests/e2e/repair-resume-production.spec.js --project=chromium-mobile`: NOT VERIFIED — no authoritative run/log handoff became visible.
- Relevant exact-head CI: BLOCKED — connected GitHub did not expose a run/job ID for the push-triggered carrier, and the branch did not receive the carrier's durable result commit during the bounded observation window.
- Full unit suite: NOT RUN — outside this execution-only assignment and no product code changed.
- Certification: NOT CLAIMED.

## Acceptance Criteria
- Firefox no longer executes Chromium-only `isMobile` context: NOT PROVEN BY EXECUTION — code repair exists, exact command evidence remains absent.
- Firefox-safe narrow viewport coverage remains executable: NOT PROVEN BY EXECUTION.
- Production-path fixture runs on exact-head Chromium: NOT PROVEN.
- Production-path fixture runs on Pixel 7 Chromium: NOT PROVEN.
- Zero Send actuation and restart assertions are recorded: NOT PROVEN BY EXECUTION.
- Failure creates the next ready repair assignment rather than stopping: PASS — A2 is activated with the carrier/execution blocker and exact continuation.

## Safety Checks
- Send authority unchanged: PASS — no product source modification.
- CHOICE behavior unchanged: PASS.
- Route and lease safety unchanged or strengthened: PASS — lease was claimed before writes; the hardened carrier verifies lease/head and refuses a stale final push.
- No `main`, merge, auto-merge, tag, release, or publish action: PASS.

## Risks and Limits

The exact browser result is still unknown. A push-triggered GitHub Actions run may exist outside the connected run-list surface available here; therefore absence of a visible run is not proof that no run started. The blocking handoff deliberately moves the branch and removes the temporary carrier, causing any late carrier attempt to fail its remote-head guard rather than overwrite newer coordination state.

The repeated failure mode is now narrower: the project does not primarily need another blind carrier rewrite; it needs an execution path whose run/job identity and logs are observable through the connected GitHub surface, followed by the same three exact browser commands.

## Recommended Next Action

Claim `R3-A2-RR-PROVEN-FAILURE-REPAIR`. Treat the proven failure as CI carrier dispatch/observability, not a product defect. Use an execution path that connected GitHub can enumerate (for example, a head-bound job on an already-recognized workflow or a PR-visible run without merging), obtain exact run/job IDs and logs for all three required commands, and change product code only if those results reproduce a real defect. Preserve zero-Send, restart, CHOICE, route, lease, and uncertainty safeguards.

## Assignment Status
- blocked

---

# R3-A2 Observable Execution Recovery

## Identity
- Round: 3
- Worker: 3 (assignment evidence slot)
- Executing agent: scheduled-agent-3 / nominal Worker 3 wake
- Role: Builder / CI observability recovery
- Assignment ID: `R3-A2-RR-PROVEN-FAILURE-REPAIR`
- Started at: `2026-08-07T01:22:00Z`
- Finished at: `2026-08-07T01:27:32Z`

## State Read
- Branch: `agent/8.8-repair-resume`
- Starting inspected head: `0a82a186656b2bec0d889e7699f9c45005c9fe26`
- A1 status at takeover: blocked with the carrier-dispatch/observability failure and no active lease.
- Lease claim commit: `1b61f554a91d036c9ef2c334a6d4557fc7efd5b7`.
- Lease holder during execution: `scheduled-agent-3` for `R3-A2-RR-PROVEN-FAILURE-REPAIR`.
- Dependency gate: satisfied by `R3-A1-RR-CI-RECOVERY:blocked`.

## Step Performed

Repaired the execution-observability blocker without touching product code. I created a temporary PR-visible exact-head Actions path, because the connected GitHub run lookup can enumerate pull-request-triggered runs. To preserve the prohibition on modifying or merging `main`, the temporary draft PR targeted an isolated CI base branch, `gitl/r3-a2-ci-base`, rather than `main`.

The exact head under test was `65a5b94c8e31644b56a614fa1c404873451798ce`. Draft PR #13 was opened only as an execution carrier, never merged, and closed after evidence was collected. GitHub Actions run `31137892852`, job `92741313903`, checked out exactly that SHA and passed the branch/lease guard before setup and browser execution.

This succeeded in converting the prior observability uncertainty into authoritative browser evidence. It also reproduced a real product defect: Repair & Resume restarts the ticker more than once for the same paused task in Chromium and Pixel 7 Chromium.

## Changes
- `.gitl/autopilot-state.json`: claimed A2 lease before all A2 writes.
- Temporary isolated-branch workflow: `.github/workflows/r3-a2-observable-exact-head.yml` was added, exercised through PR #13, then removed from `agent/8.8-repair-resume` at cleanup commit `0fc8fcbe54c556d8e057b3b35aa2633bc1d4ac77`.
- Temporary CI base branch: `gitl/r3-a2-ci-base`; its listener workflow was removed at cleanup commit `b0f2a42b7d9f810fb5d990d9dcfff6c4aea4484d`.
- Draft PR #13: closed at `2026-08-07T01:27:32Z`, merged: false.
- Product source changed: no — A2's allowed files did not permit product implementation before a reproduced defect.
- Test assertions weakened: no.

## Authoritative CI Evidence
- Exact tested head: `65a5b94c8e31644b56a614fa1c404873451798ce`.
- Workflow run ID: `31137892852`.
- Workflow job ID: `92741313903`.
- Workflow job conclusion: `failure` because the required Chromium legs failed; setup, browser installation, Firefox, artifact upload, and exact-head guard completed successfully.
- Evidence artifact: `r3-a2-exact-head-evidence`, artifact ID `8978698975`.
- Artifact ZIP SHA-256: `b52e8c5b28329f12a2e9575050ac66bc5c8d17a9c40566761802aedf33c31157`.
- Artifact size: `1070307` bytes.

## Tests
- `npm ci`: PASS.
- `npx playwright install --with-deps chromium firefox`: PASS.
- `npx playwright test tests/e2e/repair-resume.spec.js --project=firefox`: PASS — 5 passed, 1 Pixel-class mobile-only case skipped as intended under Firefox.
- `npx playwright test tests/e2e/repair-resume-production.spec.js --project=chromium`: FAIL — 2 failed, 2 passed after retry policy.
- `npx playwright test tests/e2e/repair-resume-production.spec.js --project=chromium-mobile`: FAIL — same 2 failures, 2 passed after retry policy.
- Full unit suite: NOT RUN — outside this bounded execution/observability recovery assignment and no product source changed.

## Proven Product Failure

Desktop Chromium and Pixel 7 Chromium reproduce the same two restart-coalescing defects in `tests/e2e/repair-resume-production.spec.js`:

1. `repairs a real paused ticker fault once and never actuates Send`
   - First repair starts the failed ticker once as expected.
   - A second same-task repair starts it again.
   - Assertion at line 117 expected ticker-start delta `0`; received `1`.

2. `rapid same-task repair requests restart the failed ticker exactly once`
   - Twelve rapid requests are not coalesced.
   - Assertion at line 142 expected ticker-start delta `1`; received `12`.

The two fail-closed safety cases in the same production suite passed on both Chromium projects: route/lease/uncertain-Send blockers remained blocked, and repeated composer replacement left stale nodes untouched. The failing restart assertions occur before the affected tests reach their later zero-Send event assertions, so this evidence does not claim those two failing cases independently proved zero Send actuation.

## Acceptance Criteria
- Repair the CI carrier dispatch/observability blocker: PASS — connected GitHub exposed exact run/job IDs and logs.
- Exact-head binding: PASS — checkout and guard recorded `65a5b94c8e31644b56a614fa1c404873451798ce`.
- Setup/install outcome is durable and visible: PASS.
- Firefox exact command: PASS.
- Desktop Chromium exact command: FAIL — real product restart defect reproduced.
- Pixel 7 Chromium exact command: FAIL — same real product restart defect reproduced.
- Product code changed only after reproduction: PASS — no product change was made in this bounded recovery assignment.
- Failure creates the next bounded recovery assignment rather than stopping: PASS — handoff requires a ticker single-flight product repair before Red Team certification.

## Safety Checks
- Send authority weakened: no.
- CHOICE behavior changed: no.
- Route safeguards changed: no.
- Lease safeguards changed: no.
- Uncertainty safeguards changed: no.
- `main` modified: no.
- PR merged: no.
- Auto-merge enabled: no.
- Tag/release/publish action: none.

## Risks and Limits
- The current candidate has a confirmed restart/idempotence defect on desktop Chromium and Pixel 7 Chromium; Red Team certification must remain blocked until it is repaired and rerun.
- Firefox is green for the focused browser fault contract, but that does not substitute for the failing Chromium production path.
- `npm ci` reported two high-severity dependency audit findings. They were not the cause of this assignment's failures and are not being remediated within this bounded assignment.
- The temporary base branch remains as an inert coordination branch because the connected GitHub surface available in this invocation exposes no branch-delete action; its temporary workflow has been removed and PR #13 is closed.

## Recommended Next Action

Claim `R3-A2B-RR-TICKER-SINGLE-FLIGHT-REPAIR` regardless of nominal worker number. Make the smallest product repair that ensures one paused-task repair starts the ticker once, a second same-task repair adds zero starts, and twelve rapid same-task repairs still add exactly one start. Preserve zero-Send, CHOICE, route, lease, composer-staleness, and uncertainty guards. Rerun both Chromium production projects plus the Firefox focused regression before handing off to independent Red Team certification.

## Assignment Status
- submitted — the A2 execution/observability blocker is repaired and authoritative evidence has converted the uncertainty into a concrete product-repair assignment.

---

# R3-A2B Ticker Single-Flight Repair

## Identity
- Round: 3
- Worker: 3 (assignment evidence slot)
- Executing successor: scheduled-agent-4 / nominal Worker 4 wake
- Role: Builder assignment executed with test-engineer / Red Team lens
- Assignment ID: `R3-A2B-RR-TICKER-SINGLE-FLIGHT-REPAIR`
- Started at: `2026-08-07T01:30:00Z`
- Finished at: `2026-08-07T01:40:03Z`

## State Read
- Branch: `agent/8.8-repair-resume`.
- Starting head before lease claim: `22b0894247048cd4cf70b3edaf9e61754b9a8295`.
- Lease claim commit: `e560ff7f4e1d86ab2b7c47dac1a10d4c6cdc27a9`.
- Dependency gate: satisfied by `R3-A2-RR-PROVEN-FAILURE-REPAIR:submitted`.
- Reproduction source: run `31137892852`, job `92741313903`, artifact `8978698975`; desktop and Pixel 7 Chromium had proved duplicate ticker starts while Firefox was green.

## Step Performed

The root cause was local and narrow. `repairAndResume()` always stopped and restarted the ticker after a successful first repair, even when a repeated request arrived while the loop was already `RUNNING` and `runtimeServiceHealth()` reported no repairable service and no blocker. That made a healthy same-task repair request destructive instead of idempotent.

The product repair adds one fail-safe early no-op for exactly that healthy-running case:

- prior state is `RUNNING`;
- `before.needsRepair` is false; and
- `before.blocked.length` is zero.

The no-op records `repair_resume_noop` and returns without stopping or restarting services. Paused repairs still enter the original repair path, genuine running faults still enter the original repair path because `needsRepair` is true, and blocker evaluation remains ahead of every destructive repair path except the healthy no-op case where there is explicitly no blocker.

The userscript was changed first and `npm run build` regenerated `extension/content.js`; the resulting product commit is `5c057fe2235da50c23c800f7c345bc3814f01b3c` (`fix: make repair ticker restart single-flight`).

## Changes
- `ghost-in-the-loop.user.js`: added the healthy-running idempotence guard in `repairAndResume()`.
- `extension/content.js`: regenerated from the userscript, preserving source parity.
- Product commit: `5c057fe2235da50c23c800f7c345bc3814f01b3c`.
- No test assertions were weakened or edited.
- A temporary PR-visible carrier was hosted only on isolated branch `gitl/r3-a2b-ci-base` and draft PR #14; it was never merged and was closed after evidence collection. Its workflow was removed from the temporary base at cleanup commit `f22900d2e10e0d2190d995478d60aee63bf0f444`.

## Authoritative CI Evidence

### Repair execution run
- Workflow run: `31138510677`.
- Job: `92743174453`.
- Starting/guarded head: `e560ff7f4e1d86ab2b7c47dac1a10d4c6cdc27a9`.
- Result: success.
- Artifact: `8978918757`, `r3-a2b-ticker-repair-evidence`.
- Artifact ZIP SHA-256: `7263b3fc771e392f20d8a62676faa47d4f4ac31b777013ca9c403fa59f6a0e48`.
- This run applied the minimal patch in the checked-out worktree, regenerated the extension, ran all gates successfully, then committed the exact tested product content as `5c057fe2235da50c23c800f7c345bc3814f01b3c`.

### Clean exact-head verification run
- Exact tested head: `5c057fe2235da50c23c800f7c345bc3814f01b3c`.
- Workflow run: `31138679335`.
- Job: `92743714584`.
- Job conclusion: success.
- Artifact: `8978979561`, `r3-a2b-exact-head-evidence`.
- Artifact ZIP SHA-256: `5571ab9e56cfc537a99bf6f6f488cdc10b44b9b13fefcb60128e6275f144bb66`.
- The exact-head guard recorded both tested and expected head as `5c057fe2235da50c23c800f7c345bc3814f01b3c`.

## Tests
- `npm run check:generated`: PASS, exit 0.
- `npm run lint`: PASS, exit 0.
- `npm test -- --runInBand`: PASS — 42 suites, 471 tests.
- `npx playwright test tests/e2e/repair-resume-production.spec.js --project=chromium`: PASS — 4 passed.
- `npx playwright test tests/e2e/repair-resume-production.spec.js --project=chromium-mobile`: PASS — 4 passed.
- `npx playwright test tests/e2e/repair-resume.spec.js --project=firefox`: PASS — 5 passed, 1 intended Pixel-class mobile-only case skipped under Firefox.
- The same parity/lint/unit/browser gate set also passed in the repair execution run before the product commit, and the second run re-proved it against the committed exact head.

## Acceptance Criteria
- First repair of a paused ticker fault starts the ticker exactly once: PASS — production-path Chromium and Pixel 7 cases pass.
- Second same-task repair adds zero ticker starts: PASS — the previously failing assertion now passes on both Chromium projects.
- Twelve rapid same-task repair requests add exactly one ticker start total: PASS — the previously failing assertion now passes on both Chromium projects.
- Desktop Chromium production path: PASS — 4/4.
- Pixel 7 Chromium production path: PASS — 4/4.
- Firefox focused regression: PASS — 5 passed, 1 intended skip.
- No submit, click, input, or keydown Send actuation in repaired production paths: PASS — the production-path test named `repairs a real paused ticker fault once and never actuates Send` passes on both Chromium projects; Firefox's production-repair non-dispatching contract also passes.
- Composer value and stale composer nodes remain untouched: PASS — stale-node production case passes on desktop and mobile Chromium.
- Route, lease, and uncertain-Send blockers remain fail closed: PASS — dedicated production-path blocker case passes on desktop and mobile Chromium; Firefox blocker case passes.
- Userscript/generated extension parity: PASS — generated check exit 0 on the exact committed head.

## Safety Checks
- Send authority weakened: no; no Send path was changed.
- CHOICE behavior changed: no.
- Route safeguards changed: no.
- Lease safeguards changed: no; repository lease was claimed before product writes and CI guarded the active holder/assignment.
- Uncertain-Send safeguards changed: no.
- Composer-staleness safeguards changed: no.
- `main` modified: no.
- PR merged or auto-merged: no; PR #14 closed unmerged.
- Tag/release/publish action: none.

## Risks and Limits
- `npm ci` still reports two high-severity dependency audit findings. They are not caused by this repair and were not modified inside this bounded assignment; they remain a separate dependency-maintenance concern.
- The temporary CI base branch remains as an inert coordination branch because no branch-delete action is exposed to this worker. Its workflow has been removed and PR #14 is closed.
- This is not final release certification. Independent A3 Red Team falsification is still required before the RR-E2E-FAULTS program can advance.

## Recommended Next Action

Claim `R3-A3-RR-REDTEAM-CERT` on the next eligible wake regardless of nominal worker number. Independently falsify the clean exact-head result at `5c057fe2235da50c23c800f7c345bc3814f01b3c`, verify the run/job/artifact binding is genuine and current, challenge the healthy-running no-op against Send/CHOICE/route/lease/uncertainty boundaries, and either certify this Repair & Resume slice or reopen the earliest concrete failure as a bounded successor assignment.

## Assignment Status
- submitted
