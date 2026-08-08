# Ghost Worker Evidence — R6 XA5X CI Hygiene Recovery

## Identity
- Round: 6
- Nominal worker: 3
- Intended assignment role: CI hygiene / test verifier
- Executed role: successor CI-hygiene test verifier with builder lens
- Assignment ID: `R6-XA5X-CI-HYGIENE-RECOVERY`
- Program: `MOBILE-SHELL-STRUCTURAL`
- Started at: `2026-08-08T03:20:00Z`
- Finished bounded classification step: after ordinary clean-head run `31237140275` completed at approximately `2026-08-08T03:28:39Z`; no later product mutation occurred in this step.
- Canonical maker observed first: Personal-Forge `CHATGPT_AUTOMATION_MAKER.md` v1.1
- User authority: `.gitl/user-directives/2026-08-07-release-pressure.md`

## State Read
- Branch: `agent/8.8-repair-resume`
- Starting head before lease claim: `5cd1ad8e0bc0f6251ca00f18fa45c3b137d62404`
- Starting state blob: `7841298b15e799ff736b4f7c19ad0f79167e628d`
- Lease claim commit: `4d24d43b41623a5c2ffda1313a505976475a2e52`
- Lease holder: `scheduled-worker-3-r6-xa5x-ci-hygiene-04`
- Lease window: `2026-08-08T03:20:00Z` through `2026-08-08T04:05:00Z`
- XA5 final audit was submitted and XA5X was the earliest ready executable assignment. Research fallback was ineligible.
- R4/R5 bounded certifications remain accepted with their explicit limits. Read-only live ChatGPT inspection remains authorized, but current authenticated ChatGPT and Claude structural insertion remain technically UNKNOWN and are not promoted by this assignment.

## Step Performed
Executed the smallest CI-hygiene recovery required by the XA5 final audit:

1. Removed only the stale `xa2x` job from `.github/workflows/test.yml`; the deleted `.github/xa2x-run.sh` remains absent.
2. Preserved ordinary unit and E2E workflow semantics otherwise unchanged.
3. Used a temporary self-removing Actions tracker only to bind the ordinary push-triggered clean-head run to exact run/job/artifact/log evidence because the connected status surface did not expose that push run directly.
4. Inspected the complete failing E2E job log and classified every reproduced failure before opening any repair.

Cleanup commit:

`53f49b2e7302317aa5bda9623cc2447a9b86659e` — `ci(gitl): remove stale XA2X verification job`

Temporary tracker machinery self-removed after writing:

`.gitl/evidence/round-6/xa5x-clean-head-ci-result.md`

Tracker result commit:

`9e06b972cf9a2be8b3a967c2ad6a1e78fda7d67d`

No product source was changed.

## Expert-Lens Review
### CI / release lens
The XA5 hygiene finding was real: `test.yml` retained a dead XA2X job after `.github/xa2x-run.sh` had already been removed. Removing that dead job was a safe reversible workflow cleanup and did not change ordinary test semantics.

### Builder lens
Do not react to an overall red E2E job with broad product edits. The exact logs separate three test-harness/project-routing failures from the already verified deterministic structural candidate.

### Independent test lens
The ordinary clean-head E2E failure is reproducible and therefore blocks Round-6 closure. It must create a smaller test-recovery assignment rather than be ignored or converted to a PASS.

### Red-Team lens
None of the three failure classes justifies weakening Send, CHOICE, route, lease, uncertainty, exact identity, clipping, demotion, mobile, accessibility, or timing thresholds. The correct repair is scope/structure correction with the original assertions preserved.

### User / usability lens
The structural candidate itself continues to pass its exact fixture-specific and hosted mobile evidence. This recovery avoids adding release scope and keeps live/physical claims explicitly bounded.

## Tests and CI
Ordinary clean-head CI target:

`53f49b2e7302317aa5bda9623cc2447a9b86659e`

GitHub Actions workflow:

`Ghost in the Loop — CI`

Run:

`31237140275`

### Unit / base certification
- Job: `93051648790` — **SUCCESS**
- The ordinary unit/base workflow completed successfully.
- Artifact: `9015795189` — `extension-base-certification`
- Artifact digest: `sha256:d7e7b04a675384bd0ca8177685dc69bd3b0ea336e7f38dd5b2fd1386b3866b7b`

### Full ordinary E2E
- Job: `93051648781` — **FAILURE**
- Result summary: **215 passed, 10 skipped, 6 failed**.
- Artifact: `9015838307` — `e2e-results`
- Artifact SHA-256: `6ea58a3c17cf0e960869b5e4b8e6fb2a3deac30fbae86f73d26f358b5723f921`

## Failure Classification
### Class A — lifecycle mobile fixture collected in the wrong projects
File: `tests/e2e/lifecycle-mobile-perf.spec.js`

The fixture itself states that its device-profile facts are meaningful only under the configured Pixel 7 / `chromium-mobile` project. In ordinary full-suite collection it also ran under desktop Chromium and desktop Firefox:

