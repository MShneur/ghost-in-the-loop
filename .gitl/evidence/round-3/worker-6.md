# Ghost Worker Evidence

## Identity
- Round: 3
- Worker: 6
- Role: Devil's Advocate / release auditor executing the active Red Team certification role
- Assignment ID: `R3-A3-RR-REDTEAM-CERT`
- Started at: `2026-08-07T01:51:18Z`
- Finished at: `2026-08-07T02:06:04Z`

## State Read
- Branch: `agent/8.8-repair-resume`.
- Starting coordination head before this lease: `fabf5fe1e00681d5b06fb8e94c052a6048928a69`.
- Lease: `scheduled-agent-6` for `R3-A3-RR-REDTEAM-CERT`, acquired at `2026-08-07T01:51:18Z`, expiring at `2026-08-07T02:36:18Z`.
- Dependencies: `R3-A2-RR-PROVEN-FAILURE-REPAIR:submitted` and `R3-A2B-RR-TICKER-SINGLE-FLIGHT-REPAIR:submitted`.
- Exact product head under audit: `5c057fe2235da50c23c800f7c345bc3814f01b3c`.
- Branch comparison from the exact product head to the audit start showed only coordination/evidence changes; no later product mutation invalidated the tested content.

## Step Performed

Independently attempted to falsify the A2B passing claim rather than accepting the prior worker summary.

1. Reviewed the Round 3 supervisor evidence and the complete Worker 3 A1/A2/A2B evidence chain.
2. Inspected product commit `5c057fe2235da50c23c800f7c345bc3814f01b3c`. It changes only `ghost-in-the-loop.user.js` and generated `extension/content.js`, with an identical four-line healthy-RUNNING no-op guard in `repairAndResume()`.
3. Inspected `runtimeServiceHealth()` and `repairAndResume()` at that exact commit. The no-op requires `priorState === 'RUNNING'`, `needsRepair === false`, and an empty blocker list. `send-journal`, `route-changed`, and `tab-lock-held` therefore cannot enter the no-op. A CHOICE state also cannot enter it because CHOICE sets the loop state to `CHOICE` and `needsPayload=true`; the later resume predicate only permits prior `RUNNING` or `PAUSED && !needsPayload`.
4. Inspected the exact production-path fixture. It instruments the real transformed userscript and proves first-repair/second-repair restart counts, twelve rapid requests, zero submit/click/input/keydown events, unchanged composer value, route/lease/uncertain-send blocking, and stale-composer isolation.
5. Queried connected GitHub directly for original job `92743714584`. Checkout, exact-head/lease guard, dependency/browser setup, parity/lint/unit/browser gates, evidence collection, and artifact upload all completed successfully.
6. Read the original job logs. The checked-out SHA and expected SHA were both `5c057fe2235da50c23c800f7c345bc3814f01b3c`; all six recorded gate exit codes were zero.
7. Queried and independently downloaded original artifact `8978979561`. Its GitHub digest is `sha256:5571ab9e56cfc537a99bf6f6f488cdc10b44b9b13fefcb60128e6275f144bb66`. Inside the artifact, `head.txt` binds tested and expected heads to `5c057fe...`, `status.txt` records every gate as zero, Chromium reports 4 passed, mobile Chromium reports 4 passed, Firefox reports 5 passed with one intended Chromium-mobile-only skip, and the unit log reports 42 suites / 471 tests passed.
8. Verified draft PR #14 is closed, unmerged, and targeted isolated base `gitl/r3-a2b-ci-base`, not `main`.
9. Detected an important run-level nuance: GitHub later re-ran workflow run `31138679335`. The latest attempt has job `92746238803` and fails the old A2B lease guard before tests because the lease no longer belongs to `scheduled-agent-4`. That later guard failure does not invalidate the pinned original job `92743714584` or artifact `8978979561`; it demonstrates that stale execution is rejected. Future citations must identify the exact job/artifact rather than describe the run ID alone as currently successful.

No falsifying safety or correctness failure was found in the bounded Repair & Resume slice. A2 and A2B are accepted for this round, and `RR-E2E-FAULTS` is certified on the pinned exact-head evidence.

## Research Sources
- Repository evidence: `.gitl/evidence/round-3/worker-1.md` — establishes the Round 3 recovery objective and Firefox matrix repair.
- Repository evidence: `.gitl/evidence/round-3/worker-3.md` — records A1 blocker, A2 reproduction, A2B product repair, exact job/artifact IDs, and claimed safety results.
- Repository evidence: commit `5c057fe2235da50c23c800f7c345bc3814f01b3c` — the complete product diff under audit.
- Repository evidence: `ghost-in-the-loop.user.js` at `5c057fe...` — health model, blocker ordering, CHOICE-sensitive resume state, and repaired no-op implementation.
- Repository evidence: `tests/e2e/repair-resume-production.spec.js` and `tests/e2e/repair-resume.spec.js` at `5c057fe...` — executable restart, non-dispatch, blocker, stale-node, mobile, and Firefox assertions.
- Connected GitHub Actions: run `31138679335`, original job `92743714584`, original artifact `8978979561` — authoritative exact-head execution evidence.
- Connected GitHub PR metadata: draft PR #14 — closed, unmerged, isolated non-main base.
- Inference: the healthy-running no-op does not refresh `GHOST.lastRepair` or render a new detail. This may leave the last-repair diagnostic showing the prior repair after a harmless repeated request. It is an observability/UI follow-up, not a demonstrated Send, CHOICE, route, lease, uncertainty, or restart safety failure.

