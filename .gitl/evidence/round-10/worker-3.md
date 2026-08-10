# Ghost Worker Evidence

## Identity
- Round: 10 — native-site-takeover
- Worker: 3
- Role: Test Engineer / Red Team
- Assignment ID: R10-CHATGPT-NATIVE-REDTEAM-1
- Started at: 2026-08-10T17:29Z
- Finished at: 2026-08-10T17:30Z

## State Read
- Branch: `feature/native-site-takeover`
- Starting head: `36bab0e8109ce7d9e24638489b3317d286738e67`
- Worker-2 carrier lineage: `f76129756f17a06685a5ae72b4ff8841e4b32def` -> `c3191df5af258f6f2ed8919ce0068e142ca41900` -> `36bab0e8109ce7d9e24638489b3317d286738e67`
- Lease state: no conflicting takeover product commit observed; Worker-2 workflow had completed before this review.
- Dependencies: `.gitl/user-directives/2026-08-10-native-site-takeover.md`, `.gitl/orchestration/four-worker-workforce.md`, `docs/NATIVE-SITE-TAKEOVER-PLAN.md`, `.gitl/orchestration/evidence-contract.md`, Worker-2 workflow run `31414109600`.

## Step Performed
Bounded falsification of Worker 2's exact current head and generated ChatGPT native-takeover artifact. I inspected the exact carrier commit, the deterministic production-slice script, the completed CI job, and the focused Playwright failure output. I did not patch product code or weaken assertions.

The falsification found a test-readiness defect that prevents the valid-structure cases from reaching their assertions: the generated `boot()` helper calls `page.waitForSelector('#gitl')`, whose default state is `visible`, while successful native takeover deliberately hides `#gitl` via `data-gitl-native-suppressed="1"` and `display:none`. The CI log repeatedly shows the locator resolving to the correctly suppressed hidden panel until timeout. The ambiguous-structure case, which correctly leaves the rail visible, passes. This pattern is internally consistent with a harness false negative rather than evidence that the valid native mount itself failed.

Because the focused Playwright gate failed, the workflow skipped `Commit tested product slice`; therefore there is **no committed Worker-2 product head yet** to certify. The branch head remains carrier/workflow machinery only.

A secondary coverage warning is visible in the focused unit regressions: all 45 tests pass, but their jsdom/vm harness logs `Boot phase "native-takeover" failed (non-critical, panel unaffected): Element is not defined`. That means those adjacent unit suites did not execute the takeover boot path in their harness. This is not a browser-product failure, but it limits what the 45 green tests prove about the new mount code.

## Research Sources
- Repository evidence: Worker-2 carrier script `scripts/apply-native-chatgpt-takeover.js` at `36bab0e8109ce7d9e24638489b3317d286738e67` deterministically injects the ChatGPT native manager and generated E2E tests.
- CI evidence: GitHub Actions run `31414109600`, job `93538901779`, artifact `9072775059` (SHA-256 `ac7d1203c5b24e0131c9d8bf1dc8f4056c4224bac0b5e61af4cded6b847aa270`).
- Inference: the six valid-path failures are readiness-harness failures because every failure times out waiting for `#gitl` to become visible while the log shows it already attached and intentionally native-suppressed; the ambiguous fallback path passes under the same build.

## Changes
- Files changed: this evidence file only.
- Product files changed by Worker 3: none.
- Generated artifacts: none by Worker 3.
- Temporary files: none.

## Tests
Worker-2 CI commands/results reviewed on exact head `36bab0e8109ce7d9e24638489b3317d286738e67`:

1. `node --check scripts/apply-native-chatgpt-takeover.js` — PASS after workflow quoting normalization.
2. `node scripts/apply-native-chatgpt-takeover.js` — PASS; production slice and focused tests generated in the CI worktree.
3. `npm run build:extension` — PASS.
4. `npm run lint` — PASS.
5. `npm run check:generated` — PASS.
6. `npx jest tests/choice-state.test.js tests/tablock.test.js tests/wake-recovery.test.js tests/directives.test.js tests/repo-nanny/composer-evidence.test.js --runInBand` — PASS, 5 suites / 45 tests; takeover boot degraded in harness with `Element is not defined` warnings.
7. `npx playwright test tests/e2e/native-chatgpt-takeover.spec.js --project=chromium --project=chromium-mobile` — FAIL, 2 passed / 6 failed after retries. Both ambiguous-structure fallback cases passed. The six valid-mount / Send-replacement / repair cases all timed out in `boot()` waiting for visible `#gitl` even though the log shows the panel attached and intentionally suppressed.
8. Workflow conclusion: FAIL. `Commit tested product slice` skipped. No new product commit was created.

CI:
- Run: `31414109600` — failure.
- Job: `93538901779` — failure at `Native takeover production regressions`.
- Evidence artifact: `9072775059`.

## Acceptance Criteria
- Wrong-site/signature / ambiguous structure stays on rail with zero passive actuation: **PARTIAL PASS** — ambiguous reviewed Send structure passed on Chromium and Chromium Mobile; wrong-site/hidden-row cases were not independently reached in this failed generated suite.
- Exact Send identity preserved on valid mount: **NOT PROVEN** — intended assertion blocked by the readiness timeout before test body assertions.
- Passive Send/submit/input/keydown actuation = 0 on valid mount/repair: **NOT PROVEN** — intended assertions blocked by readiness timeout.
- Focus retention: **NOT PROVEN** — intended assertion blocked by readiness timeout.
- Send replacement fails closed and restores rail: **NOT PROVEN** — test never reached replacement step because `boot()` timed out on intentionally hidden `#gitl`.
- Action-row growth repairs only Ghost and never Send: **NOT PROVEN** — test never reached mutation step for the same readiness reason.
- Generated extension parity: **PASS in Worker-2 CI** — `build:extension`, lint, and `check:generated` passed before Playwright.
- Adjacent CHOICE/tab-lock/wake/directive/composer safety: **PASS with coverage limit** — 45/45 green, but native takeover boot was degraded in the jsdom harness and therefore those passes do not certify the new mount path.

## Safety Checks
- Send authority unchanged by Worker 3: PASS — no product changes.
- CHOICE behavior unchanged by Worker 3: PASS — no product changes.
- Route and lease safety unchanged by Worker 3: PASS — no product changes.
- `main`, `release/8.8.0-staging`, `agent/8.8-repair-resume`: untouched.
- No merge, auto-merge, tag, publish, release, or stable-channel mutation.

## Risks and Limits
- There is no committed tested product head yet. Red Team cannot certify an ephemeral generated worktree as the durable takeover product.
- The current E2E harness conflates "panel attached" with "panel visible", which is invalid under the native-takeover contract where successful structural ownership intentionally hides the rail panel.
- The 45 green adjacent unit tests carry a takeover-coverage gap because `Element` is absent from their vm global and the optional takeover phase degrades before executing.
- No claim is made here about live ChatGPT structure, physical devices, Firefox/WebKit, BrowserStack, or Checkly.

## Recommended Next Action
Smallest repair handoff to Worker 2:

1. Change only the generated native-takeover E2E `boot()` readiness condition so it waits for `#gitl` to be **attached** (or waits for the explicit boot/native state), not visible. Do not make the panel visible and do not weaken takeover assertions.
2. Re-run the exact Chromium + Chromium Mobile takeover suite. The valid-mount, Send-replacement, and repair tests must then reach their actual assertions.
3. If those assertions pass, allow the workflow to commit the tested product slice and hand that exact durable product SHA back to Worker 3.
4. Separately make the unit harness expose the browser `Element` constructor (or otherwise explicitly skip native boot in that harness with a documented scope) so future green adjacent tests do not silently degrade the new boot phase. This is coverage repair, not a reason to alter browser product logic.

## Assignment Status
- **rejected / repair required** — Worker-2 product slice is not yet a durable tested head. The immediate blocker is the generated E2E readiness bug, not evidence of a safe product failure.