- desktop Chromium failed because width was `1280` while the mobile-only oracle requires `<=500`;
- desktop Firefox failed because `maxTouchPoints` was `0` while the Pixel-class oracle requires `>0`;
- the same fixture **passed under `chromium-mobile`** in the same run.

Classification: **Playwright project-routing/configuration failure, not a reproduced lifecycle product failure.**

Smallest repair: scope this root mobile fixture only to `chromium-mobile`, while preserving the separate `tests/e2e/long-chat/lifecycle-mobile-perf.spec.js` Firefox correctness lane.

### Class B — Repo-Nanny Send evidence file contains a nested Playwright test declaration
File: `tests/e2e/repo-nanny/send-evidence.spec.js`

The second top-level test is missing its closing `});` before the later contenteditable test declaration. The later `test(...)` is therefore evaluated from inside a running test, producing:

`Playwright Test did not expect test() to be called here.`

The same structural declaration error reproduced in Chromium, chromium-mobile, and Firefox.

Classification: **test-file structure/declaration bug, not a reproduced Send-safety failure.**

Smallest repair: close the preceding test before declaring the contenteditable case and remove the redundant trailing close. Preserve all Send assertions and expected one-click / one-confirmation semantics unchanged.

### Class C — Round-5 A2 Chromium timing oracle collected in Firefox
File: `tests/e2e/long-chat-perf-a2.spec.js`

The historically certified R5 A2 execution command was explicitly:

`npx playwright test tests/e2e/long-chat-perf-a2.spec.js --project=chromium`

Its numerical p95 gates were calibrated and accepted for that Chromium execution. Ordinary full-suite collection also ran the same timing oracle in Firefox, where the 180-turn p95 exceeded the Chromium threshold. The separate Round-5 A4 long-chat cross-browser correctness fixture continued to pass in Firefox during this clean-head run.

Classification: **project-routing/oracle-scope drift, not evidence that the accepted bounded Round-5 result should be reopened or that its threshold should be loosened.**

Smallest repair: run `long-chat-perf-a2.spec.js` only in Chromium, preserve all original thresholds unchanged, and retain the separate Firefox correctness lane.

## Acceptance Criteria
- Remove residual `xa2x` job and leave no reference to deleted runner: **PASS**.
- Preserve ordinary unit/E2E workflow semantics apart from stale-carrier cleanup: **PASS by exact workflow diff scope**.
- Ordinary clean-head base/lint/unit path: **PASS** via job `93051648790`.
- Ordinary full `npm run test:e2e`: **FAIL**, classified into three bounded test-routing/structure classes above.
- Exact run/job/artifact/log evidence: **PASS**.
- Weaken assertions to obtain green CI: **NO**.
- Round-6 closure: **NOT YET ELIGIBLE** because ordinary E2E remains red.

## Safety Checks
- Product userscript changed: **NO**.
- Extension runtime changed: **NO**.
- Send authority changed: **NO**.
- CHOICE behavior changed: **NO**.
- Route behavior changed: **NO**.
- Lease semantics weakened: **NO**.
- Uncertainty/fail-closed behavior weakened: **NO**.
- Exact identity, clipping, demotion, mobile, accessibility, or timing assertions loosened: **NO**.
- Live ChatGPT/Claude structural activation or certification: **NO**.
- Physical Android/WebView/GeckoView/real IME/AT/calibrated hardware certification: **NO**.
- `main`, merge, auto-merge, tag, publish, release: **NONE**.

## Risks and Limits
- The ordinary full E2E suite is still red, so the final Round-6 closure condition remains unsatisfied.
- Class A and C are project-routing errors; fixing them must not silently remove required coverage. The intended chromium-mobile and Firefox correctness lanes must remain explicit.
- Class B is a syntax/structure error in the test declaration. The repair must not change Send behavior or expected evidence semantics.
- Two high-severity npm audit findings remain a later dependency/release-audit risk; no blanket dependency upgrade is authorized here.
- Current live ChatGPT and Claude structural insertion remain UNKNOWN. Deterministic/hosted evidence remains bounded and must not be promoted to live-host or physical-platform claims.

## Recommended Next Action
Create and execute `R6-XA5Y-ORDINARY-E2E-ROUTING-TEST-RECOVERY` before research or BUILD-IDENTITY.

It should make only the three smallest test-only repairs justified by this exact run:

1. project-scope the root lifecycle mobile fixture to `chromium-mobile` only;
2. restore top-level sibling structure in Repo-Nanny `send-evidence.spec.js` without weakening assertions;
3. project-scope the R5 A2 exact timing oracle to Chromium only while retaining its unchanged thresholds and the separate Firefox correctness fixture.

Then rerun ordinary clean-head CI and bind exact run/job/artifact evidence. A new product-semantic failure, if one appears after those repairs, must create its own smallest recovery.

## Assignment Status
- `R6-XA5X-CI-HYGIENE-RECOVERY`: **blocked — stale XA2X residue removed and unit/base path green; ordinary full E2E reproduced six failures in three bounded test-routing/structure classes; XA5Y recovery required before Round-6 closure**.