## Changes
- Added `.gitl/evidence/round-3/worker-6.md` with this independent audit.
- No product source, generated product artifact, test assertion, or workflow carrier was changed by this assignment.
- The round plan and autopilot state are to be updated only for the audit verdict, human-review transition, and lease release.
- No temporary product or CI files were created.

## Tests
- Independent exact-head binding review: PASS — original job `92743714584` checked out `5c057fe2235da50c23c800f7c345bc3814f01b3c` and passed its exact-head/active-lease guard.
- `npm run check:generated`: PASS in original exact-head job/artifact.
- `npm run lint`: PASS in original exact-head job/artifact.
- `npm test -- --runInBand`: PASS — 42 suites, 471 tests.
- `npx playwright test tests/e2e/repair-resume-production.spec.js --project=chromium`: PASS — 4 passed.
- `npx playwright test tests/e2e/repair-resume-production.spec.js --project=chromium-mobile`: PASS — 4 passed.
- `npx playwright test tests/e2e/repair-resume.spec.js --project=firefox`: PASS — 5 passed, 1 intended Chromium-mobile-only skip.
- Original artifact `8978979561`: PASS — digest and internal head/status/log files independently checked.
- Later re-run attempt: EXPECTED FAIL-CLOSED — job `92746238803` failed the obsolete A2B lease guard before setup/tests after lease ownership changed; it is not substituted for the original certified job.
- New product test execution by Worker 6: NOT RUN — this audit independently verified the exact existing command logs/artifact and inspected the product/tests; no product mutation occurred during A3.

## Acceptance Criteria
- Passing evidence is genuine rather than synthetic or stale: PASS — exact SHA appears in checkout, guard, artifact metadata, artifact `head.txt`, and the product commit.
- Original run/job/artifact binding is exact and durable: PASS — run `31138679335`, original job `92743714584`, artifact `8978979561`, digest `5571ab9e...`.
- First paused-ticker repair starts exactly once: PASS — production fixture and executed Chromium/mobile logs.
- Second same-task repair adds zero ticker starts: PASS — production fixture and executed Chromium/mobile logs.
- Twelve rapid same-task repair requests add exactly one ticker start total: PASS — production fixture and executed Chromium/mobile logs.
- Send authority/non-actuation preserved: PASS — product diff does not touch Send; production path executed with zero submit/click/input/keydown events.
- CHOICE behavior preserved: PASS BY SOURCE + EXISTING TEST CONTRACT — the new no-op is RUNNING-only, while CHOICE sets state `CHOICE` and `needsPayload=true`; the repair path does not convert CHOICE to RUNNING.
- Route safety preserved: PASS — route change remains a blocker and executed production blocker test is green.
- Lease safety preserved: PASS — foreign tab lease remains a blocker; the later stale CI attempt itself fails the assignment lease guard.
- Uncertain-Send safety preserved: PASS — unsafe send journal remains a blocker and executed production blocker test is green.
- Composer/stale-node safety preserved: PASS — repeated replacement case is green and composer events/value remain untouched.
- Userscript/generated-extension parity preserved: PASS — identical repair guard diff plus exact-head generated check exit 0.
- No later product mutation invalidates the tested result: PASS — post-product commits before A3 are coordination/evidence only.
- Independent audit found a release-blocking RR defect: NO.

## Safety Checks
- Send authority unchanged: PASS.
- CHOICE behavior unchanged: PASS.
- Route and lease safety unchanged/fail-closed: PASS.
- Uncertainty safeguard unchanged/fail-closed: PASS.
- No `main` modification: PASS.
- No merge or auto-merge: PASS; PR #14 closed unmerged.
- No tag, publish, or GitHub Release action: PASS.

## Risks and Limits
- The workflow **run ID alone** is now ambiguous because a later re-run attempt failed the stale lease guard. The certified evidence is specifically original job `92743714584` plus artifact `8978979561` at exact product head `5c057fe...`. Auditors must keep that full binding.
- The healthy-running no-op records `repair_resume_noop` but does not update `GHOST.lastRepair`, `L.detail`, or call `render()`. This can leave diagnostics visually stale after a harmless duplicate repair request. No safety consequence was reproduced; track it as a later observability improvement rather than modifying the certified slice here.
- `npm ci` reports two high-severity dependency audit findings. They are not caused by this repair and were not shown to affect the RR behavior; they remain a separate dependency-maintenance concern.
- This certification covers the Round 3 Repair & Resume program slice only. The release is not publish-ready: frozen/discarded lifecycle, long-chat performance, structural mobile shell, build identity, docs reconciliation, and final certification/package programs remain outstanding.

## Recommended Next Action

Round 3 should transition to `awaiting-human-verification` in `review-after-round` mode. No later scheduled worker should open a new roadmap slice until human review accepts or reopens this audit. If accepted, the next supervisor should open the next dependency-safe round beginning with the next required program in priority order, `LIFECYCLE-FROZEN-DISCARDED`, while preserving all remaining required programs.

## Assignment Status
- accepted

## Round Verdicts
- `R3-A1-RR-CI-RECOVERY`: blocked historical attempt; not retroactively treated as a pass. Its blocker was superseded by the successful A2 recovery.
- `R3-A2-RR-PROVEN-FAILURE-REPAIR`: accepted — authoritative connected-GitHub-visible reproduction evidence established the concrete defect.
- `R3-A2B-RR-TICKER-SINGLE-FLIGHT-REPAIR`: accepted — exact product repair and clean pinned job/artifact evidence withstand independent review.
- `R3-A3-RR-REDTEAM-CERT`: accepted.
- `RR-E2E-FAULTS`: certified/completed for Round 3.
- Round 3: awaiting human verification; `publishReady` remains false.